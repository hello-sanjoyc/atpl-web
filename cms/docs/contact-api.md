# Contact submission API

The public website can store contact-form enquiries through Strapi without an API token.

## Endpoint

`POST /api/contact`

Send JSON with the following fields:

```json
{
  "firstName": "Sofia",
  "lastName": "Rajan",
  "email": "sofia@example.com",
  "project": "AI chatbot for customer support",
  "message": "We need a multilingual assistant grounded in our support documentation."
}
```

The existing frontend names `fname` and `lname` are also accepted as aliases for `firstName` and `lastName`.

Example request:

```bash
curl -X POST http://localhost:1337/api/contact \
  -H 'Content-Type: application/json' \
  -d '{
    "firstName": "Sofia",
    "lastName": "Rajan",
    "email": "sofia@example.com",
    "project": "AI chatbot for customer support",
    "message": "We need a multilingual assistant grounded in our support documentation."
  }'
```

A successful submission returns HTTP `201`:

```json
{
  "data": null,
  "message": "Thanks. Your message has been received."
}
```

Validation failures return HTTP `400` with field-level errors. Only the custom create endpoint is public; reading, editing, and deleting submissions still require Strapi administrator access.

## Admin workflow

Open **Content Manager → Contact Submission** to view enquiries. New entries start with the `new` status and can be changed to `read`, `replied`, `archived`, or `spam`. `internalNotes` is reserved for administrators.
