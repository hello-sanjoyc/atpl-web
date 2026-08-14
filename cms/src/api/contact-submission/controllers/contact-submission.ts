import { factories } from '@strapi/strapi';

const UID = 'api::contact-submission.contact-submission';
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ContactPayload = {
  firstName?: unknown;
  lastName?: unknown;
  fname?: unknown;
  lname?: unknown;
  email?: unknown;
  project?: unknown;
  message?: unknown;
};

type ValidatedContact = {
  firstName: string;
  lastName: string;
  email: string;
  project: string;
  message: string;
};

function normalizeText(value: unknown) {
  return typeof value === 'string'
    ? value.replace(/\u0000/g, '').replace(/\r\n?/g, '\n').trim()
    : '';
}

function validatePayload(payload: ContactPayload) {
  const values: ValidatedContact = {
    firstName: normalizeText(payload.firstName ?? payload.fname),
    lastName: normalizeText(payload.lastName ?? payload.lname),
    email: normalizeText(payload.email).toLowerCase(),
    project: normalizeText(payload.project),
    message: normalizeText(payload.message),
  };
  const errors: Record<string, string> = {};

  if (!values.firstName) errors.firstName = 'First name is required.';
  else if (values.firstName.length > 80) errors.firstName = 'First name is too long.';

  if (!values.lastName) errors.lastName = 'Last name is required.';
  else if (values.lastName.length > 80) errors.lastName = 'Last name is too long.';

  if (!values.email) errors.email = 'Email is required.';
  else if (values.email.length > 254 || !emailPattern.test(values.email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (values.project.length < 2) errors.project = 'Project is required.';
  else if (values.project.length > 300) errors.project = 'Project is too long.';

  if (values.message.length < 10) {
    errors.message = 'Message must contain at least 10 characters.';
  } else if (values.message.length > 5000) {
    errors.message = 'Message is too long.';
  }

  return { values, errors };
}

export default factories.createCoreController(UID, ({ strapi }) => ({
  async submit(ctx) {
    const requestBody = ctx.request.body;
    const body =
      requestBody && typeof requestBody === 'object' && !Array.isArray(requestBody)
        ? (requestBody as Record<string, unknown>)
        : {};
    const candidate =
      body.data && typeof body.data === 'object' && !Array.isArray(body.data)
        ? (body.data as ContactPayload)
        : (body as ContactPayload);
    const { values, errors } = validatePayload(candidate);

    if (Object.keys(errors).length > 0) {
      return ctx.badRequest('Invalid contact submission.', { errors });
    }

    try {
      await strapi.documents(UID).create({
        data: {
          ...values,
          status: 'new',
          source: 'website',
        },
      });

      ctx.status = 201;
      ctx.body = {
        data: null,
        message: 'Thanks. Your message has been received.',
      };
    } catch (error) {
      strapi.log.error('Unable to store contact submission', error);
      return ctx.internalServerError('Your message could not be submitted. Please try again.');
    }
  },
}));
