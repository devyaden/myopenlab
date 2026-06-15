import PostHogClient from "@/posthog";

/**
 * Fire-and-forget server-side PostHog capture for API routes. Creates a client,
 * captures, and flushes (shutdown) so the event is delivered in serverless
 * environments. Never throws — analytics must not break the request.
 */
export async function captureServer(
  distinctId: string,
  event: string,
  properties: Record<string, unknown> = {}
): Promise<void> {
  try {
    const posthog = PostHogClient();
    posthog.capture({ distinctId, event, properties });
    await posthog.shutdown();
  } catch {
    // ignore analytics failures
  }
}
