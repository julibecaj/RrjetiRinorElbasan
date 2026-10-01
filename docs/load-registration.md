# Manual registration load testing

Requires Node.js 20.3+ (Node 22 recommended for this project). The script does not load `.env.local`, use Supabase/admin credentials, register npm hooks, retry submissions, follow redirects, or delete rows. Importing the module does not run a test. Successful requests create real rows at the URL you choose.

## Configuration and limits

`LOAD_TEST_URL` is required: the full `/api/register` URL, without credentials, query parameters or fragments. HTTPS is required except for loopback HTTP when using a local fixture. No production domain is hardcoded. `TOTAL` defaults to 20 and `CONCURRENCY` defaults to 5. Command-line `--total` / `--concurrency` override those environment variables. Values must be positive integers. Hard limits: 1,000 requests per run and 300 concurrent requests, changeable only in source. Each request has a 15-second timeout and a 64 KiB response-body limit.

Concurrency is a fixed worker pool. For example, 100 total/20 concurrent starts at most 20 requests at a time until all 100 have completed. There is no one-promise-per-request burst or automatic retry. Ctrl+C stops scheduling and aborts in-flight requests, then prints a partial summary. Aborted/timed-out requests may already have inserted rows: do not assume they failed to save. Wait for outstanding server work to settle before inspecting/cleaning up.

## Synthetic rows

Each run gets a UTC timestamp plus random UUID. Emails are `loadtest-<runId>-<sequence>@example.com`; names are `Load` / `Test 001`. Phone strings are `+355` followed by 12 digits derived from SHA-256 of the run ID and sequence. A set detects and regenerates any within-run collision. These 15-digit, Albanian-prefixed test strings match the existing application validator but are not realistic Albanian mobile numbers and must not be called/messaged. They are not represented as an officially reserved telephone range. Across-run collisions are statistically unlikely, not mathematically impossible, because telephone strings have finite space; any database conflict is counted as 409 and not retried.

Every row uses `school: '__RRE_LOAD_TEST__'`, `classYear: 'Test'`, `board: 'Test'`, `hobbies: 'Load testing'`, and `motivation: 'Synthetic registration used only for application load testing.'`. No real student information is used. The run ID appears in every email for identifying one run privately in the database.

## Exact manual stages (PowerShell)

Replace `<your-deployed-host>` once with the intended host. Run each stage separately, inspect its results and hosting/database health before deciding to run the next. These are commands for you to execute, not an automatic staged runner.

```powershell
$env:LOAD_TEST_URL = 'https://<your-deployed-host>/api/register'

# Stage 1
node scripts/load-registration.mjs --total 20 --concurrency 5

# Stage 2
node scripts/load-registration.mjs --total 50 --concurrency 10

# Stage 3
node scripts/load-registration.mjs --total 100 --concurrency 25

# Stage 4
node scripts/load-registration.mjs --total 200 --concurrency 50

# Optional final stage
node scripts/load-registration.mjs --total 300 --concurrency 75
```

Environment-only equivalent for stage 1:

```powershell
$env:TOTAL = '20'
$env:CONCURRENCY = '5'
node scripts/load-registration.mjs
```

`node scripts/load-registration.mjs --help` sends no requests. No npm script was added. If all five stages are run, up to 670 rows will be inserted.

## Results

Summary includes run ID, configured/completed/unstarted counts, HTTP 201, HTTP 409, other 4xx, 5xx, other statuses including redirects, network/body errors with timeout subset, minimum/maximum/average/p50/p95 latency, elapsed time and interruption status. HTTP categories are mutually exclusive; 409 is not counted again under other 4xx. Timeouts are a subset of network errors. If the response body fails, that attempt is counted as a network/body error instead of its header status. Latencies include failures and measure fetch/body consumption, not just database time; percentiles use nearest rank. HTTP 201 is the existing API's saved-registration success contract; the script counts status codes and does not independently query the database.

Exit code is 0 only if all configured requests returned a completed 201 response; 1 indicates failures/configuration issues; 130 indicates interruption. No submitted payloads, response bodies, tokens, credentials, environment secrets or raw exception messages are printed.

## Manual Supabase cleanup

Inspect first:

```sql
select count(*)
from public.registrations
where school = '__RRE_LOAD_TEST__';
```

After confirming these are your synthetic test rows, manually execute:

```sql
delete from public.registrations
where school = '__RRE_LOAD_TEST__';
```

Verify afterward:

```sql
select count(*)
from public.registrations
where school = '__RRE_LOAD_TEST__';
```

This cleanup removes rows from **all runs** with that exact marker. It is never run by the script. The script cannot cancel a server-side insert that already happened, so a late row may appear after an interrupted run; inspect again once requests have settled.
