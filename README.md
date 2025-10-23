# Automated Phishing Simulation Platform (MVP)

Node.js + Express + MongoDB backend to create phishing campaigns, upload recipients via CSV, generate per-recipient HTML emails, and track opens/clicks.

## Features
- Create campaigns with an HTML template
- Upload recipients via CSV (`email,user_name`) with domain allow-list
- Generate `sent_emails/email_<recipientId>.html` with substituted placeholders
- Track opens (1x1 GIF) and clicks (with optional `to` parameter)
- Basic campaign metrics and CSV export of events

## Requirements
- Node.js 18+
- MongoDB (local or a connection string)

## Tech
- express, mongoose, multer, csv-parser, helmet, express-rate-limit, dotenv, nodemon (dev)

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
- Copy `.env.example` to `.env` and update values:
```bash
cp .env.example .env
```
- Set `MONGO_URI` and `ALLOWED_DOMAINS` (comma-separated). If `ALLOWED_DOMAINS` is empty, all domains are allowed (MVP behavior).
- Optionally set `BASE_URL` (used for tracking URLs inside generated emails). If omitted, relative URLs are used.

3. Run the server:
```bash
npm run dev
# or
npm start
```

Server runs on `http://localhost:3000` by default.

## API

### POST /campaigns/create
Create a campaign.

Body (JSON):
```json
{ "name": "Q4 Simulation", "template": "<html>Hi {{user_name}}<br><a href=\"{{click_url}}?to=https://example.com\">View Document</a>{{open_pixel}}</html>" }
```

Response:
```json
{ "campaign": { "_id": "...", "name": "Q4 Simulation", "template": "...", "createdAt": "..." } }
```

Notes:
- Template supports `{{user_name}}`, `{{open_pixel}}`, `{{click_url}}` placeholders.

### POST /campaigns/:campaignId/upload_recipients
Upload CSV file via multipart form-data with field name `file`.

- CSV headers: `email,user_name`
- Validates email domain against `ALLOWED_DOMAINS`
- Creates `Recipient` and a `sent` `Event`
- Generates `sent_emails/email_<recipientId>.html`

Response:
```json
{
  "accepted_count": 10,
  "created_count": 10,
  "rejected_count": 2,
  "rejected": [{ "email": "bad@ext.com", "user_name": "x", "reason": "invalid_or_disallowed" }]
}
```

### GET /track/open/:recipientId
Records an `open` event and returns a 1x1 GIF.

### GET /track/click/:recipientId?to=<url>
Records a `click` event (stores optional `to`) and redirects to `to` if it looks like an `http(s)` URL; otherwise redirects to `/safe_page`.

### GET /safe_page
Returns a simple landing page.

### GET /campaigns/:campaignId/metrics
Returns totals and rates.

Response:
```json
{ "total": 20, "opens": 12, "clicks": 4, "open_rate": 60, "click_rate": 20 }
```

### GET /campaigns/:campaignId/events/export
CSV export of events.

## Testing with Postman
1. Create Campaign: POST `http://localhost:3000/campaigns/create` with JSON body.
2. Upload Recipients: POST `http://localhost:3000/campaigns/<id>/upload_recipients` with form-data `file` (CSV file). Example CSV:
```csv
email,user_name
alice@company.com,Alice
bob@company.com,Bob
```
3. Open/Click Tracking: Open the generated `sent_emails/email_<recipientId>.html` in a browser and click the link or just hit the tracking endpoints directly.
4. Metrics: GET `http://localhost:3000/campaigns/<id>/metrics`.
5. Export: GET `http://localhost:3000/campaigns/<id>/events/export`.

## Notes for Production Hardening
- Add authentication/authorization for all endpoints.
- Use background job/queue for email generation and sending.
- Validate inputs thoroughly and sanitize HTML templates.
- Consider bulk inserts (`insertMany`) and proper upsert logic to handle duplicates.
- Add logging/observability, request tracing, and structured logs.
- Add tests and CI.
- Configure stricter rate limits and CORS as needed.

## Project Structure
```
.
├── app.js
├── package.json
├── .env.example
├── models/
│   ├── Campaign.js
│   ├── Recipient.js
│   └── Event.js
├── utils/
│   └── allowedDomains.js
├── routes/
│   ├── campaigns.js
│   └── tracking.js
├── sent_emails/
└── README.md
```



