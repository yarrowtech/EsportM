export { http as api } from "./http";
















// import axios from "axios";

// export const api = axios.create({
//   baseURL: "http://localhost:3000",
// });

// // ✅ pick correct token key based on your storage
// api.interceptors.request.use((config) => {
//   const accessToken = localStorage.getItem("accessToken");

//   // if you want role-based tokens, fallback:
//   const role = localStorage.getItem("role"); // "player" / "manager" etc.
//   const roleToken =
//     role === "player"
//       ? localStorage.getItem("playerToken")
//       : role === "manager"
//       ? localStorage.getItem("managerToken")
//       : null;

//   const token = accessToken || roleToken;

//   if (token) {
//     config.headers = config.headers ?? {};
//     config.headers.Authorization = `Bearer ${token}`;
//   }

//   // optional (if your backend uses this header)
//   const clubId = localStorage.getItem("club_id") || localStorage.getItem("activeClubId");
//   if (clubId) {
//     config.headers["x-club-id"] = clubId;
//   }

//   return config;
// });
