// Store for company-side client management
import { writable, get, derived } from "svelte/store";
import type { UserProfile } from "$lib/types/user";
import {
  Timestamp,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "$lib/firebase";
import { toast } from "svelte-sonner";
import { activeCompanyId, companyContext } from "./companyContext";

interface ClientManagementState {
  clients: UserProfile[];
  loading: boolean;
  error: string | null;
  orderCounts: Record<string, number>;
}

function createClientManagementStore() {
  const store = writable<ClientManagementState>({
    clients: [],
    loading: false,
    error: null,
    orderCounts: {},
  });

  let unsubscribe: (() => void) | null = null;

  return {
    subscribe: store.subscribe,
    
    unsubscribe: () => {
      // Clean up the listener
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
      
      // Clear store data
      store.set({
        clients: [],
        loading: false,
        error: null,
        orderCounts: {},
      });
    },

    // Load invoice counts for all clients
    async loadInvoiceCounts() {
      try {
        const companyId = get(activeCompanyId);
        if (!companyId) return;

        // Get all orders for this company
        const ordersQuery = query(
          collection(db, "orders"),
          where("companyId", "==", companyId),
        );

        const querySnapshot = await getDocs(ordersQuery);
        const counts: Record<string, number> = {};

        querySnapshot.forEach((doc) => {
          const order = doc.data();
          const clientId = order.clientId;
          if (clientId) {
            counts[clientId] = (counts[clientId] || 0) + 1;
          }
        });

        store.update((state) => ({
          ...state,
          orderCounts: counts,
        }));
      } catch (error) {
        console.error("Error loading invoice counts:", error);
      }
    },

    // Load all clients for the current company
    async loadClients() {
      store.update((state) => ({ ...state, loading: true, error: null }));

      try {
        const companyId = get(activeCompanyId);
        if (!companyId) {
          store.update((state) => ({
            ...state,
            error: "No active company",
            loading: false,
          }));
          return;
        }

        // Clean up previous listener
        if (unsubscribe) {
          unsubscribe();
        }

        // Query Firebase for all clients, then filter by company association
        // Note: Firestore doesn't support complex array-contains queries easily
        const clientsQuery = query(
          collection(db, "users"),
          where("role", "==", "client"),
        );

        // Set up real-time listener
        unsubscribe = onSnapshot(
          clientsQuery,
          (querySnapshot) => {
            const clients: UserProfile[] = [];
            const seenIds = new Set<string>();

            querySnapshot.forEach((doc) => {
              const data = doc.data() as UserProfile;
              // Filter clients that are associated with this company
              const isAssociated = data.companyAssociations?.some(
                (assoc) => assoc.companyId === companyId,
              );

              if (isAssociated && !seenIds.has(doc.id)) {
                seenIds.add(doc.id);
                clients.push({
                  ...data,
                  uid: doc.id, // Override with document ID
                });
              }
            });

            store.update((state) => ({
              ...state,
              clients,
              loading: false,
              error: null,
            }));

            // Load invoice counts for these clients
            this.loadInvoiceCounts();
          },
          (error) => {
            console.error("Error listening to clients:", error);
            store.update((state) => ({
              ...state,
              error: error.message,
              loading: false,
            }));
          },
        );
      } catch (error) {
        console.error("Error setting up client listener:", error);
        store.update((state) => ({
          ...state,
          error:
            error instanceof Error ? error.message : "Failed to load clients",
          loading: false,
        }));
      }
    },

    // Create a new client account (invited status)
    async createClient(
      clientData: {
        email: string;
        firstName: string;
        lastName: string;
        phoneNumber?: string;
        address?: UserProfile["address"];
      },
      invitedBy: string,
    ) {
      try {
        const companyId = get(activeCompanyId);
        if (!companyId) {
          throw new Error("No active company");
        }

        // Generate invitation token and expiration
        const invitationToken = crypto.randomUUID();
        const invitationExpiresAt = Timestamp.fromDate(
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ); // 7 days

        const newClientData = {
          email: clientData.email,
          displayName: `${clientData.firstName} ${clientData.lastName}`,
          photoURL: null,
          isActive: false, // Invited clients start inactive
          lastLoginAt: Timestamp.now(),
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          firstName: clientData.firstName,
          lastName: clientData.lastName,
          phoneNumber: clientData.phoneNumber,
          emailNotifications: true,
          pushNotifications: true,
          theme: "system" as const,
          language: "en",
          role: "client" as const,
          permissions: [],
          address: clientData.address,
          companyAssociations: [
            {
              companyId,
              role: "member" as const,
              joinedAt: Timestamp.now(),
            },
          ],
          metadata: {
            accountStatus: "invited" as const,
          },
          invitationToken,
          invitationExpiresAt,
          invitedBy,
          invitationStatus: "pending" as const,
        };

        // Save to Firebase
        const docRef = await addDoc(collection(db, "users"), newClientData);
        const savedClient: UserProfile = {
          ...newClientData,
          uid: docRef.id,
        };

        // Don't update local state - the Firestore listener will pick up the new document

        // Send invitation email
        let emailSent = false;
        const invitationUrl = `${window.location.origin}/invite/${invitationToken}`;

        try {
          const { emailService, EmailTemplates } = await import(
            "$lib/services/emailService"
          );

          // Get company name
          const companyName =
            get(companyContext).data?.company.name || "Your Company";

          const emailTemplate = EmailTemplates.clientInvitation(
            savedClient.displayName ||
              `${savedClient.firstName} ${savedClient.lastName}`,
            companyName,
            invitationUrl,
          );

          await emailService.sendEmail({
            to: savedClient.email,
            subject: emailTemplate.subject,
            htmlBody: emailTemplate.htmlBody,
            textBody: emailTemplate.textBody,
          });

          emailSent = true;
        } catch (emailError) {
          console.error("Failed to send invitation email:", emailError);
          console.log("Invitation URL for manual sharing:", invitationUrl);
          // Don't fail the whole operation for email issues
        }

        // Show appropriate message based on email success
        if (emailSent) {
          toast.success("Client invitation sent successfully");
        } else {
          toast.warning(
            "Client invitation created, but email could not be sent. You can manually share this link: " +
              invitationUrl,
          );
        }

        return savedClient.uid;
      } catch (error) {
        console.error("Error creating client:", error);
        toast.error("Failed to create client invitation");
        throw error;
      }
    },

    // Add a new client directly without sending an invitation
    async addClient(clientData: {
      email: string;
      firstName: string;
      lastName: string;
      phoneNumber?: string;
      address?: UserProfile["address"];
    }) {
      try {
        const companyId = get(activeCompanyId);
        if (!companyId) {
          throw new Error("No active company");
        }

        const newClientData = {
          email: clientData.email,
          displayName: `${clientData.firstName} ${clientData.lastName}`,
          photoURL: null,
          isActive: true, // Added clients are active by default
          lastLoginAt: Timestamp.now(),
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          firstName: clientData.firstName,
          lastName: clientData.lastName,
          phoneNumber: clientData.phoneNumber,
          emailNotifications: true,
          pushNotifications: true,
          theme: "system" as const,
          language: "en",
          role: "client" as const,
          permissions: [],
          address: clientData.address,
          companyAssociations: [
            {
              companyId,
              role: "member" as const,
              joinedAt: Timestamp.now(),
            },
          ],
          metadata: {
            accountStatus: "added" as const, // Distinguish from invited clients
          },
          // No invitation fields for added clients
        };

        // Save to Firebase
        const docRef = await addDoc(collection(db, "users"), newClientData);
        const savedClient: UserProfile = {
          ...newClientData,
          uid: docRef.id,
        };

        // Don't update local state - the Firestore listener will pick up the new document

        toast.success("Client added successfully");

        return savedClient.uid;
      } catch (error) {
        console.error("Error adding client:", error);
        toast.error("Failed to add client");
        throw error;
      }
    },

    // Send invitation to an existing client
    async inviteClient(clientId: string, invitedBy: string) {
      try {
        const client = this.getClient(clientId);
        if (!client) {
          throw new Error("Client not found");
        }

        // Generate invitation token
        const invitationToken = crypto.randomUUID();
        const invitationExpiresAt = Timestamp.fromDate(
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ); // 7 days

        // Update client with invitation details
        const updatedClient = {
          ...client,
          invitationToken,
          invitationExpiresAt,
          invitedBy,
          invitationStatus: "pending" as const,
          metadata: {
            ...client.metadata,
            accountStatus: "invited" as const, // Update status to invited
          },
          updatedAt: Timestamp.now(),
        };

        // Update in Firebase
        await updateDoc(doc(db, "users", clientId), {
          invitationToken,
          invitationExpiresAt,
          invitedBy,
          invitationStatus: "pending",
          "metadata.accountStatus": "invited",
          updatedAt: Timestamp.now(),
        });

        // Update local state
        store.update((state) => ({
          ...state,
          clients: state.clients.map((c) =>
            c.uid === clientId ? updatedClient : c,
          ),
        }));

        // Send invitation email
        let emailSent = false;
        const invitationUrl = `${window.location.origin}/invite/${invitationToken}`;

        try {
          const { emailService, EmailTemplates } = await import(
            "$lib/services/emailService"
          );

          // Get company name
          const companyName =
            get(companyContext).data?.company.name || "Your Company";

          const emailTemplate = EmailTemplates.clientInvitation(
            client.displayName || `${client.firstName} ${client.lastName}`,
            companyName,
            invitationUrl,
          );

          await emailService.sendEmail({
            to: client.email,
            subject: emailTemplate.subject,
            htmlBody: emailTemplate.htmlBody,
            textBody: emailTemplate.textBody,
          });

          emailSent = true;
        } catch (emailError) {
          console.error("Failed to send invitation email:", emailError);
          console.log("Invitation URL for manual sharing:", invitationUrl);
          // Don't fail the whole operation for email issues
        }

        // Show appropriate message based on email success
        if (emailSent) {
          toast.success("Client invitation sent successfully");
        } else {
          toast.warning(
            "Client invitation created, but email could not be sent. You can manually share this link: " +
              invitationUrl,
          );
        }

        return clientId;
      } catch (error) {
        console.error("Error inviting client:", error);
        toast.error("Failed to send client invitation");
        throw error;
      }
    },

    // Update client information
    async updateClient(clientId: string, updates: Partial<UserProfile>) {
      try {
        // Update in Firebase
        const updateData = {
          ...updates,
          updatedAt: Timestamp.now(),
        };
        await updateDoc(doc(db, "users", clientId), updateData);

        // Update local state
        store.update((state) => ({
          ...state,
          clients: state.clients.map((client) =>
            client.uid === clientId
              ? { ...client, ...updates, updatedAt: Timestamp.now() }
              : client,
          ),
        }));

        toast.success("Client updated successfully");
      } catch (error) {
        console.error("Error updating client:", error);
        toast.error("Failed to update client");
        throw error;
      }
    },

    // Deactivate/reactivate client
    async toggleClientStatus(clientId: string, isActive: boolean) {
      try {
        await this.updateClient(clientId, {
          isActive,
          metadata: {
            ...this.getClient(clientId)?.metadata,
            accountStatus: isActive ? "active" : "inactive",
          },
        } as Partial<UserProfile>);
      } catch (error) {
        throw error;
      }
    },

    // Helper to get client by ID
    getClient(clientId: string): UserProfile | undefined {
      let client: UserProfile | undefined;
      store.subscribe((state) => {
        client = state.clients.find((c) => c.uid === clientId);
      })();
      return client;
    },

    // Delete client and all related data
    async deleteClient(clientId: string) {
      try {
        const companyId = get(activeCompanyId);
        if (!companyId) {
          throw new Error("No active company");
        }

        // Delete related data in order to avoid foreign key issues
        const deletePromises = [];

        // 1. Delete client's orders
        const ordersQuery = query(
          collection(db, "orders"),
          where("clientId", "==", clientId),
          where("companyId", "==", companyId),
        );
        const ordersSnapshot = await getDocs(ordersQuery);
        ordersSnapshot.forEach((doc) => {
          deletePromises.push(deleteDoc(doc.ref));
        });

        // 2. Delete client's document deliveries
        const deliveriesQuery = query(
          collection(db, "documentDeliveries"),
          where("clientId", "==", clientId),
        );
        const deliveriesSnapshot = await getDocs(deliveriesQuery);
        deliveriesSnapshot.forEach((doc) => {
          deletePromises.push(deleteDoc(doc.ref));
        });

        // 3. Delete client's email history
        const emailQuery = query(
          collection(db, "emailHistory"),
          where("recipient", "==", this.getClient(clientId)?.email || ""),
        );
        const emailSnapshot = await getDocs(emailQuery);
        emailSnapshot.forEach((doc) => {
          deletePromises.push(deleteDoc(doc.ref));
        });

        // 4. Delete client's invoices (if they exist in a separate collection)
        const invoicesQuery = query(
          collection(db, "invoices"),
          where("clientId", "==", clientId),
          where("companyId", "==", companyId),
        );
        const invoicesSnapshot = await getDocs(invoicesQuery);
        invoicesSnapshot.forEach((doc) => {
          deletePromises.push(deleteDoc(doc.ref));
        });

        // 5. Finally, delete the client document
        deletePromises.push(deleteDoc(doc(db, "users", clientId)));

        // Execute all deletions
        await Promise.all(deletePromises);

        // Update local state to remove the client
        store.update((state) => ({
          ...state,
          clients: state.clients.filter((c) => c.uid !== clientId),
        }));

        toast.success("Client and all related data deleted successfully");
      } catch (error) {
        console.error("Error deleting client:", error);
        toast.error("Failed to delete client");
        throw error;
      }
    },

    // Clear error
    clearError() {
      store.update((state) => ({ ...state, error: null }));
    },
  };
}

export const clientManagementStore = createClientManagementStore();
