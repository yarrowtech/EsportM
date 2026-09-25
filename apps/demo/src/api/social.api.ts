import axios from "axios";
import { http } from "./http";

export type SocialRole =
  | "PLAYER"
  | "MANAGER"
  | "ADMIN"
  | "MEMBER"
  | "COACH"
  | "PHYSIO"
  | "AGENT"
  | "NUTRITIONIST"
  | "PITCH_MANAGER";

export type SocialFeedComment = {
  id: string;
  text: string;
  createdAt: string;
  author: {
    id: string;
    fullName: string;
    role: SocialRole;
  };
};

export type SocialFeedPost = {
  id: string;
  skill: string;
  caption: string;
  tags: string[];
  createdAt: string;
  instagramUrl: string | null;
  author: {
    id: string;
    fullName: string;
    role: SocialRole;
    club: { id: string; name: string; slug: string } | null;
  };
  media: {
    id: string;
    kind: "image" | "video";
    url: string;
    publicId: string;
    format: string | null;
    width: number | null;
    height: number | null;
    durationSec: number | null;
    bytes: number | null;
  } | null;
  stats: {
    reactions: number;
    comments: number;
    likedByMe: boolean;
  };
  comments: SocialFeedComment[];
};

export type SocialFeedResponse = {
  count: number;
  posts: SocialFeedPost[];
};

export type SocialMediaSignature = {
  cloudName: string;
  apiKey: string;
  folder: string;
  timestamp: number;
  signature: string;
  resourceType: "auto" | "image" | "video";
  transformation?: string;
};

export const MAX_IMAGE_UPLOAD_BYTES = 8 * 1024 * 1024;
export const MAX_VIDEO_UPLOAD_BYTES = 80 * 1024 * 1024;
export const MAX_VIDEO_INPUT_BYTES = 200 * 1024 * 1024;
export const MAX_IMAGE_WIDTH_PX = 1920;
export const MAX_IMAGE_HEIGHT_PX = 1920;
export const MAX_VIDEO_WIDTH_PX = 1280;
export const MAX_VIDEO_HEIGHT_PX = 720;
export const MAX_VIDEO_DURATION_SEC = 90;

export type CreateSocialPostPayload = {
  skill: string;
  caption: string;
  tags?: string[];
  instagramUrl?: string;
  media?: {
    kind: "image" | "video";
    url: string;
    publicId: string;
    format?: string;
    width?: number;
    height?: number;
    durationSec?: number;
    bytes?: number;
  };
};

export type UploadedSocialMedia = NonNullable<CreateSocialPostPayload["media"]>;

export async function getSocialFeed(limit = 20): Promise<SocialFeedResponse> {
  const { data } = await http.get<SocialFeedResponse>("/social/feed", {
    params: { limit },
  });
  return data;
}

export async function createSocialMediaSignature(payload?: {
  resourceType?: "auto" | "image" | "video";
  folder?: string;
  transformation?: string;
}): Promise<SocialMediaSignature> {
  const { data } = await http.post<SocialMediaSignature>("/social/media/signature", payload || {});
  return data;
}

export async function createSocialPost(payload: CreateSocialPostPayload) {
  const { data } = await http.post<{ post: SocialFeedPost }>("/social/posts", payload);
  return data;
}

export async function toggleSocialLike(postId: string) {
  const { data } = await http.post<{ postId: string; liked: boolean; reactions: number }>(
    `/social/posts/${encodeURIComponent(postId)}/reactions/like`
  );
  return data;
}

export async function createSocialComment(postId: string, text: string) {
  const { data } = await http.post<{ comment: SocialFeedComment; comments: number }>(
    `/social/posts/${encodeURIComponent(postId)}/comments`,
    { text }
  );
  return data;
}

export async function deleteSocialComment(commentId: string) {
  const { data } = await http.delete<{ ok: boolean }>(
    `/social/comments/${encodeURIComponent(commentId)}`
  );
  return data;
}

export async function uploadSocialMediaToCloudinary(
  file: File,
  signature: SocialMediaSignature,
  onProgress?: (percent: number) => void
): Promise<UploadedSocialMedia> {
  const data = new FormData();
  data.append("file", file);
  data.append("api_key", signature.apiKey);
  data.append("timestamp", String(signature.timestamp));
  data.append("signature", signature.signature);
  data.append("folder", signature.folder);
  if (signature.transformation) {
    data.append("transformation", signature.transformation);
  }

  const endpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(
    signature.cloudName
  )}/${signature.resourceType || "auto"}/upload`;

  const response = await axios.post(endpoint, data, {
    onUploadProgress: (event) => {
      if (!event.total || !onProgress) return;
      const percent = Math.round((event.loaded * 100) / event.total);
      onProgress(percent);
    },
  });

  const body = response.data || {};
  const kind = String(body.resource_type || "").toLowerCase() === "video" ? "video" : "image";

  return {
    kind,
    url: String(body.secure_url || body.url || ""),
    publicId: String(body.public_id || ""),
    format: body.format ? String(body.format) : undefined,
    width: typeof body.width === "number" ? body.width : undefined,
    height: typeof body.height === "number" ? body.height : undefined,
    durationSec: typeof body.duration === "number" ? body.duration : undefined,
    bytes: typeof body.bytes === "number" ? body.bytes : undefined,
  };
}

function fileNameWithExt(originalName: string, fallbackBase: string, ext: string) {
  const base = String(originalName || fallbackBase)
    .replace(/\.[^/.]+$/, "")
    .replace(/[^\w.-]/g, "_")
    .slice(0, 80);
  return `${base || fallbackBase}.${ext}`;
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Unable to read image"));
    };
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Unable to compress image"));
          return;
        }
        resolve(blob);
      },
      type,
      quality
    );
  });
}

export async function compressImageToMaxBytes(file: File, maxBytes: number): Promise<File> {
  const img = await loadImageFromFile(file);
  const maxEdge = Math.max(MAX_IMAGE_WIDTH_PX, MAX_IMAGE_HEIGHT_PX);
  const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Unable to process image");
  ctx.drawImage(img, 0, 0, width, height);

  const attempts: Array<{ type: string; quality: number; ext: string }> = [
    { type: "image/webp", quality: 0.88, ext: "webp" },
    { type: "image/webp", quality: 0.78, ext: "webp" },
    { type: "image/webp", quality: 0.68, ext: "webp" },
    { type: "image/jpeg", quality: 0.78, ext: "jpg" },
    { type: "image/jpeg", quality: 0.68, ext: "jpg" },
    { type: "image/jpeg", quality: 0.56, ext: "jpg" },
    { type: "image/jpeg", quality: 0.48, ext: "jpg" },
  ];

  let smallest: File | null = null;

  for (const attempt of attempts) {
    const blob = await canvasToBlob(canvas, attempt.type, attempt.quality);
    const candidate = new File([blob], fileNameWithExt(file.name, "social_media", attempt.ext), {
      type: attempt.type,
      lastModified: Date.now(),
    });
    if (!smallest || candidate.size < smallest.size) {
      smallest = candidate;
    }
    if (candidate.size <= maxBytes) {
      return candidate;
    }
  }

  return smallest || file;
}

type VideoMeta = {
  width: number;
  height: number;
  durationSec: number;
};

function loadVideoMetadata(file: File): Promise<VideoMeta> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";

    video.onloadedmetadata = () => {
      const width = Number(video.videoWidth || 0);
      const height = Number(video.videoHeight || 0);
      const durationSec = Number(video.duration || 0);
      URL.revokeObjectURL(url);
      if (!Number.isFinite(width) || !Number.isFinite(height) || !Number.isFinite(durationSec)) {
        reject(new Error("Unable to read video metadata"));
        return;
      }
      resolve({ width, height, durationSec });
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Unable to read video metadata"));
    };

    video.src = url;
  });
}

export type PreparedSocialUpload = {
  file: File;
  resourceType: "image" | "video";
  transformation?: string;
  note?: string;
};

export async function prepareSocialMediaForUpload(file: File): Promise<PreparedSocialUpload> {
  const isVideo = file.type.startsWith("video/");
  const isImage = file.type.startsWith("image/");

  if (!isVideo && !isImage) {
    throw new Error("Only image and video files are supported");
  }

  if (isImage) {
    const imgMeta = await loadImageFromFile(file);
    const needsResolutionCap =
      imgMeta.width > MAX_IMAGE_WIDTH_PX || imgMeta.height > MAX_IMAGE_HEIGHT_PX;
    const needsSizeCompression = file.size > MAX_IMAGE_UPLOAD_BYTES;

    if (!needsResolutionCap && !needsSizeCompression) {
      return { file, resourceType: "image" };
    }

    const compressed = await compressImageToMaxBytes(file, MAX_IMAGE_UPLOAD_BYTES);
    const compressedMeta = await loadImageFromFile(compressed);
    if (
      compressedMeta.width > MAX_IMAGE_WIDTH_PX ||
      compressedMeta.height > MAX_IMAGE_HEIGHT_PX
    ) {
      throw new Error("Image resolution exceeds 1920x1920");
    }
    if (compressed.size > MAX_IMAGE_UPLOAD_BYTES) {
      throw new Error("Image is still too large after compression. Max allowed is 8 MB");
    }

    const notes: string[] = [];
    if (needsSizeCompression) {
      notes.push(
        `size ${(file.size / 1024 / 1024).toFixed(1)}MB -> ${(compressed.size / 1024 / 1024).toFixed(1)}MB`
      );
    }
    if (needsResolutionCap) {
      notes.push(
        `resolution ${imgMeta.width}x${imgMeta.height} -> ${compressedMeta.width}x${compressedMeta.height}`
      );
    }
    return {
      file: compressed,
      resourceType: "image",
      note: `Image optimized: ${notes.join(", ")}`,
    };
  }

  if (file.size > MAX_VIDEO_INPUT_BYTES) {
    throw new Error("Video is too large. Max raw input is 200 MB");
  }

  const videoMeta = await loadVideoMetadata(file);
  if (videoMeta.durationSec > MAX_VIDEO_DURATION_SEC) {
    throw new Error(`Video duration exceeds ${MAX_VIDEO_DURATION_SEC} seconds`);
  }

  const needsResolutionCap =
    videoMeta.width > MAX_VIDEO_WIDTH_PX || videoMeta.height > MAX_VIDEO_HEIGHT_PX;
  const needsCompression = file.size > MAX_VIDEO_UPLOAD_BYTES || needsResolutionCap;

  if (needsCompression) {
    const notes: string[] = [];
    if (file.size > MAX_VIDEO_UPLOAD_BYTES) {
      notes.push(`size ${(file.size / 1024 / 1024).toFixed(1)}MB -> target <= ${(MAX_VIDEO_UPLOAD_BYTES / 1024 / 1024).toFixed(0)}MB`);
    }
    if (needsResolutionCap) {
      notes.push(
        `resolution ${videoMeta.width}x${videoMeta.height} -> ${MAX_VIDEO_WIDTH_PX}x${MAX_VIDEO_HEIGHT_PX} max`
      );
    }
    return {
      file,
      resourceType: "video",
      transformation: "q_auto:eco,f_mp4,vc_auto,br_1200k,w_1280,h_720,c_limit",
      note: `Video optimization during upload: ${notes.join(", ")}`,
    };
  }

  return { file, resourceType: "video" };
}
