// import axios from "axios";

// export const http = axios.create({
//   baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
// });

// http.interceptors.request.use((config) => {
//   const token = localStorage.getItem("accessToken");
//   if (token) config.headers.Authorization = `Bearer ${token}`;

//   // active club context stored in localStorage
//   const activeClubId = localStorage.getItem("activeClubId");
//   if (activeClubId) config.headers["x-club-id"] = activeClubId;

//   return config;
// });
















import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:4000";

function isPublicAuthRoute(url?: string) {
  if (!url) return false;
  return /^\/auth\/(login|register)$/.test(url);
}

function isAuthMeRoute(url?: string) {
  if (!url) return false;
  return /^\/auth\/me(?:[?#]|$)/.test(url);
}

export const http = axios.create({
  baseURL: API_BASE_URL,
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  const activeClubId = localStorage.getItem("activeClubId");

  if (!isPublicAuthRoute(config.url)) {
    if (token) config.headers.Authorization = `Bearer ${token}`;
    if (activeClubId && !isAuthMeRoute(config.url)) {
      config.headers["x-club-id"] = activeClubId;
    }
  }

  return config;
});
