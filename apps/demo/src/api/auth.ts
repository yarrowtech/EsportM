import { api } from "./axios";

export type User = {
  id: string;
  email: string;
  fullName?: string | null;
  createdAt?: string;
  updatedAt?: string;

  // optional if your backend includes memberships inside user
  memberships?: Array<{ primary?: string; clubId?: string }>;
};

export type AuthResponse = {
  user: User;
  accessToken: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  email: string;
  password: string;
  fullName?: string;
};

export const loginUser = async (payload: LoginPayload): Promise<AuthResponse> => {
  const res = await api.post("/auth/login", payload);
  return res.data;
};

export const registerUser = async (payload: RegisterPayload): Promise<AuthResponse> => {
  const res = await api.post("/auth/register", payload);
  return res.data;
};

export const fetchMe = async (): Promise<{ user: User }> => {
  const res = await api.get("/auth/me"); // ✅ correct
  return res.data;
};