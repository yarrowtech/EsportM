import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';

type CloudinarySignatureOptions = {
  folder: string;
  resourceType?: 'auto' | 'image' | 'video';
  transformation?: string;
};

function sanitizeFolder(value: string) {
  return String(value || '')
    .trim()
    .replace(/\\/g, '/')
    .replace(/\/+/g, '/')
    .replace(/\.\./g, '')
    .replace(/^\//, '')
    .slice(0, 120);
}

function sanitizeTransformation(value?: string) {
  return String(value || '')
    .trim()
    .replace(/[^\w:.,/\\-]/g, '')
    .slice(0, 220);
}

export function createCloudinaryUploadSignature(
  config: ConfigService,
  options: CloudinarySignatureOptions,
) {
  const cloudName = String(config.get<string>('CLOUDINARY_CLOUD_NAME') || '').trim();
  const apiKey = String(config.get<string>('CLOUDINARY_API_KEY') || '').trim();
  const apiSecret = String(config.get<string>('CLOUDINARY_API_SECRET') || '').trim();

  if (!cloudName || !apiKey || !apiSecret) {
    throw new ServiceUnavailableException(
      'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in API env.',
    );
  }

  const folder = sanitizeFolder(options.folder);
  const timestamp = Math.floor(Date.now() / 1000);
  const transformation = sanitizeTransformation(options.transformation);
  const paramsToSign: Record<string, string | number> = { folder, timestamp };

  if (transformation) {
    paramsToSign.transformation = transformation;
  }

  const payload = Object.keys(paramsToSign)
    .sort()
    .map((key) => `${key}=${paramsToSign[key]}`)
    .join('&');
  const signature = createHash('sha1')
    .update(`${payload}${apiSecret}`)
    .digest('hex');

  return {
    cloudName,
    apiKey,
    folder,
    timestamp,
    signature,
    resourceType: options.resourceType || 'image',
    transformation: transformation || undefined,
  };
}

export function assertCloudinarySecureUrl(
  config: ConfigService,
  value: string,
  fieldName: string,
) {
  const cloudName = String(config.get<string>('CLOUDINARY_CLOUD_NAME') || '').trim();
  let parsed: URL;

  try {
    parsed = new URL(value);
  } catch {
    throw new BadRequestException(`${fieldName} must be a valid Cloudinary URL`);
  }

  const expectedPathPrefix = `/${cloudName}/`;
  if (
    parsed.protocol !== 'https:' ||
    parsed.hostname !== 'res.cloudinary.com' ||
    !cloudName ||
    !parsed.pathname.startsWith(expectedPathPrefix)
  ) {
    throw new BadRequestException(`${fieldName} must be uploaded through the configured media service`);
  }
}
