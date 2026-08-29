# ReachInbox Email Scheduler

A full-stack email scheduling system built for the ReachInbox/Outbox Labs assignment.
# ReachInbox Email Scheduler

A full-stack email scheduling and campaign management application built for the ReachInbox Software Development Intern Assignment.

The application allows users to create email campaigns, schedule emails, process them asynchronously using BullMQ and Redis, and send emails through Ethereal SMTP.

## Features

- User authentication
- Email campaign creation
- Scheduled email sending
- BullMQ + Redis background job processing
- Email rate limiting
- Ethereal Email integration
- Email preview URL
- Sent email tracking
- MySQL/PostgreSQL database support
- React frontend
- TypeScript backend
- Docker support

## Stack

- Backend: TypeScript + Express
- Queue: BullMQ + Redis
- Database: MySQL + Prisma
- SMTP: Ethereal Email via Nodemailer
- Search: Elasticsearch
- Queue dashboard: Bull Board
- Auth: Google OAuth 2.0
- Slack: OAuth + Web API notification
- Frontend: React + TypeScript + Tailwind CSS (Vite)
- Infra: Docker Compose

## Architecture

```text
React Dashboard
      |
      v
Express API ---- Google OAuth
      |
      +---- MySQL / Prisma (source of truth)
      |
      +---- Elasticsearch (email index/search)
      |
      +---- BullMQ ---- Redis
                         |
                         v
                    Email Worker
                         |
                +--------+--------+
                |                 |
             Rate limit       Ethereal SMTP
                |
                v
             Slack API
```

### Scheduling

Each recipient becomes a durable BullMQ delayed job. The database row is created first, then the job is added with a deterministic `jobId`. The job's delay is calculated from the campaign start time and the configured per-email delay.

No cron jobs or Node cron libraries are used.

### Restart persistence

Redis persistence and BullMQ keep delayed/waiting jobs. MySQL remains the source of truth for email status. On worker restart, BullMQ resumes pending jobs. A deterministic job ID plus a database status check makes the send operation idempotent.

### Rate limiting

Each sender uses a Redis atomic counter for the current UTC hour:

`email-rate:<senderId>:<YYYYMMDDHH>`

The worker increments the counter atomically. When the configured hourly limit is reached, the job is moved to the next UTC hour instead of being failed permanently. A Redis `SET NX` notification key prevents a Slack alert from being sent repeatedly for the same sender/hour.

### Delay

`MIN_SEND_DELAY_MS` is configurable. The compose screen also accepts a campaign delay. The scheduler spaces initial jobs by that delay, while the worker enforces the global minimum send gap using a Redis lock/timestamp per sender so multiple workers cannot send too close together.

### Concurrency

`WORKER_CONCURRENCY` controls BullMQ worker concurrency. Because rate-limit and send-gap coordination are Redis-backed, multiple worker processes can safely share the workload.

### 1000+ emails

A CSV is parsed into individual jobs rather than held in one long-running request. BullMQ stores the jobs durably in Redis. Delays and Redis-backed rate limits spread the work over time.

## Setup

### 1. Prerequisites

Install:

- Node.js 20+
- Docker Desktop
- Git
- VS Code

### 2. Start infrastructure

From the project root:

```bash
docker compose up -d
```

Services:

- MySQL: `localhost:3306`
- Redis: `localhost:6379`
- Elasticsearch: `localhost:9200`

### 3. Backend

```bash
cd backend
copy .env.example .env
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

Worker:

```bash
npm run worker
```

Bull Board:

`http://localhost:4000/admin/queues`

### 4. Frontend

Open another terminal:

```bash
cd frontend
copy .env.example .env
npm install
npm run dev
```

Open the Vite URL shown in the terminal.

## Environment

See `backend/.env.example`.

For the required live integrations, create your own credentials:

### Ethereal

Create an account at Ethereal Email and put the generated SMTP username/password in:

```env
ETHEREAL_HOST=smtp.ethereal.email
ETHEREAL_PORT=587
ETHEREAL_USER=...
ETHEREAL_PASS=...
```

### Google OAuth

Create a Google OAuth Web Application. Add this redirect URI:

```text
http://localhost:4000/api/auth/google/callback
```

Set:

```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

### Slack OAuth

Create a Slack app and add:

```text
http://localhost:4000/api/slack/callback
```

Recommended scopes include `chat:write` and `channels:read`/`groups:read` as needed for the selected workspace flow.

Set:

```env
SLACK_CLIENT_ID=...
SLACK_CLIENT_SECRET=...
```

The dashboard's **Connect Slack** button starts the real OAuth flow. If Slack is not connected, rate-limit notifications are skipped without crashing.

## API

- `GET /api/health`
- `GET /api/auth/google`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/slack/connect`
- `GET /api/slack/callback`
- `DELETE /api/slack/disconnect`
- `POST /api/emails/schedule`
- `GET /api/emails/scheduled`
- `GET /api/emails/sent`
- `GET /api/emails/search?q=...`

## Demo checklist

1. Login with Google.
2. Click **Compose New Email**.
3. Enter subject/body.
4. Upload `sample-data/leads.csv`.
5. Confirm detected email count.
6. Set start time, delay, hourly limit.
7. Schedule.
8. Open Scheduled Emails.
9. Open Bull Board.
10. Wait for jobs to become active/completed.
11. Open Sent Emails.
12. Open the Ethereal preview URL returned by the worker.
13. Search an email from the dashboard.
14. Connect Slack and demonstrate a deliberately low hourly limit.
15. Stop/restart the backend and worker; future BullMQ delayed jobs remain.

## Important assignment notes

- No cron implementation is present.
- The database is MySQL.
- Queue is BullMQ backed by Redis.
- Email delivery is Ethereal SMTP.
- Search indexing is Elasticsearch.
- Google login is real OAuth, not a mock.
- Slack notification is a real Slack API call after OAuth.
- Rate limiting and send-gap coordination use Redis, not process memory.
- Sent jobs are protected by a database status/idempotency check.
