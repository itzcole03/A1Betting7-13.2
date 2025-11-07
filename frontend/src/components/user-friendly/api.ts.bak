// api.ts - Centralized API utility for PropOllama chat (2025 best practices)
import { z } from 'zod';

// Define the payload schema using zod for runtime validation
export const _ChatPayloadSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  context: z.record(z.any()).optional(),
});

export type ChatPayload = z.infer<typeof ChatPayloadSchema>;

export async function sendChatMessage(_payload: ChatPayload): Promise<Response> {
  // Validate payload at runtime
  const _result = ChatPayloadSchema.safeParse(payload);
  if (!result.success) {
    throw new Error(result.error.errors.map(e => e.message).join(', '));
  }
  const _response = await fetch('/api/propollama/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return response;
}
