import type { Container } from "../../container.js";

/** Structured fields the assistant tries to extract during the conversation. */
export interface CaptureFields {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    serviceInterest?: string;
    budgetRange?: string;
    timeline?: string;
    message?: string;
}

export interface CaptureMessage {
    role: "user" | "assistant";
    content: string;
}

const SYSTEM_PROMPT = `You are a friendly, professional B2B sales assistant for Aranax Technologies — a software and AI company.
Your job is to have a natural conversation that gently collects the information needed to understand a prospect's project.

You need to collect (in a conversational, unhurried way):
1. Their name and email (required to submit the enquiry)
2. Their company name
3. What service they're interested in (AI SaaS, RAG AI, White Label Agency, Web Development, Mobile Development, Custom Software)
4. Their rough budget range (Under 5k, 5k-20k, 20k-50k, Over 50k)
5. Their timeline (Exploring, 3-6 months, 1-3 months, Immediate)
6. A brief description of their project or challenge

Guidelines:
- Ask ONE question at a time. Never fire multiple questions in one message.
- Keep each message under 60 words.
- Be warm but efficient — this is a sales context.
- Once you have name + email + at least service interest, end the conversation by outputting a JSON block at the very end of your message ONLY (after a blank line), in this exact format:
  {"__capture__": true, "fields": {"name":"...","email":"...","serviceInterest":"..."}}
- Only include that JSON block when you have enough to submit (name, email, and service interest at minimum).
- Never hallucinate or fill in fields the user hasn't provided.
- Do not ask for information the user already gave.
- The serviceInterest value must be one of: ai_saas_development, rag_ai_chatbot_development, ai_agents_voice_automation, mvp_development_startups, custom_software_development, website_design_cms_development, mobile_app_development, offshore_software_development, white_label_development_agencies
- The budgetRange value must be one of: unknown, under_5k, 5k_20k, 20k_50k, over_50k
- The timeline value must be one of: exploring, three_to_six_months, one_to_three_months, immediate`;

export function createCaptureAssistantService(deps: Container) {
    return {
        /**
         * Returns one assistant reply plus any capture fields if the conversation is complete.
         */
        async chat(
            messages: CaptureMessage[],
        ): Promise<{ text: string; captureFields: CaptureFields | null }> {
            if (!(await deps.ai.isAvailable())) {
                throw new Error("AI not configured");
            }

            const result = await deps.ai.complete({
                kind: "capture_assistant",
                system: SYSTEM_PROMPT,
                messages,
                maxTokens: 300,
            });

            const fullText = result.text;

            // Parse capture signal if present in the assistant reply
            let captureFields: CaptureFields | null = null;
            const captureMatch = fullText.match(
                /\{[\s\S]*"__capture__"\s*:\s*true[\s\S]*\}/,
            );
            if (captureMatch) {
                try {
                    const outer = JSON.parse(captureMatch[0]) as {
                        __capture__: true;
                        fields: CaptureFields;
                    };
                    if (outer.__capture__ && outer.fields) {
                        captureFields = outer.fields;
                    }
                } catch {
                    // ignore parse errors — Claude may have malformed it
                }
            }

            // Strip the JSON block from displayed text
            const displayText = fullText
                .replace(/\n*\{[\s\S]*"__capture__"[\s\S]*\}\s*$/, "")
                .trim();

            return { text: displayText || fullText, captureFields };
        },

        /**
         * Submit captured fields as a lead via the standard captureLeadCore.
         */
        async submitFromCapture(
            fields: CaptureFields,
        ): Promise<{ leadId: string | null; created: boolean }> {
            if (!fields.email || !fields.name)
                return { leadId: null, created: false };

            const { captureLeadCore } =
                await import("../leads/lead-capture.service.js");

            let outcome: { created: boolean; leadId: string } | null = null;
            await deps.db.transaction(async (tx) => {
                outcome = await captureLeadCore(tx, deps, {
                    name: fields.name!,
                    email: fields.email!,
                    phone: fields.phone ?? null,
                    company: fields.company ?? null,
                    serviceInterest: fields.serviceInterest ?? null,
                    budgetRange: fields.budgetRange ?? null,
                    timeline: fields.timeline ?? null,
                    message: fields.message ?? null,
                    source: "website",
                    captureChannel: "live_chat",
                    leadSource: "website",
                    formSource: "ai_capture_widget",
                    campaignId: null,
                    referralId: null,
                    discoveryRequested: false,
                    marketingConsent: false,
                    privacyPolicyVersion: "2025-01",
                    acknowledgementType: "email.acknowledgement",
                });
            });

            return { leadId: outcome!.leadId, created: outcome!.created };
        },
    };
}
