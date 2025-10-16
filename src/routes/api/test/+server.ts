import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async () => {
  return json({
    message: "Test endpoint working",
    timestamp: new Date().toISOString(),
  });
};

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json().catch(() => ({}));
  return json({ message: "POST test working", received: body });
};
