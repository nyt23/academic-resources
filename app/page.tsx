'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { checkAdminStatus, logout } from '@/lib/auth';
import { Plus, LogOut, LogIn, Folder, X, Check, Edit } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

interface Project {
  id: string;
  name: string;
  description?: string;
  moduleName?: string;
  supervisorName?: string;
  createdAt: string;
  updatedAt: string;
}

export default function Home() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [newModuleName, setNewModuleName] = useState('');
  const [newSupervisorName, setNewSupervisorName] = useState('');
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editProjectName, setEditProjectName] = useState('');
  const [editProjectDescription, setEditProjectDescription] = useState('');
  const [editModuleName, setEditModuleName] = useState('');
  const [editSupervisorName, setEditSupervisorName] = useState('');

  useEffect(() => {
    checkAdminStatus().then(setIsAdminUser);
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProjectName,
          description: newProjectDescription || undefined,
          moduleName: newModuleName || undefined,
          supervisorName: newSupervisorName || undefined,
        }),
      });

      if (response.ok) {
        setNewProjectName('');
        setNewProjectDescription('');
        setNewModuleName('');
        setNewSupervisorName('');
        setShowCreateForm(false);
        fetchProjects();
      }
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleStartEdit = (project: Project) => {
    setEditingProjectId(project.id);
    setEditProjectName(project.name);
    setEditProjectDescription(project.description || '');
    setEditModuleName(project.moduleName || '');
    setEditSupervisorName(project.supervisorName || '');
  };

  const handleCancelEdit = () => {
    setEditingProjectId(null);
    setEditProjectName('');
    setEditProjectDescription('');
    setEditModuleName('');
    setEditSupervisorName('');
  };

  const handleUpdateProject = async (e: React.FormEvent, projectId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!editProjectName.trim()) return;

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editProjectName,
          description: editProjectDescription || undefined,
          moduleName: editModuleName || undefined,
          supervisorName: editSupervisorName || undefined,
        }),
      });

      if (response.ok) {
        handleCancelEdit();
        fetchProjects();
      }
    } catch (error) {
      console.error('Failed to update project:', error);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#121212] text-gray-900 dark:text-white transition-all duration-300 ease-in-out">
      <div className="bg-white dark:bg-[#121212] border-b border-gray-200 dark:border-gray-800/50 transition-all duration-300 ease-in-out">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-muted-blue rounded-lg flex items-center justify-center flex-shrink-0">
                <Folder className="w-5 h-5 sm:w-6 sm:h-6 text-icon-blue" />
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Academic Resources</h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <ThemeToggle />
              {isAdminUser ? (
                <div className="flex items-center gap-2 sm:gap-4">
                  <span className="text-xs sm:text-sm text-green-600 dark:text-green-400 hidden sm:inline">Admin Mode</span>
                  <button
                    onClick={handleLogout}
                    className="px-3 sm:px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-1 sm:gap-2 text-gray-900 dark:text-white"
                  >
                    <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => router.push('/login')}
                  className="px-3 sm:px-4 py-2 bg-blue-200 dark:bg-blue-600/30 hover:bg-blue-300 dark:hover:bg-blue-600/50 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-1 sm:gap-2 text-blue-800 dark:text-blue-400"
                >
                  <LogIn className="w-3 h-3 sm:w-4 sm:h-4" />
                  Admin Login
                </button>
              )}
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base ml-0 sm:ml-12 md:ml-16">Select your project below to access materials</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-12">

        {isAdminUser && (
          <div className="mb-6">
            {!showCreateForm ? (
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-200 dark:bg-blue-600/30 hover:bg-blue-300 dark:hover:bg-blue-600/50 rounded-lg text-sm sm:text-base font-medium transition-colors flex items-center gap-2 text-blue-800 dark:text-blue-400"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="whitespace-nowrap">Create New Project</span>
              </button>
            ) : (
              <form onSubmit={handleCreateProject} className="bg-gray-50 dark:bg-[#1E1E1E] p-4 sm:p-6 rounded-lg w-full max-w-md border border-gray-200 dark:border-gray-800/30">
                <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-900 dark:text-white">Create New Project</h2>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Project Name *</label>
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="w-full px-4 py-2 bg-white dark:bg-[#252525] border border-gray-300 dark:border-gray-800/50 rounded-lg focus:outline-none focus:border-icon-blue text-gray-900 dark:text-white placeholder-gray-500"
                    placeholder="Enter project name"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Description</label>
                  <textarea
                    value={newProjectDescription}
                    onChange={(e) => setNewProjectDescription(e.target.value)}
                    className="w-full px-4 py-2 bg-white dark:bg-[#252525] border border-gray-300 dark:border-gray-800/50 rounded-lg focus:outline-none focus:border-icon-blue text-gray-900 dark:text-white placeholder-gray-500"
                    placeholder="Enter project description (optional)"
                    rows={3}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Module Name</label>
                  <input
                    type="text"
                    value={newModuleName}
                    onChange={(e) => setNewModuleName(e.target.value)}
                    className="w-full px-4 py-2 bg-white dark:bg-[#252525] border border-gray-300 dark:border-gray-800/50 rounded-lg focus:outline-none focus:border-icon-blue text-gray-900 dark:text-white placeholder-gray-500"
                    placeholder="Enter module name (optional)"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Supervisor Name</label>
                  <input
                    type="text"
                    value={newSupervisorName}
                    onChange={(e) => setNewSupervisorName(e.target.value)}
                    className="w-full px-4 py-2 bg-white dark:bg-[#252525] border border-gray-300 dark:border-gray-800/50 rounded-lg focus:outline-none focus:border-icon-blue text-gray-900 dark:text-white placeholder-gray-500"
                    placeholder="Enter supervisor name (optional)"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-200 dark:bg-blue-600 hover:bg-blue-300 dark:hover:bg-blue-700 rounded-lg text-sm sm:text-base font-medium transition-colors flex items-center justify-center gap-2 text-blue-800 dark:text-white"
                  >
                    <Check className="w-4 h-4" />
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewProjectName('');
                      setNewProjectDescription('');
                      setNewModuleName('');
                      setNewSupervisorName('');
                    }}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg text-sm sm:text-base font-medium transition-colors flex items-center justify-center gap-2 text-gray-900 dark:text-white"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {projects.map((project) => (
            editingProjectId === project.id ? (
              <form
                key={project.id}
                onSubmit={(e) => handleUpdateProject(e, project.id)}
                onClick={(e) => e.stopPropagation()}
                className="bg-gray-50 dark:bg-[#1E1E1E] p-4 sm:p-6 rounded-lg border border-gray-200 dark:border-gray-800/30"
              >
                <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-900 dark:text-white">Edit Project</h2>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Project Name *</label>
                  <input
                    type="text"
                    value={editProjectName}
                    onChange={(e) => setEditProjectName(e.target.value)}
                    className="w-full px-4 py-2 bg-white dark:bg-[#252525] border border-gray-300 dark:border-gray-800/50 rounded-lg focus:outline-none focus:border-icon-blue text-gray-900 dark:text-white placeholder-gray-500"
                    placeholder="Enter project name"
                    required
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Description</label>
                  <textarea
                    value={editProjectDescription}
                    onChange={(e) => setEditProjectDescription(e.target.value)}
                    className="w-full px-4 py-2 bg-white dark:bg-[#252525] border border-gray-300 dark:border-gray-800/50 rounded-lg focus:outline-none focus:border-icon-blue text-gray-900 dark:text-white placeholder-gray-500"
                    placeholder="Enter project description (optional)"
                    rows={3}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Module Name</label>
                  <input
                    type="text"
                    value={editModuleName}
                    onChange={(e) => setEditModuleName(e.target.value)}
                    className="w-full px-4 py-2 bg-white dark:bg-[#252525] border border-gray-300 dark:border-gray-800/50 rounded-lg focus:outline-none focus:border-icon-blue text-gray-900 dark:text-white placeholder-gray-500"
                    placeholder="Enter module name (optional)"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Supervisor Name</label>
                  <input
                    type="text"
                    value={editSupervisorName}
                    onChange={(e) => setEditSupervisorName(e.target.value)}
                    className="w-full px-4 py-2 bg-white dark:bg-[#252525] border border-gray-300 dark:border-gray-800/50 rounded-lg focus:outline-none focus:border-icon-blue text-gray-900 dark:text-white placeholder-gray-500"
                    placeholder="Enter supervisor name (optional)"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-200 dark:bg-blue-600 hover:bg-blue-300 dark:hover:bg-blue-700 rounded-lg text-sm sm:text-base font-medium transition-colors flex items-center justify-center gap-2 text-blue-800 dark:text-white"
                  >
                    <Check className="w-4 h-4" />
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg text-sm sm:text-base font-medium transition-colors flex items-center justify-center gap-2 text-gray-900 dark:text-white"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div
                key={project.id}
                onClick={() => router.push(`/projects/${project.id}`)}
                className="bg-gray-50 dark:bg-[#1E1E1E] p-4 sm:p-6 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-[#252525] transition-colors border border-gray-200 dark:border-gray-800/30 relative"
              >
                {isAdminUser && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartEdit(project);
                    }}
                    className="absolute top-2 right-2 sm:top-4 sm:right-4 p-1.5 sm:p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Edit project"
                  >
                    <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                )}
                <div className="mb-2 pr-8 sm:pr-12">
                  <div className="flex items-center gap-2 mb-1">
                    <Folder className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 dark:text-blue-400 flex-shrink-0" />
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white break-words">{project.name}</h2>
                  </div>
                  {project.moduleName && (
                    <div className="mb-2 ml-0 sm:ml-7">
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 text-xs font-medium rounded-md border border-blue-300 dark:border-blue-600/30">
                        {project.moduleName}
                      </span>
                    </div>
                  )}
                  {project.supervisorName && (
                    <p className="text-gray-600 dark:text-gray-300 text-xs ml-0 sm:ml-7">Supervisor: {project.supervisorName}</p>
                  )}
                </div>
                {project.description && (
                  <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mb-4 break-words">{project.description}</p>
                )}
              </div>
            )
          ))}
        </div>

        {projects.length === 0 && (
          <div className="text-center py-16 text-gray-600 dark:text-gray-400">
            <p className="text-lg mb-2">No projects yet</p>
            {isAdminUser && (
              <p className="text-sm">Click "Create New Project" to get started</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
