// Hook for company-side client management
import { writable } from "svelte/store";
import type { UserProfile } from "$lib/types/user";
import { Timestamp } from "firebase/firestore";
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

  return {
    subscribe: store.subscribe,

    // Load all clients for the current company
    async loadClients(companyId: string) {
      store.update((state) => ({ ...state, loading: true, error: null }));

      try {
        // Mock data for now - will be replaced with Firebase integration
        const mockClients: UserProfile[] = [
          {
            uid: "client-1",
            email: "john.doe@client.com",
            displayName: "John Doe",
            photoURL: null,
            isActive: true,
            lastLoginAt: Timestamp.fromDate(new Date("2024-01-15")),
            createdAt: Timestamp.fromDate(new Date("2024-01-01")),
            updatedAt: Timestamp.fromDate(new Date("2024-01-15")),
            firstName: "John",
            lastName: "Doe",
            phoneNumber: "+1-555-0123",
            emailNotifications: true,
            pushNotifications: true,
            theme: "light",
            language: "en",
            role: "client",
            permissions: [],
            metadata: {
              accountStatus: "active",
            },
          },
          {
            uid: "client-2",
            email: "jane.smith@client.com",
            displayName: "Jane Smith",
            photoURL: null,
            isActive: false,
            lastLoginAt: Timestamp.fromDate(new Date("2024-01-10")),
            createdAt: Timestamp.fromDate(new Date("2024-01-05")),
            updatedAt: Timestamp.fromDate(new Date("2024-01-10")),
            firstName: "Jane",
            lastName: "Smith",
            phoneNumber: "+1-555-0456",
            emailNotifications: true,
            pushNotifications: false,
            theme: "dark",
            language: "en",
            role: "client",
            permissions: [],
            metadata: {
              accountStatus: "invited",
            },
            invitationToken: "mock-token-123",
            invitationExpiresAt: Timestamp.fromDate(
              new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            ),
            invitedBy: "company-user-1",
            invitationStatus: "pending",
          },
        ];

        store.update((state) => ({
          ...state,
          clients: mockClients,
          loading: false,
        }));
      } catch (error) {
        console.error("Error loading clients:", error);
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

        const newClient: UserProfile = {
          uid: `client-${Date.now()}`,
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
          theme: "system",
          language: "en",
          role: "client",
          permissions: [],
          address: clientData.address,
          metadata: {
            accountStatus: "invited",
          },
          invitationToken,
          invitationExpiresAt,
          invitedBy,
          invitationStatus: "pending",
        };

        // Mock: Add to local state (will be replaced with Firebase)
        store.update((state) => ({
          ...state,
          clients: [...state.clients, newClient],
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

        return newClient.uid;
      } catch (error) {
        console.error("Error creating client:", error);
        toast.error("Failed to create client invitation");
        throw error;
      }
    },

    // Update client information
    async updateClient(clientId: string, updates: Partial<UserProfile>) {
      try {
        // Mock update in local state
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
            accountStatus: isActive ? "active" : "deactivated",
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

export const useClientManagement = createClientManagementStore();
