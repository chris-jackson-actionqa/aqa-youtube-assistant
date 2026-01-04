"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getTemplates } from "@/app/lib/api";
import { Template } from "@/app/types/template";
import { TemplateDropdown } from "./TemplateDropdown";
import { TemplateConfirmDialog } from "./TemplateConfirmDialog";

interface TemplateSelectorProps {
  currentTitle: string | null;
  onApply: (templateContent: string) => Promise<void>;
}

/**
 * TemplateSelector Component
 *
 * Orchestrator component that manages state and coordinates between
 * TemplateDropdown and TemplateConfirmDialog sub-components.
 *
 * Responsibilities:
 * - Manage overall state (isOpen, showConfirm, selectedTemplate)
 * - Coordinate between sub-components
 * - Handle click-outside and keyboard events
 * - Load and cache templates
 * - Apply templates via the onApply callback
 *
 * Z-index Strategy (coordinated with VideoTitleEditor):
 * - Dropdown menu: z-20
 * - Confirmation dialog: z-30
 * - VideoTitleEditor dialog: z-40 (always appears above TemplateSelector)
 */
export function TemplateSelector({
  currentTitle,
  onApply,
}: TemplateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  );
  const [showConfirm, setShowConfirm] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  // Template caching: store last fetch time and cached templates to reduce API calls
  const cacheRef = useRef<{ templates: Template[]; timestamp: number } | null>(
    null
  );
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

  const hasExistingTitle =
    currentTitle !== null && currentTitle.trim().length > 0;

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const loadTemplates = async () => {
      // Check cache before making API call
      const now = Date.now();
      if (cacheRef.current && now - cacheRef.current.timestamp < CACHE_TTL) {
        setTemplates(cacheRef.current.templates);
        return; // Use cached data
      }

      setLoading(true);
      setError(null);

      try {
        const data = await getTemplates("title");
        if (isMounted) {
          setTemplates(data);
          // Update cache with fresh data
          cacheRef.current = { templates: data, timestamp: now };
        }
      } catch (err) {
        console.error("Failed to load templates:", err);
        if (isMounted) {
          setTemplates([]);
          setError("Unable to load templates. Please try again.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadTemplates();

    return () => {
      isMounted = false;
    };
  }, [isOpen, CACHE_TTL]);

  const closeAll = useCallback(() => {
    setIsOpen(false);
    setShowConfirm(false);
    setSelectedTemplate(null);
    setIsApplying(false);
    setError(null); // Clear error state when closing to avoid stale error messages
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        closeAll();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeAll();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, closeAll]);

  // Focus management for confirmation dialog (accessibility improvement)
  useEffect(() => {
    if (!showConfirm) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleCancelConfirm();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showConfirm]);

  const toggleDropdown = () => {
    if (isOpen) {
      closeAll();
    } else {
      setError(null);
      setShowConfirm(false);
      setSelectedTemplate(null);
      setIsOpen(true);
    }
  };

  const handleTemplateSelect = async (template: Template) => {
    setSelectedTemplate(template);

    if (hasExistingTitle) {
      setIsOpen(false);
      setShowConfirm(true);
    } else {
      await applyTemplate(template);
    }
  };

  const applyTemplate = async (template: Template) => {
    setIsApplying(true);
    setError(null);

    try {
      await onApply(template.content);
      closeAll();
    } catch (err) {
      console.error("Failed to apply template:", err);
      setError("Failed to apply template. Please try again.");
      setShowConfirm(hasExistingTitle);
      if (!hasExistingTitle) {
        setIsOpen(true);
      }
    } finally {
      setIsApplying(false);
    }
  };

  const handleConfirmApply = async () => {
    // Prevent multiple concurrent apply operations from rapid "Replace" clicks
    // selectedTemplate is guaranteed to be non-null when this handler is called
    // because the confirmation dialog only appears after selecting a template
    if (!isApplying) {
      await applyTemplate(selectedTemplate!);
    }
  };

  const handleCancelConfirm = () => {
    setShowConfirm(false);
    setSelectedTemplate(null);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={toggleDropdown}
        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded transition-colors duration-200"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Apply template"
        title="Apply template"
      >
        <span aria-hidden="true" className="mr-1">
          📋
        </span>
        <span className="sr-only">Apply template</span>
      </button>

      {isOpen && (
        <TemplateDropdown
          templates={templates}
          loading={loading}
          error={error}
          isApplying={isApplying}
          onTemplateSelect={handleTemplateSelect}
          onClose={closeAll}
        />
      )}

      {showConfirm && selectedTemplate && (
        <TemplateConfirmDialog
          selectedTemplate={selectedTemplate}
          currentTitle={currentTitle}
          isApplying={isApplying}
          error={error}
          onConfirm={handleConfirmApply}
          onCancel={handleCancelConfirm}
        />
      )}
    </div>
  );
}
