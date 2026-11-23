import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { sendOk } from '../common/response.js';
import { createCaptureAssistantService } from './capture-assistant.service.js';
import type { CaptureMessage } from './capture-assistant.service.js';

const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(2000),
});

const chatBody = z.object({
  /** Full conversation history including the latest user message at the end. */
  messages: z.array(messageSchema).min(1).max(50),
});

const captureChatController: FastifyPluginAsync = async (app) => {
  const typed = app.withTypeProvider<ZodTypeProvider>();

  /**
   * POST /public/chat/message
   * Public (no auth). Rate-limited via the shared rate-limit plugin.
   * Sends one conversation turn to Claude and returns the assistant reply.
   * If Claude signals completion, the lead is auto-submitted and the response
   * includes { captureComplete: true, leadId }.
   */
  typed.post(
    '/public/chat/message',
    {
      schema: {
        tags: ['Public', 'AI'],
        summary: 'AI lead capture chat — send one conversation turn',
        body: chatBody,
      },
    },
    async (request, reply) => {
      const service = createCaptureAssistantService(app.deps);
      const messages: CaptureMessage[] = request.body.messages;

      if (!(await app.deps.ai.isAvailable())) {
        return sendOk(request, reply, {
          text: "I'm sorry, the AI assistant is currently unavailable. Please use the contact form instead.",
          captureComplete: false,
          leadId: null,
        });
      }

      const { text, captureFields } = await service.chat(messages);

      let captureComplete = false;
      let leadId: string | null = null;

      if (captureFields?.name && captureFields?.email) {
        try {
          const result = await service.submitFromCapture(captureFields);
          captureComplete = true;
          leadId = result.leadId;
        } catch (err) {
          app.deps.logger.warn({ err }, 'AI capture submit failed');
          // Don't fail the chat response — the UI can still show the assistant reply
        }
      }

      return sendOk(request, reply, { text, captureComplete, leadId });
    },
  );
};

export default captureChatController;
