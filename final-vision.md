# NetPulse — Full Project Blueprint

## Project Purpose
A production-grade uptime monitoring SaaS for developers. Users register API endpoints; the system pings them on a schedule, records results, detects outages, and sends alerts. Built to demonstrate real backend engineering depth: decoupled architecture, time-series data design, concurrency, and webhook-based alerting.

---

## Final Product — What It Does

- User signs up, creates monitors (a URL, expected status code, check interval)
- A background worker pings every monitor on its schedule, concurrently
- Every ping result is logged (status, latency, error if any)
- If a monitor fails N times consecutively, an incident opens automatically
- When the monitor recovers, the incident resolves automatically
- Dashboard shows: all monitors with current status, latency charts per monitor, open/resolved incidents
- Public status page per user (shareable URL showing all their monitors' uptime)
- Alerts: email via Resend + Slack/Discord webhooks when incidents open or resolve
- Supabase Realtime: dashboard updates live without page refresh when a monitor goes down

---

## Architecture

```
┌─────────────────────┐         ┌──────────────────────┐
│   Next.js App        │         │   Node.js Worker      │
│   (Vercel)           │         │   (Railway)            │
│                      │         │                        │
│ - Auth (Supabase)    │         │ - Polls due monitors   │
│ - CRUD on monitors   │         │   every TICK_INTERVAL  │
│ - Dashboard UI       │         │ - Fires concurrent     │
│ - Charts             │         │   HTTP checks          │
│ - Public status page │         │ - Writes ping_logs     │
│ - Alert channel mgmt │         │ - Opens/resolves       │
│                      │         │   incidents            │
│                      │         │ - Sends alerts         │
└──────────┬───────────┘         └──────────┬─────────────┘
           │                                │
           └──────────► Supabase ◄──────────┘
                     (Postgres, shared DB)
                              │
                       Upstash Redis
                    (queue / dedup layer,
                      future scheduler
                          upgrade)
```

**Core architectural rule:** the worker never receives HTTP requests. The frontend never pings external URLs. They communicate only through the shared Postgres database. This means if either side goes down, the other continues functioning independently.

---

## Monorepo Structure

```
netpulse/
├── web/                          # Next.js app (deployed to Vercel)
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── signup/
│   │   │       └── page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx          # monitor list, current status
│   │   │   ├── monitors/
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx      # create monitor form
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx      # single monitor detail + charts
│   │   │   ├── incidents/
│   │   │   │   └── page.tsx          # incident history
│   │   │   └── settings/
│   │   │       └── page.tsx          # alert channels management
│   │   ├── status/
│   │   │   └── [userId]/
│   │   │       └── page.tsx          # public status page (no auth)
│   │   └── api/
│   │       └── monitors/
│   │           ├── route.ts          # GET list, POST create
│   │           └── [id]/
│   │               └── route.ts      # GET one, PATCH update, DELETE
│   ├── components/
│   │   ├── monitors/
│   │   │   ├── MonitorCard.tsx       # status pill, latency, uptime %
│   │   │   ├── MonitorForm.tsx       # create/edit form
│   │   │   └── MonitorList.tsx
│   │   ├── charts/
│   │   │   ├── LatencyChart.tsx      # recharts time-series line chart
│   │   │   └── UptimeBar.tsx         # 90-day uptime bar (like statuspage.io)
│   │   ├── incidents/
│   │   │   └── IncidentList.tsx
│   │   └── ui/                       # shadcn/ui primitives
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts             # browser supabase client
│   │   │   └── server.ts             # server-side supabase client
│   │   └── utils.ts
│   └── types/
│       └── database.types.ts         # generated from Supabase CLI
│
├── worker/                           # Node.js worker (deployed to Railway)
│   ├── src/
│   │   ├── config.ts                 # env vars, supabase client
│   │   ├── types.ts                  # Monitor type, CheckResult type
│   │   ├── checker.ts                # HTTP check logic, AbortController timeout
│   │   ├── repository.ts             # all Supabase queries
│   │   ├── incident.ts               # incident open/resolve decision logic
│   │   ├── scheduler.ts              # processMonitor, runTick
│   │   └── index.ts                  # entry point, setInterval loop
│   ├── package.json
│   └── tsconfig.json
│
└── types/
    └── database.types.ts             # shared Supabase generated types
```

---

## Database Schema (Postgres via Supabase)

### `monitors`
```sql
id                    uuid PK default gen_random_uuid()
user_id               uuid FK → auth.users ON DELETE CASCADE
name                  text NOT NULL
url                   text NOT NULL
expected_status       int NOT NULL default 200
check_interval_seconds int NOT NULL default 60
timeout_ms            int NOT NULL default 10000
is_active             boolean NOT NULL default true
next_check_at         timestamptz NOT NULL default now()
current_status        text NOT NULL default 'pending'  -- 'up' | 'down' | 'pending'
consecutive_failures  int NOT NULL default 0
created_at            timestamptz NOT NULL default now()

INDEX: idx_monitors_due ON (next_check_at) WHERE is_active = true
```

### `ping_logs`
```sql
id                    bigint GENERATED ALWAYS AS IDENTITY PK
monitor_id            uuid FK → monitors ON DELETE CASCADE
checked_at            timestamptz NOT NULL default now()
status                text NOT NULL  -- 'up' | 'down' | 'timeout' | 'error'
http_status_code      int
latency_ms            int
error_message         text

INDEX: idx_ping_logs_monitor_time ON (monitor_id, checked_at DESC)
```

### `incidents`
```sql
id                    uuid PK default gen_random_uuid()
monitor_id            uuid FK → monitors ON DELETE CASCADE
started_at            timestamptz NOT NULL default now()
resolved_at           timestamptz  -- NULL means still open
cause                 text

INDEX: idx_incidents_monitor ON (monitor_id, started_at DESC)
```

### `alert_channels`
```sql
id                    uuid PK default gen_random_uuid()
user_id               uuid FK → auth.users ON DELETE CASCADE
type                  text NOT NULL  -- 'email' | 'webhook'
destination           text NOT NULL  -- email address or webhook URL
is_active             boolean NOT NULL default true
created_at            timestamptz NOT NULL default now()
```

### RLS Policies
- `monitors`: users manage only their own rows (all operations)
- `ping_logs`: users can SELECT only (worker writes via service role key)
- `incidents`: users can SELECT only (worker writes via service role key)
- `alert_channels`: users manage only their own rows (all operations)

---

## Worker — Complete File Responsibilities

### `config.ts`
- Reads all env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TICK_INTERVAL_MS, FAILURE_THRESHOLD
- Creates and exports the Supabase client (service role)
- Exits process immediately if required env vars are missing

### `types.ts`
- `Monitor` type (matches the monitors table row shape)
- `CheckResult` type: `{ status: 'up'|'down'|'timeout'|'error', httpStatusCode: number|null, latencyMs: number, errorMessage: string|null }`
- `MonitorStatus` type

### `checker.ts`
- `checkMonitor({ url, expectedStatus, timeoutMs }): Promise<CheckResult>`
- Uses AbortController + setTimeout for timeout handling
- Four distinct outcomes: up, down, timeout, error
- Does not import Supabase, does not know about incidents

### `repository.ts`
- `getDueMonitors(): Promise<Monitor[]>` — active monitors where next_check_at <= now()
- `insertPingLog(data): Promise<void>` — inserts one row into ping_logs
- `updateMonitorState({ monitorId, current_status, consecutive_failures, next_check_at }): Promise<void>`
- `openIncident(monitorId, cause): Promise<void>` — inserts open incident
- `resolveOpenIncident(monitorId): Promise<void>` — sets resolved_at on open incident
- All functions throw on Supabase error (never silently swallow failures)

### `incident.ts`
- `FAILURE_THRESHOLD` constant (from env, defaults to 3)
- `handleIncidentState(monitorId, isSuccess, reason, previousFailures): Promise<void>`
- Opens incident when: previousFailures < THRESHOLD && newFailures >= THRESHOLD
- Resolves incident when: isSuccess && previousFailures >= THRESHOLD
- Does not contain any Supabase queries directly — delegates to repository

### `scheduler.ts`
- `processMonitor(monitor): Promise<void>`
  - Calls checkMonitor → insertPingLog → updateMonitorState → handleIncidentState
  - Correctly passes previousFailures (before the check) to handleIncidentState
  - Calculates next_check_at from monitor.check_interval_seconds
- `runTick(): Promise<void>`
  - Gets due monitors, returns early if none
  - Runs processMonitor for all concurrently via Promise.allSettled
  - Logs rejected results with monitor ID

### `index.ts`
- Reads TICK_INTERVAL_MS from env (default 60000)
- Calls runTick() immediately on startup
- Sets up setInterval for subsequent ticks
- Wraps both in try/catch so an unhandled throw can't silently kill the process

---

## Frontend — Page by Page

### Auth pages (`/login`, `/signup`)
- Supabase Auth UI or custom form
- Email + password, redirect to /dashboard on success

### Dashboard (`/dashboard`)
- Lists all monitors for the authenticated user
- Each monitor card shows: name, URL, current_status (color-coded pill), last checked time, 24hr uptime percentage
- Supabase Realtime subscription on `monitors` table — status pill updates live without refresh
- Button to create new monitor
- Empty state if no monitors yet

### Monitor Detail (`/monitors/[id]`)
- Header: monitor name, URL, current status, uptime % (7 days, 30 days)
- Latency chart: line chart (Recharts) — average latency per hour over last 24hrs
- Response time distribution (optional enhancement)
- Recent ping log table: last 50 checks, each row showing checked_at, status, latency_ms, http_status_code
- Incident history for this monitor: started_at, resolved_at, duration, cause
- Edit/delete/pause monitor controls

### Incidents (`/incidents`)
- All incidents across all user's monitors
- Filter by: open only, resolved only, by monitor
- Each row: monitor name, started_at, resolved_at (or "ongoing"), duration, cause

### Settings (`/settings`)
- Alert channels section: list existing channels (type + masked destination), add new, delete
- Add channel form: type selector (email/webhook), destination input
- Notification preferences (which events trigger alerts — incident opened, incident resolved)

### Public Status Page (`/status/[userId]`)
- No authentication required
- Lists all active monitors for that user
- Each row: monitor name, current status, 90-day uptime bar (colored blocks per day, green/red/grey)
- Overall system status header ("All systems operational" vs "Degraded")
- No editing controls, read-only
- Should work fast even without JS (consider server rendering this page fully)

---

## API Routes (Next.js Route Handlers)

### `GET /api/monitors`
- Returns all monitors for the authenticated user
- Ordered by created_at DESC

### `POST /api/monitors`
- Creates a new monitor
- Validates: url is a valid URL, check_interval_seconds is within allowed range, expected_status is a valid HTTP status code
- Sets next_check_at to now() so worker picks it up immediately

### `GET /api/monitors/[id]`
- Returns one monitor + recent ping_logs (last 100) + open incident if any
- 404 if not found or doesn't belong to the user

### `PATCH /api/monitors/[id]`
- Updates name, url, expected_status, check_interval_seconds, timeout_ms, is_active
- Partial update — only fields provided in body are changed

### `DELETE /api/monitors/[id]`
- Deletes monitor and cascades to ping_logs, incidents (FK cascade handles this)

---

## Alerting System (Stage 4)

### Trigger point
Inside `incident.ts`, after `openIncident` is called, trigger alert sending.
After `resolveOpenIncident` is called, trigger resolution alert.

### Alert sending logic (separate file: `alerting.ts` in worker)
1. Query `alert_channels` for the monitor's owner (need to join monitors → user_id)
2. For each active channel:
   - `type === 'email'` → call Resend API, send incident opened/resolved email
   - `type === 'webhook'` → POST JSON payload to the destination URL (Slack and Discord both accept a `{ text: "..." }` body at their webhook URLs)
3. Fire all alerts concurrently (Promise.allSettled again — one bad webhook URL shouldn't block the email)

### Email content (via Resend)
- Incident opened: monitor name, URL, cause, time it started
- Incident resolved: monitor name, URL, total downtime duration

### Webhook payload
```json
{
  "text": "🔴 Monitor 'My API' is DOWN — cause: timeout after 10000ms (started 14:03 UTC)"
}
```
```json
{
  "text": "✅ Monitor 'My API' has RECOVERED — was down for 8 minutes"
}
```

---

## Supabase Realtime (Stage 5)

### What to subscribe to
In the dashboard page component, open a Realtime channel on the `monitors` table filtered to `user_id = current user`. On any UPDATE event, update the relevant monitor card in local state — specifically `current_status` and `consecutive_failures`.

### What this enables
If a monitor goes down while the user has the dashboard open, the status pill flips from green to red within seconds of the worker writing the update, with no polling or page refresh needed.

### Implementation shape
```typescript
const channel = supabase
  .channel('monitor-status')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'monitors',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    // update local monitor state with payload.new
  })
  .subscribe()
```

---

## Environment Variables

### Worker (`/worker/.env`)
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
TICK_INTERVAL_MS=30000
FAILURE_THRESHOLD=3
RESEND_API_KEY=
```

### Web (`/web/.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=       # server-side API routes only
RESEND_API_KEY=                  # if sending email from web too
```

---

## Deployment

### Worker → Railway
- Root directory: `/worker`
- Build command: `npm run build` (tsc)
- Start command: `node dist/index.js`
- Environment variables set in Railway dashboard
- No port needed — this is not an HTTP server

### Web → Vercel
- Root directory: `/web`
- Framework preset: Next.js
- Environment variables set in Vercel dashboard
- Automatic deploys from main branch

---

## Interview Talking Points This Project Covers

1. **Decoupled architecture** — worker and frontend share only a database, neither depends on the other's availability
2. **Concurrency** — Promise.allSettled fan-out pattern, why not sequential await in a loop
3. **Denormalization tradeoffs** — current_status and consecutive_failures on the monitors row, why that's better than recalculating from ping_logs on every read
4. **Index design** — partial index on next_check_at, composite index on (monitor_id, checked_at DESC), and why each was chosen for its specific query
5. **Time-series data** — ping_logs schema, the future retention/rollup problem, how you'd solve it
6. **Timeout handling** — AbortController pattern, why fetch has no built-in timeout
7. **Error classification** — four distinct outcomes (up/down/timeout/error), why collapsing to binary loses diagnostic value
8. **State machine** — incident open/resolve threshold logic, why range guard beats equality check
9. **Security boundaries** — anon key vs service role key, why ping_logs has read-only RLS for users
10. **Realtime** — Supabase Postgres changes subscription, how it works under the hood (logical replication)