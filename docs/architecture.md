# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

- Presentation tier decision: Keep React views on the shared API client and relative `/api` paths; preserve accessible loading, empty, and error states. No authentication is added.
- Logic tier decision: Keep request validation and business behavior in the existing Express service functions, with routes forwarding deliberate 4xx errors.
- Data tier decision: Enforce required contract fields in the Mongoose schemas, retain the empty-array default for team members, and preserve the idempotent upsert-based seed behavior.
- Activity tracking approach: Accept `userId`, `teamId`, `type`, and positive `minutes`; validate ID shape and referenced records; compute points from the activity type and store `occurredAt`.
- Team management approach: Require non-empty `name` and `mascot`; accept an optional member-ID array only when every member exists.
- Leaderboard approach: Aggregate activity points by team, sort totals descending (team name as a deterministic tie-breaker), and return `teamName`, `totalPoints`, and 1-based `rank`.
- Workout suggestions approach: Find the user by normalized email, prefer a workout matching `fitnessGoal`, otherwise use the latest activity type; include a reason and return a deliberate 4xx for an unknown user.

## Test plan

- `npm run test:data --prefix octofit-tracker/backend` — initially 4 failed / 1 passed: required validators were missing for user fitness goal, team mascot, activity points/date, and workout fields. After the schema changes: **5 passed**. The seed test passing verifies fixtures remain idempotent and unrelated records are preserved.
- `npm run test:api --prefix octofit-tracker/backend` — initially 3 failed / 1 passed: valid activity creation returned 400 because the service read the wrong input field names; leaderboard output used fields other than the contract's `teamName` and `totalPoints`; workout suggestions did not use the user's `fitnessGoal`, latest `occurredAt`, or workout `focus`. After the service changes: **4 passed**.
- `npm test --prefix octofit-tracker/frontend` — **15 passed** after frontend implementation; no frontend regression was observed during the backend changes.
- `npm run build --prefix octofit-tracker/backend` — **passed** (`tsc --noEmit`) after backend changes.
- `npm run build --prefix octofit-tracker/frontend` — **passed** (TypeScript check and Vite production build) after frontend changes.
- `git diff --check` — **passed**; no whitespace errors.
