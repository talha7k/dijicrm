// Hook for managing SMTP configuration loading and initialization
import { writable } from "svelte/store";
import { smtpService } from "$lib/services/smtpService";
import { emailService } from "$lib/services/emailService";
import type { SMTPConfig } from "$lib/types/smtp";

interface SMTPConfigState {
  config: SMTPConfig | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

function createSMTPConfigStore() {
  const store = writable<SMTPConfigState>({
    config: null,
    loading: false,
    error: null,
    initialized: false,
  });

  return {
    subscribe: store.subscribe,

    // Initialize SMTP config for a company (call on app startup)
    async initialize(companyId: string) {
      store.update((state) => ({ ...state, loading: true, error: null }));

      try {
        const result = await smtpService.loadSMTPConfig(companyId);

        if (result.success && result.config) {
          // Apply config to email service
          emailService.setSMTPConfig(result.config);

          store.update((state) => ({
            ...state,
            config: result.config as SMTPConfig,
            loading: false,
            initialized: true,
          }));

          console.log("SMTP configuration loaded and applied");
        } else {
          // No config found or error - email service will use mock mode
          store.update((state) => ({
            ...state,
            config: null,
            loading: false,
            initialized: true,
          }));

          console.log("No SMTP configuration found, using mock email service");
        }
      } catch (error) {
        console.error("Failed to initialize SMTP config:", error);

        store.update((state) => ({
          ...state,
          error:
            error instanceof Error
              ? error.message
              : "Failed to load SMTP configuration",
          loading: false,
          initialized: true,
        }));
      }
    },

    // Save new SMTP configuration
    async saveConfig(companyId: string, config: SMTPConfig) {
      store.update((state) => ({ ...state, loading: true, error: null }));

      try {
        const result = await smtpService.saveSMTPConfig(companyId, config);

        if (result.success) {
          // Apply config to email service
          emailService.setSMTPConfig(config);

          store.update((state) => ({
            ...state,
            config,
            loading: false,
          }));

          return { success: true };
        } else {
          store.update((state) => ({
            ...state,
            error: result.error || "Failed to save SMTP configuration",
            loading: false,
          }));

          return { success: false, error: result.error };
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to save SMTP configuration";

        store.update((state) => ({
          ...state,
          error: errorMessage,
          loading: false,
        }));

        return { success: false, error: errorMessage };
      }
    },

    // Update existing SMTP configuration
    async updateConfig(companyId: string, updates: Partial<SMTPConfig>) {
      const currentConfig = this.getCurrentConfig();

      if (!currentConfig) {
        return { success: false, error: "No existing configuration to update" };
      }

      const updatedConfig = { ...currentConfig, ...updates };
      return this.saveConfig(companyId, updatedConfig);
    },

    // Get current config synchronously
    getCurrentConfig(): SMTPConfig | null {
      let config: SMTPConfig | null = null;
      store.subscribe((state) => {
        config = state.config;
      })();
      return config;
    },

    // Clear error
    clearError() {
      store.update((state) => ({ ...state, error: null }));
    },

    // Reset store (useful for logout)
    reset() {
      store.set({
        config: null,
        loading: false,
        error: null,
        initialized: false,
      });
    },
  };
}

export const useSMTPConfig = createSMTPConfigStore();
