"use client";

import { useEffect, useState } from "react";

interface VideoTitleEditorProps {
  initialTitle: string | null;
  onSave: (newTitle: string | null) => Promise<void>;
}

/**
 * VideoTitleEditor Component
 *
 * Provides inline editing for video titles with a popover interface.
 * Displays current video title or "No video title set" placeholder.
 * Opens an editing popover when the pencil icon is clicked.
 *
 * Features:
 * - Display mode with edit button
 * - Popover edit mode with input field
 * - Save/Cancel actions
 * - Loading states during save
 * - Error handling with user feedback
 * - Full accessibility support (ARIA labels, keyboard navigation)
 * - Max length validation (500 characters)
 *
 * @example
 * <VideoTitleEditor
 *   initialTitle="My Video Title"
 *   onSave={async (title) => { await updateProject(1, { video_title: title }); }}
 * />
 */
export function VideoTitleEditor({
  initialTitle,
  onSave,
}: VideoTitleEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialTitle || "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync internal value state when initialTitle prop changes
  useEffect(() => {
    setValue(initialTitle || "");
  }, [initialTitle]);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      await onSave(value.trim() || null);
      setIsEditing(false);
    } catch {
      setError("Failed to save video title. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setValue(initialTitle || "");
    setError(null);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleCancel();
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div className="relative">
      {/* Display Mode */}
      {!isEditing && (
        <div className="flex items-center gap-3">
          <span
            className={
              initialTitle
                ? "text-gray-900 dark:text-gray-100"
                : "text-gray-500 dark:text-gray-400 italic"
            }
          >
            {initialTitle || "No video title set"}
          </span>
          <button
            onClick={() => setIsEditing(true)}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded transition-colors duration-200"
            aria-label="Edit video title"
            type="button"
          >
            ✏️
          </button>
        </div>
      )}

      {/* Edit Mode - Popover */}
      {isEditing && (
        <div
          className="absolute z-10 w-96 max-w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4"
          role="dialog"
          aria-labelledby="edit-video-title-heading"
        >
          <h3
            id="edit-video-title-heading"
            className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100"
          >
            Edit Video Title
          </h3>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded mb-3 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter video title"
            maxLength={500}
            autoFocus
            aria-label="Video title input"
          />

          {error && (
            <div
              role="alert"
              className="mb-3 text-sm text-red-600 dark:text-red-400"
            >
              {error}
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              type="button"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              type="button"
            >
              {isSaving ? "Saving..." : "OK"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
