import type { ServerLoad } from "@sveltejs/kit";

export const load: ServerLoad = async () => {
  // Marketing pages don't require authentication or app initialization
  // Return empty object to prevent app initialization
  return {};
};
