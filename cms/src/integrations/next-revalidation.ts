import type { Core } from '@strapi/strapi';

const NON_CONTENT_MODELS = new Set([
  // Contact writes are operational data and must not purge public page content.
  'api::contact-submission.contact-submission',
]);

type LifecycleEvent = {
  action: string;
  model: { uid: string };
};

export function registerNextRevalidation(strapi: Core.Strapi) {
  const url = process.env.NEXT_REVALIDATION_URL;
  const secret = process.env.NEXT_REVALIDATION_SECRET;

  if (!url || !secret) {
    strapi.log.warn(
      'Next.js cache revalidation is disabled. Configure NEXT_REVALIDATION_URL and NEXT_REVALIDATION_SECRET.',
    );
    return;
  }

  const contentModels = Object.keys(strapi.contentTypes).filter(
    (uid) => uid.startsWith('api::') && !NON_CONTENT_MODELS.has(uid),
  );
  contentModels.push('plugin::upload.file');

  let pendingEvent: LifecycleEvent | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const invalidate = async () => {
    const event = pendingEvent;
    pendingEvent = undefined;
    timer = undefined;
    if (!event) return;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secret}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: 'strapi',
          action: event.action,
          model: event.model.uid,
        }),
        signal: AbortSignal.timeout(8_000),
      });

      if (!response.ok) {
        throw new Error(`Next.js returned ${response.status} ${response.statusText}`);
      }

      strapi.log.info(
        `Revalidated Next.js content cache after ${event.action} on ${event.model.uid}.`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      strapi.log.error(`Next.js cache revalidation failed: ${message}`);
    }
  };

  const scheduleInvalidation = async (event: LifecycleEvent) => {
    pendingEvent = event;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => void invalidate(), 500);
    timer.unref?.();
  };

  strapi.db.lifecycles.subscribe({
    models: contentModels,
    afterCreate: scheduleInvalidation,
    afterCreateMany: scheduleInvalidation,
    afterUpdate: scheduleInvalidation,
    afterUpdateMany: scheduleInvalidation,
    afterDelete: scheduleInvalidation,
    afterDeleteMany: scheduleInvalidation,
  });

  strapi.log.info(
    `Next.js content cache revalidation lifecycle registered for ${contentModels.length} models.`,
  );
}
