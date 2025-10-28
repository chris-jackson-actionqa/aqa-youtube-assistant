"use client";

import { useState } from "react";
import { ProjectProvider, useProject } from "./contexts/ProjectContext";
import ProjectForm from "./components/ProjectForm";
import ProjectList from "./components/ProjectList";
import { Project } from "./types/project";

/**
 * ProjectManagementPage - Main project management interface
 *
 * Integrates all project management components:
 * - ProjectForm for creating new projects
 * - ProjectList for viewing and selecting projects
 * - Current project indicator in header
 *
 * Related: Issue #15 - Integrate all project management components
 */
function ProjectManagementPage() {
  const { currentProject, clearSelection, selectProject } = useProject();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  /**
   * Handle successful project creation
   * Closes the form and triggers project list refresh
   */
  const handleProjectCreated = () => {
    setShowCreateForm(false);
    setRefreshTrigger((prev) => prev + 1);
  };

  /**
   * Handle project selection from ProjectList
   * Updates the global current project state via ProjectContext
   */
  const handleProjectSelect = (project: Project) => {
    selectProject(project.id);
  };

  /**
   * Handle project deletion notification from ProjectList
   * Called after a project is successfully deleted
   */
  const handleProjectDeleted = (projectId: number) => {
    // Clear selection if deleted project was selected
    if (currentProject?.id === projectId) {
      clearSelection();
    }

    // Refresh the list
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen p-8 pb-20 gap-16 sm:p-20 font-sans bg-gray-50 dark:bg-gray-900">
      <main className="max-w-6xl mx-auto">
        {/* Header with current project indicator */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-gray-900 dark:text-gray-100">
            YouTube Assistant
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
            Helper for planning and making YouTube videos for the ActionaQA
            channel
          </p>

          {/* Current project indicator */}
          {currentProject && (
            <div
              className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800 flex items-center justify-between"
              role="status"
              aria-label="Current project"
            >
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Working on:{" "}
                <strong className="text-blue-700 dark:text-blue-300">
                  {currentProject.name}
                </strong>
              </div>
              <button
                onClick={clearSelection}
                className="px-3 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 
                         text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700
                         transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Clear project selection"
              >
                Clear Selection
              </button>
            </div>
          )}
        </header>

        {/* Create Project Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
            Create New Project
          </h2>
          {showCreateForm ? (
            <ProjectForm
              onSuccess={handleProjectCreated}
              onCancel={() => setShowCreateForm(false)}
            />
          ) : (
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg
                       transition-colors duration-200 shadow-sm hover:shadow-md
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Create new project"
            >
              + Create New Project
            </button>
          )}
        </section>

        {/* Project List Section */}
        <section>
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
            Your Projects
          </h2>
          <ProjectList
            key={refreshTrigger}
            onProjectSelect={handleProjectSelect}
            onProjectDelete={handleProjectDeleted}
            selectedProjectId={currentProject?.id}
          />
        </section>
      </main>
    </div>
  );
}

/**
 * Home - Main application page wrapper
 *
 * Wraps the application in ProjectProvider to enable global project state
 *
 * Related: Issue #15
 */
export default function Home() {
  return (
    <ProjectProvider>
      <ProjectManagementPage />
    </ProjectProvider>
  );
}
