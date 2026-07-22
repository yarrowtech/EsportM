import axios from "axios";
import { http } from "./http";

const MAX_PROFILE_IMAGE_BYTES = 5 * 1024 * 1024;

export type ProfileMediaSignature = {
  cloudName: string;
  apiKey: string;
  folder: string;
  timestamp: number;
  signature: string;
  resourceType?: "image";
  transformation?: string;
};

export type UploadedProfileImage = {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  bytes?: number;
};

export function assertProfileImageFile(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Choose a PNG, JPG, or WebP image.");
  }
  if (file.size > MAX_PROFILE_IMAGE_BYTES) {
    throw new Error("Image must be 5 MB or smaller.");
  }
}

export async function createAvatarSignature(): Promise<ProfileMediaSignature> {
  const { data } = await http.post<ProfileMediaSignature>("/auth/me/avatar/signature");
  return data;
}

export async function saveAvatar(payload: { avatarUrl: string; avatarPublicId?: string }) {
  const { data } = await http.patch("/auth/me/avatar", payload);
  return data;
}

export async function createClubLogoSignature(clubId: string): Promise<ProfileMediaSignature> {
  const { data } = await http.post<ProfileMediaSignature>(
    `/clubs/${encodeURIComponent(clubId)}/logo/signature`
  );
  return data;
}

export async function saveClubLogo(
  clubId: string,
  payload: { logoUrl: string; logoPublicId?: string }
) {
  const { data } = await http.patch<{ club: { id: string; logoUrl: string } }>(
    `/clubs/${encodeURIComponent(clubId)}/logo`,
    payload
  );
  return data;
}

export async function uploadProfileImageToCloudinary(
  file: File,
  signature: ProfileMediaSignature,
  onProgress?: (percent: number) => void
): Promise<UploadedProfileImage> {
  assertProfileImageFile(file);

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", signature.apiKey);
  form.append("timestamp", String(signature.timestamp));
  form.append("signature", signature.signature);
  form.append("folder", signature.folder);
  if (signature.transformation) {
    form.append("transformation", signature.transformation);
  }

  const endpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(
    signature.cloudName
  )}/image/upload`;

  const response = await axios.post(endpoint, form, {
    onUploadProgress: (event) => {
      if (!event.total || !onProgress) return;
      onProgress(Math.round((event.loaded * 100) / event.total));
    },
  });

  const body = response.data || {};
  const url = String(body.secure_url || body.url || "");
  const publicId = String(body.public_id || "");
  if (!url || !publicId) {
    throw new Error("Image upload completed without media details.");
  }

  return {
    url,
    publicId,
    width: typeof body.width === "number" ? body.width : undefined,
    height: typeof body.height === "number" ? body.height : undefined,
    bytes: typeof body.bytes === "number" ? body.bytes : undefined,
  };
}
