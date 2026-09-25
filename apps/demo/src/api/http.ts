// This is a standalone sales demo: there is no backend. Every request made
// through this axios instance is answered by an in-memory mock adapter
// (see ./mock/adapter.ts) instead of hitting the network.
import axios from "axios";
import { mockAdapter } from "./mock/adapter";

export const http = axios.create({
  baseURL: "/mock-api",
  adapter: mockAdapter,
});
