import { put, del, head } from '@vercel/blob';

const FILES_KEY = 'files';

export interface FileMetadata {
  id: string;
  projectId: string;
  categoryId: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
  blobUrl?: string; // Store the Vercel Blob URL
}

// Fallback to local storage if Redis is not available (for local development)
function isVercelEnvironment(): boolean {
  return !!(process.env.BLOB_READ_WRITE_TOKEN && process.env.UPSTASH_REDIS_REST_URL);
}

async function getAllFilesFromKV(): Promise<FileMetadata[]> {
  if (!isVercelEnvironment()) {
    // Fallback to local storage for development
    return getAllFilesLocal();
  }
  
  try {
    if (process.env.UPSTASH_REDIS_REST_URL) {
      const { Redis } = await import('@upstash/redis');
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      });
      const files = await redis.get<FileMetadata[]>(FILES_KEY);
      return files || [];
    }
    return [];
  } catch (error) {
    console.error('Error reading files from Redis:', error);
    return getAllFilesLocal(); // Fallback to local storage
  }
}

async function saveFilesToKV(files: FileMetadata[]): Promise<void> {
  if (!isVercelEnvironment()) {
    // Fallback to local storage for development
    saveFilesLocal(files);
    return;
  }
  
  try {
    if (process.env.UPSTASH_REDIS_REST_URL) {
      const { Redis } = await import('@upstash/redis');
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      });
      await redis.set(FILES_KEY, files);
    }
  } catch (error) {
    console.error('Error saving files to Redis:', error);
    saveFilesLocal(files); // Fallback to local storage
  }
}

// Local storage fallback (for development)
import fs from 'fs';
import path from 'path';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const FILES_DATA_FILE = path.join(process.cwd(), 'data', 'files.json');

function ensureFilesDataFile() {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(FILES_DATA_FILE)) {
    fs.writeFileSync(FILES_DATA_FILE, JSON.stringify([]));
  }
}

function getAllFilesLocal(): FileMetadata[] {
  ensureFilesDataFile();
  try {
    const data = fs.readFileSync(FILES_DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveFilesLocal(files: FileMetadata[]): void {
  ensureFilesDataFile();
  fs.writeFileSync(FILES_DATA_FILE, JSON.stringify(files, null, 2));
}

export async function getAllFiles(): Promise<FileMetadata[]> {
  return await getAllFilesFromKV();
}

export function getFilesByProject(projectId: string): Promise<FileMetadata[]> {
  return getAllFiles().then(files => files.filter(f => f.projectId === projectId));
}

export function getFilesByCategory(projectId: string, categoryId: string): Promise<FileMetadata[]> {
  return getAllFiles().then(files => 
    files.filter(f => f.projectId === projectId && f.categoryId === categoryId)
  );
}

export async function saveFileMetadata(metadata: FileMetadata): Promise<void> {
  const files = await getAllFilesFromKV();
  files.push(metadata);
  await saveFilesToKV(files);
}

export function getFilePath(projectId: string, categoryId: string, filename: string): string {
  // This is kept for compatibility with local file system fallback
  return path.join(UPLOADS_DIR, projectId, categoryId, filename);
}

export async function saveFile(
  projectId: string,
  categoryId: string,
  filename: string,
  buffer: Buffer
): Promise<string> {
  if (!isVercelEnvironment()) {
    // Fallback to local storage for development
    return saveFileLocal(projectId, categoryId, filename, buffer);
  }

  try {
    const blobPath = `${projectId}/${categoryId}/${filename}`;
    // Convert Buffer to ArrayBuffer for Vercel Blob compatibility
    // Create a new ArrayBuffer copy to ensure type compatibility
    const arrayBuffer = new ArrayBuffer(buffer.length);
    new Uint8Array(arrayBuffer).set(buffer);
    const blob = await put(blobPath, arrayBuffer, {
      access: 'public',
      addRandomSuffix: false,
    });
    return blob.url;
  } catch (error) {
    console.error('Error uploading to Vercel Blob:', error);
    throw error;
  }
}

function saveFileLocal(
  projectId: string,
  categoryId: string,
  filename: string,
  buffer: Buffer
): string {
  const projectDir = path.join(UPLOADS_DIR, projectId);
  const categoryDir = path.join(projectDir, categoryId);
  if (!fs.existsSync(categoryDir)) {
    fs.mkdirSync(categoryDir, { recursive: true });
  }
  const filePath = path.join(categoryDir, filename);
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

export async function deleteFile(projectId: string, categoryId: string, filename: string): Promise<void> {
  const files = await getAllFilesFromKV();
  const fileMetadata = files.find(
    f => f.projectId === projectId && f.categoryId === categoryId && f.filename === filename
  );

  // Delete from Vercel Blob if URL exists
  if (fileMetadata?.blobUrl && isVercelEnvironment()) {
    try {
      await del(fileMetadata.blobUrl);
    } catch (error) {
      console.error('Error deleting from Vercel Blob:', error);
    }
  } else if (!isVercelEnvironment()) {
    // Delete from local storage
    const filePath = getFilePath(projectId, categoryId, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  // Remove from metadata
  const filtered = files.filter(
    f => !(f.projectId === projectId && f.categoryId === categoryId && f.filename === filename)
  );
  await saveFilesToKV(filtered);
}

export async function getFileBlobUrl(projectId: string, categoryId: string, filename: string): Promise<string | null> {
  const files = await getAllFilesFromKV();
  const fileMetadata = files.find(
    f => f.projectId === projectId && f.categoryId === categoryId && f.filename === filename
  );
  return fileMetadata?.blobUrl || null;
}
