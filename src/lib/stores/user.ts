import { writable } from "svelte/store";
import type { UserProfile } from "$lib/types/user";

type UserProfileStore = {
  data: UserProfile | undefined;
  loading: boolean;
  error: any;
  update: (data: Partial<UserProfile>) => Promise<void>;
};

export const userProfile = writable<UserProfileStore>({
  data: undefined,
  loading: true,
  error: null,
  update: async () => {},
});
