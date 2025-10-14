// Store for company-side client management
import { writable } from "svelte/store";
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
  doc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "$lib/firebase";
import { toast } from "svelte-sonner";

interface ClientManagementState {
  clients: UserProfile[];
  loading: boolean;
  error: string | null;
}

function createClientManagementStore() {
  const store = writable<ClientManagementState>({
    clients: [],
    loading: false,
    error: null,
  });

  let unsubscribe: (() => void) | null = null;

  return {
    subscribe: store.subscribe,

    // Load all clients for the current company
    async loadClients(companyId: string) {
      store.update((state) => ({ ...state, loading: true, error: null }));

      try {
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

            querySnapshot.forEach((doc) => {
              const data = doc.data() as UserProfile;
              // Filter clients that are associated with this company
              const isAssociated = data.companyAssociations?.some(
                (assoc) => assoc.companyId === companyId,
              );

              if (isAssociated) {
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
      companyId: string,
    ) {
      try {
        // Generate invitation token
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

        // Update local state
        store.update((state) => ({
          ...state,
          clients: [...state.clients, savedClient],
        }));

        // Send invitation email
        try {
          const invitationUrl = `${window.location.origin}/invite/${invitationToken}`;
          const emailTemplate = await import("$lib/services/emailService").then(
            (module) =>
              module.EmailTemplates.clientInvitation(
                `${clientData.firstName} ${clientData.lastName}`,
                "Company Name",
                invitationUrl,
              ),
          );

          // Mock email sending - replace with actual email service
          console.log("Sending invitation email:", {
            to: clientData.email,
            template: emailTemplate,
          });

          // In real implementation:
          // await emailService.sendEmail({
          //   to: clientData.email,
          //   subject: emailTemplate.subject,
          //   htmlBody: emailTemplate.htmlBody,
          //   textBody: emailTemplate.textBody
          // });
        } catch (emailError) {
          console.error("Failed to send invitation email:", emailError);
          // Don't fail the whole operation for email issues
        }

        toast.success("Client invitation sent successfully");

        return savedClient.uid;
      } catch (error) {
        console.error("Error creating client:", error);
        toast.error("Failed to create client invitation");
        throw error;
      }
    },

    // Add a new client directly without sending an invitation
    async addClient(
      clientData: {
        email: string;
        firstName: string;
        lastName: string;
        phoneNumber?: string;
        address?: UserProfile["address"];
      },
      companyId: string,
    ) {
      try {
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

        // Update local state
        store.update((state) => ({
          ...state,
          clients: [...state.clients, savedClient],
        }));

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
        try {
          const invitationUrl = `${window.location.origin}/invite/${invitationToken}`;
          const emailTemplate = await import("$lib/services/emailService").then(
            (module) =>
              module.EmailTemplates.clientInvitation(
                client.displayName || `${client.firstName} ${client.lastName}`,
                "Company Name",
                invitationUrl,
              ),
          );

          // Mock email sending - replace with actual email service
          console.log("Sending invitation email:", {
            to: client.email,
            template: emailTemplate,
          });

          // In real implementation:
          // await emailService.sendEmail({
          //   to: client.email,
          //   subject: emailTemplate.subject,
          //   htmlBody: emailTemplate.htmlBody,
          //   textBody: emailTemplate.textBody
          // });
        } catch (emailError) {
          console.error("Failed to send invitation email:", emailError);
          // Don't fail the whole operation for email issues
        }

        toast.success("Client invitation sent successfully");

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

    // Clear error
    clearError() {
      store.update((state) => ({ ...state, error: null }));
    },
  };
}

export const clientManagementStore = createClientManagementStore();
