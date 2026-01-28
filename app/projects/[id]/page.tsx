'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { CATEGORIES, FileText, ArrowLeft } from '@/lib/projects';
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

export default function ProjectPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [fileCounts, setFileCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (projectId) {
      fetchProject();
      fetchFileCounts();
    }
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setProject(data);
      }
    } catch (error) {
      console.error('Failed to fetch project:', error);
    }
  };

  const fetchFileCounts = async () => {
    const counts: Record<string, number> = {};
    try {
      await Promise.all(
        CATEGORIES.map(async (category) => {
          try {
            const response = await fetch(
              `/api/projects/${projectId}/categories/${category.id}/files`
            );
            if (response.ok) {
              const files = await response.json();
              counts[category.id] = files.length;
            } else {
              counts[category.id] = 0;
            }
          } catch {
            counts[category.id] = 0;
          }
        })
      );
      setFileCounts(counts);
    } catch (error) {
      console.error('Failed to fetch file counts:', error);
    }
  };

  if (!project) {
    return (
      <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white flex items-center justify-center transition-colors">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  const getCategoryBgColor = (categoryId: string) => {
    const colorMap: Record<string, string> = {
      'graphical-data': 'bg-blue-100/50 dark:bg-muted-blue-light/30',
      'literature': 'bg-purple-100/50 dark:bg-muted-purple-light/30',
      'questionnaire-data': 'bg-green-100/50 dark:bg-muted-green-light/30',
      'other': 'bg-orange-100/50 dark:bg-muted-orange-light/30',
    };
    return colorMap[categoryId] || 'bg-gray-100/50 dark:bg-gray-700/30';
  };

  const getCategoryBorderColor = (categoryId: string) => {
    const colorMap: Record<string, string> = {
      'graphical-data': 'border-blue-200 dark:border-muted-blue',
      'literature': 'border-purple-200 dark:border-muted-purple',
      'questionnaire-data': 'border-green-200 dark:border-muted-green',
      'other': 'border-orange-200 dark:border-muted-orange',
    };
    return colorMap[categoryId] || 'border-gray-200 dark:border-gray-700';
  };

  const getIconColor = (categoryId: string) => {
    const colorMap: Record<string, string> = {
      'graphical-data': 'text-icon-blue',
      'literature': 'text-icon-purple',
      'questionnaire-data': 'text-icon-green',
      'other': 'text-icon-orange',
    };
    return colorMap[categoryId] || 'text-gray-400';
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#121212] text-gray-900 dark:text-white transition-all duration-300 ease-in-out">
      <div className="bg-white dark:bg-[#121212] border-b border-gray-200 dark:border-gray-800/50 transition-all duration-300 ease-in-out">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6">
          <div className="flex justify-between items-start mb-4">
            <button
              onClick={() => router.push('/')}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-2 transition-colors text-sm sm:text-base"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
            <ThemeToggle />
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-muted-blue rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-icon-blue" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white break-words">{project.name}</h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">References & Citations</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-12">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {CATEGORIES.map((category) => (
            <div
              key={category.id}
              onClick={() => router.push(`/projects/${projectId}/categories/${category.id}`)}
              className="bg-gray-50 dark:bg-[#1E1E1E] p-4 sm:p-6 md:p-8 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-[#252525] transition-colors border border-gray-200 dark:border-gray-800/30 flex flex-col items-center relative"
            >
              {fileCounts[category.id] !== undefined && (
                <div className="absolute top-2 right-2 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white text-xs font-semibold px-2 py-1 rounded-md">
                  {fileCounts[category.id]}
                </div>
              )}
              <div className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 ${getCategoryBgColor(category.id)} ${getCategoryBorderColor(category.id)} rounded-lg flex items-center justify-center mb-3 sm:mb-4 border-2`}>
                <category.icon className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 ${getIconColor(category.id)}`} />
              </div>
              <h3 className="text-sm sm:text-base md:text-lg font-medium text-center text-gray-900 dark:text-white break-words">{category.name}</h3>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
