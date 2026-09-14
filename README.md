# Ivy Homes

A property browsing app for the September 2026 internship assignment.

## Stack

React 18 + Vite + react-router-dom, plain CSS. Built with help from Claude
(see disclosure below); every line was read before committing.

## Running it locally

```bash
cd ivy-app
npm install

Create a .env file inside the ivy-app folder and add your API key:
Plaintext

VITE_API_KEY=IVY26-YourKeyHere

Then start the development server:
Bash

npm run dev

Log in with one of your three demo accounts.
Why the auth here doesn't match API_REFERENCE.md

The shipped documentation says the API key goes in an api_key query
parameter and that a session token alone (token field, 24h lifetime) is
needed only for user-specific actions like favourites. That's not what the
live API actually does:

    the API key must be sent as an X-API-Key header, not a query param

    POST /auth/login returns access_token, not token

    every endpoint, including plain listing/rental/project browsing, requires
    a valid Bearer token — the API key alone is not sufficient to browse

This is logged as an auth finding in the submission — see submission.json.
Handling the token's real lifetime

Because the actual token lifetime looks considerably shorter than the
documented 24 hours, and there's no documented refresh endpoint, the app
schedules a silent re-login (using the credentials from the current
session) at 80% of the token's reported expires_in, and also falls back
to a one-shot silent re-login if any request ever comes back 401. This is
what makes "still working thirty minutes after login" hold in practice.
Credentials live in sessionStorage only (cleared when the tab closes),
not localStorage.
Why filtering is client-side

The app pulls the full /v1/listings, /v1/rentals, and /v1/projects
collections into memory after login (a few hundred requests, well under the
documented 1200/min limit) and does all filtering, sorting, and pagination
against that local cache. This guarantees the required filters (locality,
bhk, price range, furnishing) work correctly regardless of which query
parameters the live server actually honors, and it's what makes the
Insights screen's recomputed numbers trustworthy.
Saving listings

Favourites are server-backed per user (/v1/favourites), so they persist
across reload and re-login automatically. The ♡/♥ toggle appears inline on
every listing row — in the browse list, not just the detail page — and
updates optimistically (flips instantly, rolls back only if the server call
fails) so it feels immediate.
Known doc-vs-API discrepancies handled defensively in code

    Auth mechanism (see above) — biggest one.

    /v1/listings query parameter is bhk; the returned object field is bedroom. The app maps between them.

    Listings document super_built_up_area; rentals document super_builtup_area (different spelling). The app reads both.

    Projects document price_min and price_max as integer rupees, but they actually return decimals representing Crores. The app accounts for this unit mismatch to display accurate values.

    The /v1/listings endpoint returns massive numbers of duplicates. The app filters these down using a uniqueness fingerprint (latitude, longitude, apartment_name) so the user doesn't see endless repeating rows.

What I would do with another two days

    Interactive Map View: Utilize the latitude and longitude coordinates from the unique properties to plot the listings on a map visually.

    Robust Error Handling: Add global error boundaries and toast notifications to gracefully handle network drops or API rate-limiting without breaking the UI.

How I worked out which parts of the documentation to distrust

    Testing before building: I started by writing custom Python scripts to probe the API before touching the frontend. When the documented ?api_key= query parameter immediately threw a 401, I read the JSON error detail which explicitly told me to use the header instead.

    Hypotheses that didn't pan out: When looking for duplicates, my initial hypothesis was that the API might accidentally duplicate listing_ids across pages. This was false; every ID was technically globally unique. I had to pivot to fingerprinting the actual physical attributes to discover the massive 4850-to-50 duplication ratio.

    Manual Data Inspection: To find the fraud listings, I hypothesized they might have impossible physical traits like negative square footage. While scanning for those, I manually read the description fields and stumbled upon LLM prompt injections (e.g., dataset_audit_ref), proving the descriptions couldn't be blindly trusted by downstream AI tools.

LLM usage disclosure

Used Claude to scaffold the React app, API client, and auth-refresh logic based on my own working auth script. I personally wrote the Python data analysis scripts to independently crunch the raw JSON datasets, manually investigated and discovered the core API discrepancies (auth headers, duplicates, unit mismatches, and prompt injections), verified raw API responses, and calculated the precise business metrics required for Part 2.