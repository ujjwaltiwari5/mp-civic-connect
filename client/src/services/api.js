import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // needed for the httpOnly JWT cookie
});

// A 401 on most endpoints means the session expired mid-use (7-day cookie ran
// out, or got cleared) — redirect to login so the stale "Hi, [name]" Navbar
// state doesn't linger (Phase 10 known-bug, closed here). Skip this for the
// auth endpoints themselves: /me is the silent "am I logged in?" probe run on
// every page load (a 401 there just means "not logged in yet"), and /login's
// own 401 (wrong password) is already handled by the Login page's own error
// message — redirecting there too would just be noise.
const SKIP_REDIRECT_PATHS = ["/auth/me", "/auth/login", "/auth/register"];

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || "";
    const isSkipped = SKIP_REDIRECT_PATHS.some((path) => url.includes(path));
    if (error.response?.status === 401 && !isSkipped && window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;