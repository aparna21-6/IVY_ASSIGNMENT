// API client for Ivy Homes.
//
// IMPORTANT — this does NOT match the shipped documentation, it matches
// the API as actually observed:
//   - the API key goes in an "X-API-Key" header, not an "api_key" query
//     parameter (the doc's Authentication section is wrong about this)
//   - POST /auth/login returns "access_token", not "token"
//   - every endpoint (including plain listing browsing) requires a valid
//     Bearer token, not just the API key — the doc implies the API key
//     alone is enough to browse
//   - the token's real lifetime appears to be far shorter than the
//     documented 24 hours, and there is no refresh endpoint, so this
//     client silently re-authenticates with the stored credentials
//     whenever a request comes back 401. That's the only way to satisfy
//     "the app must still be working thirty minutes after login" against
//     a token that may not actually live that long.
//
// Credentials are kept in sessionStorage (not localStorage) so a
// silent re-login survives a page refresh but is cleared when the tab
// closes — a reasonable middle ground for a demo environment with shared
// demo credentials.

const BASE_URL = "https://solve.ivy.homes";
const API_KEY = import.meta.env.VITE_IVY_API_KEY;

if (!API_KEY) {
  // eslint-disable-next-line no-console
  console.warn("VITE_IVY_API_KEY is not set. Copy .env.example to .env and add your key.");
}

function getToken() {
  return sessionStorage.getItem("ivy_access_token");
}
function setSession({ access_token, expires_in, user }) {
  sessionStorage.setItem("ivy_access_token", access_token);
  sessionStorage.setItem("ivy_token_at", String(Date.now()));
  if (expires_in) sessionStorage.setItem("ivy_expires_in", String(expires_in));
  if (user) sessionStorage.setItem("ivy_user", JSON.stringify(user));
}
function clearSession() {
  sessionStorage.removeItem("ivy_access_token");
  sessionStorage.removeItem("ivy_token_at");
  sessionStorage.removeItem("ivy_expires_in");
  sessionStorage.removeItem("ivy_user");
  sessionStorage.removeItem("ivy_email");
  sessionStorage.removeItem("ivy_password");
}
function getStoredCredentials() {
  const email = sessionStorage.getItem("ivy_email");
  const password = sessionStorage.getItem("ivy_password");
  return email && password ? { email, password } : null;
}

export function getStoredUser() {
  const raw = sessionStorage.getItem("ivy_user");
  return raw ? JSON.parse(raw) : null;
}
export function isLoggedIn() {
  return Boolean(getToken());
}

async function rawRequest(path, { params = {}, method = "GET", body, needsAuth = true } = {}) {
  const url = new URL(BASE_URL + path);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
  });

  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    "X-API-Key": API_KEY,
  };
  if (needsAuth && token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let payload = null;
  try {
    payload = await res.json();
  } catch {
    // no body (e.g. DELETE)
  }

  // eslint-disable-next-line no-console
  console.debug(`[ivy-api] ${method} ${path}`, params, "->", res.status, payload);

  if (!res.ok) {
    const err = new Error(`${method} ${path} -> ${res.status}: ${payload?.detail || res.statusText}`);
    err.status = res.status;
    err.payload = payload;
    throw err;
  }
  return payload;
}

/**
 * Wraps rawRequest: on a 401, tries exactly one silent re-login using
 * stored credentials, then retries the original request once. This is
 * what lets the app stay "logged in" functionally well past whatever the
 * real token lifetime turns out to be.
 */
async function request(path, opts = {}) {
  try {
    return await rawRequest(path, opts);
  } catch (e) {
    if (e.status === 401 && opts.needsAuth !== false) {
      const creds = getStoredCredentials();
      if (creds) {
        await performLogin(creds.email, creds.password);
        return rawRequest(path, opts);
      }
    }
    throw e;
  }
}

async function performLogin(email, password) {
  const data = await rawRequest("/auth/login", {
    method: "POST",
    body: { email, password },
    needsAuth: false,
  });
  // Be defensive about the field name too — the doc says "token", reality
  // (per observed behavior) is "access_token". Accept either.
  const accessToken = data.access_token ?? data.token;
  setSession({ access_token: accessToken, expires_in: data.expires_in, user: data.user });
  return data;
}

// ---- Auth -------------------------------------------------------------

export async function login(email, password) {
  const data = await performLogin(email, password);
  sessionStorage.setItem("ivy_email", email);
  sessionStorage.setItem("ivy_password", password);
  return data;
}

export async function logout() {
  try {
    await request("/auth/logout", { method: "POST" });
  } finally {
    clearSession();
  }
}

// ---- Generic full-collection sweep ------------------------------------

const MAX_LIMIT = 200;

export async function fetchAllPages(path) {
  let page = 1;
  let all = [];
  let total = null;

  while (true) {
    const data = await request(path, { params: { page, limit: MAX_LIMIT } });
    const results = data.results || [];
    total = data.total;
    all = all.concat(results);
    if (results.length === 0) break;
    if (total !== null && all.length >= total) break;
    page += 1;
  }
  return all;
}

export const fetchAllListings = () => fetchAllPages("/v1/listings");
export const fetchAllRentals = () => fetchAllPages("/v1/rentals");
export const fetchAllProjects = () => fetchAllPages("/v1/projects");

export const fetchListing = (id) => request(`/v1/listing/${id}`);
export const fetchSimilarListings = (id) => request(`/v1/listings/${id}/similar`);
export const fetchRental = (id) => request(`/v1/rentals/${id}`);
export const fetchProject = (id) => request(`/v1/projects/${id}`);
export const fetchAnalyticsSummary = () => request("/v1/analytics/summary");

// ---- Favourites ---------------------------------------------------------

export const fetchFavourites = () => request("/v1/favourites");
export const addFavourite = (id) => request("/v1/favourites", { method: "POST", body: { id } });
export const removeFavourite = (id) => request(`/v1/favourites/${id}`, { method: "DELETE" });

// ---- Field normalization helpers ----------------------------------------
// The doc's own object samples disagree with each other on field names
// between /v1/listings and /v1/rentals.

export function getSuperBuiltUpArea(record) {
  return record.super_built_up_area ?? record.super_builtup_area ?? null;
}
export function getBedroomCount(record) {
  return record.bedroom ?? record.bhk ?? null;
}
