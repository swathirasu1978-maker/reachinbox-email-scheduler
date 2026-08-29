# ReachInbox Email Scheduler

A full-stack email scheduling and campaign management application built for the **ReachInbox / Outbox Labs Software Development Intern Assignment**.

The application allows users to create email campaigns, upload leads, schedule emails, process them asynchronously using BullMQ and Redis, and send emails through Ethereal SMTP.

## Features

* User authentication with Google OAuth 2.0
* Email campaign creation
* CSV lead upload
* Scheduled email sending
* BullMQ + Redis background job processing
* Email rate limiting
* Configurable delay between emails
* Ethereal Email SMTP integration
* Ethereal email preview URL
* Sent email tracking
* Scheduled email tracking
* Email search using Elasticsearch
* Bull Board queue monitoring
* Slack OAuth and notifications
* MySQL database with Prisma
* React + TypeScript frontend
* Tailwind CSS UI
* Docker Compose support
* Restart-safe scheduled jobs
* Idempotent email sending

## Technology Stack

### Frontend

* React.js
* TypeScript
* Tailwind CSS
* Vite

### Backend

* Node.js
* TypeScript
* Express.js
* Prisma ORM

### Database

* MySQL

### Queue and Background Processing

* BullMQ
* Redis

### Email

* Nodemailer
* Ethereal Email SMTP

### Search

* Elasticsearch

### Queue Monitoring

* Bull Board

### Authentication

* Google OAuth 2.0

### Notifications

* Slack OAuth
* Slack Web API

### Infrastructure

* Docker Compose

## Project Structure

```text
reachinbox-email-scheduler/
│
├── backend/
│   ├── prisma/
│   │   └── migrations/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── services/
│   │   ├── types/
│   │   ├── app.ts
│   │   ├── server.ts
│   │   └── worker.ts
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.tsx
│   │   ├── api.ts
│   │   └── types.ts
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── sample-data/
│   └── leads.csv
│
├── docker-compose.yml
├── README.md
└── runbook.txt
```

## Architecture

```text
React Dashboard
       |
       v
Express API
       |
       +---- Google OAuth
       |
       +---- MySQL / Prisma
       |
       +---- Elasticsearch
       |
       +---- BullMQ ---- Redis
                          |
                          v
                     Email Worker
                          |
                  +-------+-------+
                  |               |
             Rate Limit      Ethereal SMTP
                  |
                  v
               Slack API
```

## Scheduling

Each recipient is converted into a durable BullMQ delayed job.

The database record is created first, and then the BullMQ job is created using a deterministic `jobId`.

The delay is calculated from the campaign start time and configured email delay.

No cron jobs or Node.js cron libraries are used.

## Restart Persistence

Redis and BullMQ maintain delayed and waiting jobs.

MySQL remains the source of truth for email status.

When the worker restarts, pending BullMQ jobs can continue processing.

A deterministic job ID and database status check help make email sending idempotent.

## Rate Limiting

Each sender uses a Redis atomic counter for the current UTC hour.

Example:

```text
email-rate:<senderId>:<YYYYMMDDHH>
```

When the configured hourly limit is reached, the job is moved to the next UTC hour instead of being permanently failed.

Redis-backed coordination allows multiple workers to safely share the workload.

## Email Delay

`MIN_SEND_DELAY_MS` controls the minimum delay between emails.

The campaign compose screen also allows a delay to be configured.

Redis-backed coordination prevents multiple workers from sending emails too close together.

## Worker Concurrency

`WORKER_CONCURRENCY` controls BullMQ worker concurrency.

Multiple worker processes can safely share the workload because queue and rate-limit coordination are handled through Redis.

## Handling 1000+ Emails

CSV leads are converted into individual BullMQ jobs.

The application does not keep one long-running request open for all emails.

BullMQ stores jobs in Redis and processes them asynchronously.

Rate limits and delays spread email processing over time.

## Setup

### Prerequisites

Install:

* Node.js 20+
* npm
* Docker Desktop
* Git
* VS Code

## 1. Clone the Repository

```bash
git clone https://github.com/swathirasu1978-maker/reachinbox-email-scheduler.git
cd reachinbox-email-scheduler
```

## 2. Start Infrastructure

From the project root:

```bash
docker compose up -d
```

This starts the required infrastructure services.

| Service       | Address        |
| ------------- | -------------- |
| MySQL         | localhost:3306 |
| Redis         | localhost:6379 |
| Elasticsearch | localhost:9200 |

## 3. Backend Setup

Open a terminal and run:

```bash
cd backend
npm install
```

Create the environment file.

### Windows CMD

```cmd
copy .env.example .env
```

Generate Prisma Client:

```bash
npx prisma generate
```

Apply database migrations:

```bash
npx prisma migrate deploy
```

Start the backend:

```bash
npm run dev
```

## 4. Start Email Worker

Open another terminal:

```bash
cd backend
npm run worker
```

The worker processes scheduled BullMQ jobs and sends emails using Ethereal SMTP.

## 5. Bull Board

Bull Board is available at:

```text
http://localhost:4000/admin/queues
```

Bull Board can be used to monitor:

* Waiting jobs
* Delayed jobs
* Active jobs
* Completed jobs
* Failed jobs

## 6. Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
```

Create the environment file.

### Windows CMD

```cmd
copy .env.example .env
```

Start the frontend:

```bash
npm run dev
```

Open the Vite URL displayed in the terminal.

## Environment Variables

The project provides example environment files:

```text
backend/.env.example
frontend/.env.example
```

Create local `.env` files using these examples.

The backend configuration includes environment variables for:

* Application port
* Database connection
* Redis connection
* Authentication
* Ethereal SMTP
* Google OAuth
* Slack OAuth
* Elasticsearch
* Worker concurrency
* Email rate limiting
* Email send delay

## Ethereal Email

The application uses Ethereal SMTP for test email delivery.

Configure the following values in `backend/.env`:

```env
ETHEREAL_HOST=smtp.ethereal.email
ETHEREAL_PORT=587
ETHEREAL_USER=your_ethereal_username
ETHEREAL_PASS=your_ethereal_password
```

Ethereal provides a preview URL for test emails.

Never commit real SMTP credentials to GitHub.

## Google OAuth

Google OAuth is used for authentication.

Configure the callback URL in your Google OAuth application:

```text
http://localhost:4000/api/auth/google/callback
```

Configure:

```env
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
```

Use your own Google OAuth credentials.

## Slack OAuth

Slack OAuth is used for Slack notifications.

Configure the callback URL:

```text
http://localhost:4000/api/slack/callback
```

Configure:

```env
SLACK_CLIENT_ID=your_client_id
SLACK_CLIENT_SECRET=your_client_secret
```

The dashboard's **Connect Slack** button starts the Slack OAuth flow.

## API Endpoints

### Health

```text
GET /api/health
```

### Authentication

```text
GET  /api/auth/google
GET  /api/auth/me
POST /api/auth/logout
```

### Slack

```text
GET    /api/slack/connect
GET    /api/slack/callback
DELETE /api/slack/disconnect
```

### Emails

```text
POST /api/emails/schedule
GET  /api/emails/scheduled
GET  /api/emails/sent
GET  /api/emails/search?q=...
```

## Demo Checklist

1. Start Docker services.
2. Start the backend.
3. Start the worker.
4. Start the frontend.
5. Login using Google.
6. Click **Compose New Email**.
7. Enter the email subject and body.
8. Upload `sample-data/leads.csv`.
9. Confirm the detected email count.
10. Configure start time, delay and hourly limit.
11. Schedule the campaign.
12. Open **Scheduled Emails**.
13. Open **Bull Board**.
14. Monitor the BullMQ jobs.
15. Open **Sent Emails**.
16. Open the Ethereal preview URL.
17. Search for an email from the dashboard.
18. Connect Slack.
19. Test rate limiting with a low hourly limit.
20. Restart the backend/worker and verify pending delayed jobs remain available.

## Security

Do not commit the following files or folders:

```text
.env
node_modules/
dist/
build/
```

Only example environment files should be committed:

```text
backend/.env.example
frontend/.env.example
```

Never expose:

* Passwords
* API keys
* OAuth secrets
* Database credentials
* SMTP credentials

## Assignment Requirements Covered

This project implements the required technologies and features:

* TypeScript
* Express.js
* React.js
* Tailwind CSS
* BullMQ
* Redis
* MySQL
* Prisma
* Ethereal Email SMTP
* Nodemailer
* Background email worker
* Scheduled email jobs
* Email rate limiting
* Configurable email delays
* Worker concurrency
* Elasticsearch search
* Google OAuth
* Slack OAuth/API
* Docker Compose
* Environment configuration using `.env.example`
* Frontend/backend separation
* Persistent background jobs
* Idempotent email sending

## Important Notes

* No cron implementation is used.
* MySQL is the primary database.
* BullMQ is backed by Redis.
* Email delivery uses Ethereal SMTP.
* Elasticsearch is used for email search.
* Google login uses OAuth 2.0.
* Slack notifications use the Slack API.
* Rate limiting and send-gap coordination use Redis.
* Email sending uses database status/idempotency checks.
* Real credentials must be configured locally and must not be committed to GitHub.

## Repository

GitHub:

https://github.com/swathirasu1978-maker/reachinbox-email-scheduler
