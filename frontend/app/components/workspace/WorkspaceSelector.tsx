"use client";

/**
 * WorkspaceSelector - Dropdown component for selecting and managing workspaces
 *
 * Features:
 * - Displays current workspace name
 * - Dropdown list of all available workspaces
 * - Click to switch workspace
 * - "Create Workspace" action at bottom
 * - Full keyboard navigation (Tab, Enter, Escape, Arrow keys)
 * - ARIA labels and screen reader support
 * - Click outside to close
 * - Responsive design
 *
 * @example
 * <WorkspaceSelector />
 */

import { useState, useRef, useEffect } from "react";
import { useWorkspace } from "../../hooks/useWorkspace";
import WorkspaceCreateModal from "./WorkspaceCreateModal";

export default function WorkspaceSelector() {
  const { currentWorkspace, workspaces, selectWorkspace } = useWorkspace();
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  /**
   * Close dropdown when clicking outside
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  /**
   * Reset focused index when dropdown opens
   */
  useEffect(() => {
    if (isOpen) {
      setFocusedIndex(-1);
    }
  }, [isOpen]);

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    const totalItems = workspaces.length + 1; // +1 for create button

    switch (e.key) {
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        buttonRef.current?.focus();
        break;

      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((prev) => (prev + 1) % totalItems);
        break;

      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((prev) => (prev - 1 + totalItems) % totalItems);
        break;

      case "Enter":
      case " ":
        e.preventDefault();
        if (focusedIndex === -1) {
          setIsOpen(false);
        } else if (focusedIndex === workspaces.length) {
          // Create workspace button
          handleCreateClick();
        } else {
          // Select workspace
          handleWorkspaceSelect(workspaces[focusedIndex].id);
        }
        break;

      case "Home":
        e.preventDefault();
        setFocusedIndex(0);
        break;

      case "End":
        e.preventDefault();
        setFocusedIndex(totalItems - 1);
        break;
    }
  };

  /**
   * Handle workspace selection
   */
  const handleWorkspaceSelect = (workspaceId: number) => {
    selectWorkspace(workspaceId);
    setIsOpen(false);
    buttonRef.current?.focus();
  };

  /**
   * Handle create workspace click
   */
  const handleCreateClick = () => {
    setShowCreateModal(true);
    setIsOpen(false);
  };

  /**
   * Handle create modal close
   */
  const handleCreateModalClose = () => {
    setShowCreateModal(false);
    buttonRef.current?.focus();
  };

  return (
    <>
      <div className="relative" data-testid="workspace-selector">
        {/* Dropdown Button */}
        <button
          ref={buttonRef}
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-label={`Current workspace: ${currentWorkspace?.name || "Select Workspace"}`}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg 
                   hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {/* Folder Icon */}
          <svg
            className="w-5 h-5 text-gray-500 dark:text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>

          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {currentWorkspace?.name || "Select Workspace"}
          </span>

          {/* Chevron Icon */}
          <svg
            className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div
            ref={dropdownRef}
            role="listbox"
            aria-label="Workspace list"
            className="absolute top-full mt-2 right-0 w-64 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50"
            onKeyDown={handleKeyDown}
          >
            {/* Workspace List */}
            {workspaces.map((workspace, index) => {
              const isSelected = workspace.id === currentWorkspace?.id;
              const isFocused = index === focusedIndex;

              return (
                <button
                  key={workspace.id}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleWorkspaceSelect(workspace.id)}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors duration-150
                    ${isFocused ? "bg-gray-100 dark:bg-gray-700" : ""}
                    ${isSelected ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" : "text-gray-900 dark:text-gray-100"}
                    hover:bg-gray-100 dark:hover:bg-gray-700
                    focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700
                    first:rounded-t-lg`}
                >
                  <div className="flex items-center gap-2">
                    {/* Check Icon for selected workspace */}
                    {isSelected && (
                      <svg
                        className="w-4 h-4 text-blue-600 dark:text-blue-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    {!isSelected && <span className="w-4" aria-hidden="true" />}
                    <span className="flex-1">{workspace.name}</span>
                  </div>
                </button>
              );
            })}

            {/* Divider */}
            <div
              className="border-t border-gray-200 dark:border-gray-700"
              role="separator"
            />

            {/* Create Workspace Button */}
            <button
              role="option"
              aria-selected={false}
              onClick={handleCreateClick}
              className={`w-full text-left px-4 py-2 text-sm text-blue-600 dark:text-blue-400 transition-colors duration-150
                ${focusedIndex === workspaces.length ? "bg-gray-100 dark:bg-gray-700" : ""}
                hover:bg-gray-100 dark:hover:bg-gray-700
                focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700
                rounded-b-lg`}
            >
              <div className="flex items-center gap-2">
                {/* Plus Icon */}
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span className="font-medium">Create Workspace</span>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Create Workspace Modal */}
      {showCreateModal && (
        <WorkspaceCreateModal onClose={handleCreateModalClose} />
      )}
    </>
  );
}
