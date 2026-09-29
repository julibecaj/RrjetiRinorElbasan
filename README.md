# Rrjeti Rinor Elbasan

Complete frontend demo for a youth/community platform, based on the supplied Figma PDF and screenshot. Built with Next.js App Router, TypeScript, Tailwind CSS, Plus Jakarta Sans and DM Sans via `next/font/google`.

## Run locally

```sh
npm install
npm run dev
```

Open http://localhost:3000. On Windows PowerShell, use `npm.cmd` if the execution policy blocks `npm.ps1`. The first build needs Google Fonts access.

## Demo walkthrough

1. Sign in at `/login` with `era@example.com` and any password of 6+ characters. No password is stored or checked against a server.
2. Open `/events/ai-workshop`, click **APLIKO**, complete the form, and submit. The application becomes **Në pritje**.
3. Open **Admin · demo** in the footer, then Activities → Applications for that event. Accept Era's application and confirm attendance.
4. Return to `/profile/points`. The balance increases from 30 to 50, with a single 20-point attendance entry. `/profile/applications` and `/profile/activities` update too.
5. Create or edit events, publish opportunities, adjust a user's points with a reason, or change About/supporter content. Changes appear throughout the same tab.

Data lives only in a root React context/reducer. Refreshing the page, opening a new tab, or using **Rivendos të dhënat demo** restores the sample data. Use in-app links to preserve the current walkthrough. Login/logout is visual; there are no real permissions.

## Pages

- Public: Home, About, Events/calendar, event details, opportunities and all four categories, Search.
- Account forms: Sign In, Sign Up, Forgot Password.
- User: profile overview, applications, activities, points, settings, propose an idea.
- Admin: dashboard, event list/create/edit/applications, user list/details, opportunities, content/supporters.
- Unknown routes and unknown mock records show useful fallback screens.

## State and components

- Types: `src/types/index.ts`.
- Mock data: `src/data/{events,users,applications,opportunities}.ts`.
- Shared state and lifecycle rules: `src/lib/demo-state.ts`, `src/components/demo/DemoProvider.tsx`.
- Feature components: `src/components/{home,events,opportunities,search,auth,profile,admin}`.
- Shared UI: accessible native dialogs, badges, buttons, event rows, headings, empty states and containers.
- Design tokens and responsive styles: `src/app/globals.css`.

The demo uses **28 September 2026** as a fixed reference date for predictable filters and walkthroughs. Sample activities include upcoming dates and completed history.

## Validation

```sh
npm run lint
npm test
npx tsc --noEmit
npm run build
```

With a running server, `npm run test:routes` checks all 28 requested concrete routes plus the 404 fallback. It defaults to port 3002; set `DEMO_BASE_URL` to use another address.

The state tests cover submission → approval → attendance, one-time points, duplicate applications, capacity, archived events, registration, logout and reset. They use the existing TypeScript package without adding a test framework.

## Intentional placeholders and limitations

- `public/images/rre-logo.png` is the original logo extracted from the PDF.
- The collage photo was absent from the PDF. The hero keeps the neutral design placeholder and original hierarchy. Event banners and About visuals use the existing palette until real photographs are supplied.
- Video and supporter marks are placeholders. No external logos or video embeds are fetched.
- Event image selection is a local preview, limited to PNG/JPEG/WebP up to 2 MB. It is not an upload.
- Password reset, idea submission and opportunity interest show demo feedback. No messages, emails or applications are sent externally.
- Attendance points have no monetary value. Admin adjustments remain in the local demo ledger.
- No backend, database, auth service, API routes, server actions, localStorage or external CMS. No additional runtime dependencies.
- `tmp/` contains optional verification screenshots only and can be deleted safely.
