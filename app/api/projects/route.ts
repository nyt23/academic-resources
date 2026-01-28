import { NextRequest, NextResponse } from 'next/server';
import { getAllProjects, createProject } from '@/lib/projects-server';
import { isAdminServer } from '@/lib/auth-server';

export async function GET() {
  try {
    const projects = await getAllProjects();
    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Full error stack:', errorStack);
    // Always show error details to help diagnose issues
    return NextResponse.json(
      { 
        error: 'Failed to fetch projects', 
        details: errorMessage,
        hint: errorMessage.includes('Redis') || errorMessage.includes('KV') 
          ? 'Please ensure Redis/KV is configured in your Vercel environment variables (KV_REST_API_URL/KV_REST_API_TOKEN or UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN)'
          : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const isAdmin = await isAdminServer();
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error('Error parsing request body:', error);
      return NextResponse.json(
        { error: 'Invalid request body. Expected JSON.' },
        { status: 400 }
      );
    }

    const { name, description, moduleName, supervisorName } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      );
    }

    const project = await createProject(
      name.trim(), 
      description?.trim(), 
      moduleName?.trim(), 
      supervisorName?.trim()
    );
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error stack:', errorStack);
    return NextResponse.json(
      { 
        error: 'Failed to create project', 
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    );
  }
}
