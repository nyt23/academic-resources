// Server-side project management (API routes and Server Components only)
import type { Project } from './projects';

const PROJECTS_KEY = 'projects';

// Check if we're running on Vercel platform
function isVercelPlatform(): boolean {
  // Vercel automatically sets VERCEL=1 in production
  return process.env.VERCEL === '1' || !!process.env.VERCEL_ENV;
}

// Check if Redis/KV is configured
function hasRedisConfig(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL);
}

// Determine if we should use Redis/KV (required on Vercel, optional locally)
function shouldUseRedis(): boolean {
  // If on Vercel, we MUST use Redis/KV (file system is read-only)
  if (isVercelPlatform()) {
    return true;
  }
  // Locally, use Redis/KV if configured, otherwise use local storage
  return hasRedisConfig();
}

function getRedisConfig() {
  // Try Vercel KV variables first (if using Vercel KV)
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    return {
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    };
  }
  // Fall back to Upstash Redis variables
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return {
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    };
  }
  return null;
}

async function getAllProjectsFromKV(): Promise<Project[]> {
  // Use local storage if not on Vercel and Redis not configured
  if (!shouldUseRedis()) {
    return getAllProjectsLocal();
  }
  
  try {
    const redisConfig = getRedisConfig();
    if (!redisConfig) {
      if (isVercelPlatform()) {
        throw new Error('Redis/KV configuration is required on Vercel. Please set either KV_REST_API_URL/KV_REST_API_TOKEN (for Vercel KV) or UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN (for Upstash Redis) in your Vercel environment variables.');
      }
      // Fallback to local storage if not on Vercel
      return getAllProjectsLocal();
    }
    
    const { Redis } = await import('@upstash/redis');
    const redis = new Redis({
      url: redisConfig.url,
      token: redisConfig.token,
    });
    const projects = await redis.get<Project[]>(PROJECTS_KEY);
    return projects || [];
  } catch (error) {
    console.error('Error reading projects from Redis:', error);
    // On Vercel, we can't fallback to local storage
    if (isVercelPlatform()) {
      throw error; // Re-throw so we can see the actual error
    }
    // Locally, fallback to local storage if Redis fails
    console.warn('Redis failed, falling back to local storage');
    return getAllProjectsLocal();
  }
}

async function saveProjectsToKV(projects: Project[]): Promise<void> {
  // Use local storage if not on Vercel and Redis not configured
  if (!shouldUseRedis()) {
    try {
      saveProjectsLocal(projects);
      return;
    } catch (error) {
      console.error('Error saving projects locally:', error);
      throw error;
    }
  }
  
  try {
    const redisConfig = getRedisConfig();
    if (!redisConfig) {
      if (isVercelPlatform()) {
        throw new Error('Redis/KV configuration is required on Vercel. Please set either KV_REST_API_URL/KV_REST_API_TOKEN (for Vercel KV) or UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN (for Upstash Redis) in your Vercel environment variables.');
      }
      // Fallback to local storage if not on Vercel
      saveProjectsLocal(projects);
      return;
    }
    
    const { Redis } = await import('@upstash/redis');
    const redis = new Redis({
      url: redisConfig.url,
      token: redisConfig.token,
    });
    await redis.set(PROJECTS_KEY, projects);
  } catch (error) {
    console.error('Error saving projects to Redis:', error);
    // On Vercel, we can't fallback to local storage
    if (isVercelPlatform()) {
      throw error; // Re-throw so we can see the actual error
    }
    // Locally, fallback to local storage if Redis fails
    console.warn('Redis failed, falling back to local storage');
    try {
      saveProjectsLocal(projects);
    } catch (localError) {
      console.error('Error saving projects locally:', localError);
      throw localError;
    }
  }
}

// Local storage fallback (for development)
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(PROJECTS_FILE)) {
      fs.writeFileSync(PROJECTS_FILE, JSON.stringify([]));
    }
  } catch (error) {
    console.error('Error ensuring data directory exists:', error);
    throw error; // Re-throw to be caught by the calling function
  }
}

function getAllProjectsLocal(): Project[] {
  try {
    ensureDataDir();
    const data = fs.readFileSync(PROJECTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading projects from local storage:', error);
    // Return empty array if file doesn't exist or is corrupted
    return [];
  }
}

function saveProjectsLocal(projects: Project[]): void {
  try {
    ensureDataDir();
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2));
  } catch (error) {
    console.error('Error saving projects to local storage:', error);
    throw error; // Re-throw to be caught by the calling function
  }
}

export async function getAllProjects(): Promise<Project[]> {
  return await getAllProjectsFromKV();
}

export async function getProject(id: string): Promise<Project | null> {
  const projects = await getAllProjectsFromKV();
  return projects.find(p => p.id === id) || null;
}

export async function createProject(
  name: string, 
  description?: string, 
  moduleName?: string, 
  supervisorName?: string
): Promise<Project> {
  const projects = await getAllProjectsFromKV();
  const newProject: Project = {
    id: Date.now().toString(),
    name,
    description,
    moduleName,
    supervisorName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  projects.push(newProject);
  await saveProjectsToKV(projects);
  return newProject;
}

export async function updateProject(
  id: string, 
  updates: Partial<Pick<Project, 'name' | 'description' | 'moduleName' | 'supervisorName'>>
): Promise<Project | null> {
  const projects = await getAllProjectsFromKV();
  const projectIndex = projects.findIndex(p => p.id === id);
  
  if (projectIndex === -1) {
    return null;
  }
  
  const existingProject = projects[projectIndex];
  projects[projectIndex] = {
    ...existingProject,
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  await saveProjectsToKV(projects);
  return projects[projectIndex];
}
