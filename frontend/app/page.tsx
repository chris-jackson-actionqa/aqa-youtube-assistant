'use client';

import { useEffect, useState } from 'react';
import ProjectForm from './components/ProjectForm';
import { getProjects, checkHealth } from './lib/api';
import { Project } from './types/project';

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<string>('checking...');
  const [showForm, setShowForm] = useState(false);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check API health
      const healthData = await checkHealth();
      setApiStatus(healthData.status || 'unknown');

      // Fetch projects
      const projectsData = await getProjects();
      setProjects(projectsData);
      setLoading(false);
    } catch (err) {
      setError('Failed to connect to backend API. Make sure the FastAPI server is running on port 8000.');
      setApiStatus('disconnected');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleFormSuccess = () => {
    setShowForm(false);
    fetchProjects(); // Refresh the project list
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'planned':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'archived':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="min-h-screen p-8 pb-20 gap-16 sm:p-20 font-sans bg-gray-50 dark:bg-gray-900">
      <main className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">YouTube Assistant</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Helper for planning and making YouTube videos for the ActionaQA channel
          </p>
        </div>

        {/* API Status */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm">
            <span className="font-semibold">Backend API Status:</span>{' '}
            <span className={apiStatus === 'healthy' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
              {apiStatus}
            </span>
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
            <p className="text-sm mt-2 text-gray-600 dark:text-gray-400">
              Start the backend with: <code className="bg-black/[.05] dark:bg-white/[.06] px-2 py-1 rounded font-mono text-xs">cd backend && uvicorn app.main:app --reload</code>
            </p>
          </div>
        )}

        {/* Project Form Toggle */}
        <div className="mb-6">
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg
                       transition-colors duration-200 shadow-sm hover:shadow-md"
            >
              + Create New Project
            </button>
          ) : (
            <ProjectForm 
              onSuccess={handleFormSuccess}
              onCancel={() => setShowForm(false)}
            />
          )}
        </div>

        {/* Projects Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Projects</h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {projects.length} {projects.length === 1 ? 'project' : 'projects'}
            </span>
          </div>

          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading projects...</p>
            </div>
          )}

          {!loading && !error && projects.length === 0 && (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400">No projects yet. Create your first project to get started!</p>
            </div>
          )}

          {!loading && !error && projects.length > 0 && (
            <div className="grid gap-4">
              {projects.map((project) => (
                <div 
                  key={project.id} 
                  className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
                           rounded-lg hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-semibold">{project.title}</h3>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusStyle(project.status)}`}>
                      {project.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  
                  {project.description && (
                    <p className="text-gray-600 dark:text-gray-400 mb-3">
                      {project.description}
                    </p>
                  )}
                  
                  <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>Created: {new Date(project.created_at).toLocaleDateString()}</span>
                    <span>Updated: {new Date(project.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
