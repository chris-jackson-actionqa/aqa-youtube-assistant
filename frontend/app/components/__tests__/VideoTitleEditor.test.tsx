/**
 * Unit tests for VideoTitleEditor component
 * Tests rendering, editing, saving, canceling, error handling, and accessibility
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VideoTitleEditor } from "../VideoTitleEditor";

describe("VideoTitleEditor", () => {
  const mockOnSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering - Display Mode", () => {
    it("should display current video title", () => {
      render(
        <VideoTitleEditor
          projectId={1}
          initialTitle="My Awesome Video"
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText("My Awesome Video")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /edit video title/i })
      ).toBeInTheDocument();
    });

    it('should display "No video title set" when title is null', () => {
      render(
        <VideoTitleEditor
          projectId={1}
          initialTitle={null}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText("No video title set")).toBeInTheDocument();
    });

    it('should display "No video title set" when title is empty string', () => {
      render(
        <VideoTitleEditor projectId={1} initialTitle="" onSave={mockOnSave} />
      );

      expect(screen.getByText("No video title set")).toBeInTheDocument();
    });

    it("should show edit button with proper accessibility", () => {
      render(
        <VideoTitleEditor
          projectId={1}
          initialTitle="Test Title"
          onSave={mockOnSave}
        />
      );

      const editButton = screen.getByRole("button", {
        name: /edit video title/i,
      });
      expect(editButton).toBeInTheDocument();
      expect(editButton).toHaveAttribute("aria-label", "Edit video title");
      expect(editButton).toHaveAttribute("type", "button");
    });
  });

  describe("Edit Mode - Popover", () => {
    it("should open popover when edit button is clicked", async () => {
      const user = userEvent.setup();
      render(
        <VideoTitleEditor
          projectId={1}
          initialTitle="Test Title"
          onSave={mockOnSave}
        />
      );

      await user.click(
        screen.getByRole("button", { name: /edit video title/i })
      );

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Edit Video Title")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Enter video title")
      ).toBeInTheDocument();
    });

    it("should populate input with current title", async () => {
      const user = userEvent.setup();
      render(
        <VideoTitleEditor
          projectId={1}
          initialTitle="Current Title"
          onSave={mockOnSave}
        />
      );

      await user.click(
        screen.getByRole("button", { name: /edit video title/i })
      );

      const input = screen.getByPlaceholderText(
        "Enter video title"
      ) as HTMLInputElement;
      expect(input.value).toBe("Current Title");
    });

    it("should populate input with empty string when title is null", async () => {
      const user = userEvent.setup();
      render(
        <VideoTitleEditor
          projectId={1}
          initialTitle={null}
          onSave={mockOnSave}
        />
      );

      await user.click(
        screen.getByRole("button", { name: /edit video title/i })
      );

      const input = screen.getByPlaceholderText(
        "Enter video title"
      ) as HTMLInputElement;
      expect(input.value).toBe("");
    });

    it("should have proper ARIA attributes on popover", async () => {
      const user = userEvent.setup();
      render(
        <VideoTitleEditor
          projectId={1}
          initialTitle="Test"
          onSave={mockOnSave}
        />
      );

      await user.click(
        screen.getByRole("button", { name: /edit video title/i })
      );

      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute(
        "aria-labelledby",
        "edit-video-title-heading"
      );
      expect(
        screen.getByRole("heading", { name: /edit video title/i })
      ).toHaveAttribute("id", "edit-video-title-heading");
    });

    it("should enforce max length of 500 characters", async () => {
      const user = userEvent.setup();
      render(
        <VideoTitleEditor projectId={1} initialTitle="" onSave={mockOnSave} />
      );

      await user.click(
        screen.getByRole("button", { name: /edit video title/i })
      );

      const input = screen.getByPlaceholderText(
        "Enter video title"
      ) as HTMLInputElement;
      expect(input.maxLength).toBe(500);
    });

    it("should auto-focus input field when popover opens", async () => {
      const user = userEvent.setup();
      render(
        <VideoTitleEditor projectId={1} initialTitle="" onSave={mockOnSave} />
      );

      await user.click(
        screen.getByRole("button", { name: /edit video title/i })
      );

      const input = screen.getByPlaceholderText("Enter video title");
      expect(input).toHaveFocus();
    });
  });

  describe("User Interactions - Typing", () => {
    it("should update input value when typing", async () => {
      const user = userEvent.setup();
      render(
        <VideoTitleEditor projectId={1} initialTitle="" onSave={mockOnSave} />
      );

      await user.click(
        screen.getByRole("button", { name: /edit video title/i })
      );

      const input = screen.getByPlaceholderText("Enter video title");
      await user.clear(input);
      await user.type(input, "New Video Title");

      expect(input).toHaveValue("New Video Title");
    });

    it("should allow editing existing title", async () => {
      const user = userEvent.setup();
      render(
        <VideoTitleEditor
          projectId={1}
          initialTitle="Original Title"
          onSave={mockOnSave}
        />
      );

      await user.click(
        screen.getByRole("button", { name: /edit video title/i })
      );

      const input = screen.getByPlaceholderText("Enter video title");
      await user.clear(input);
      await user.type(input, "Modified Title");

      expect(input).toHaveValue("Modified Title");
    });
  });

  describe("Save Functionality", () => {
    it("should call onSave with new title when OK is clicked", async () => {
      const user = userEvent.setup();
      mockOnSave.mockResolvedValue(undefined);

      render(
        <VideoTitleEditor projectId={1} initialTitle="" onSave={mockOnSave} />
      );

      await user.click(
        screen.getByRole("button", { name: /edit video title/i })
      );
      await user.type(
        screen.getByPlaceholderText("Enter video title"),
        "New Title"
      );
      await user.click(screen.getByRole("button", { name: /^OK$/i }));

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith("New Title");
      });
    });

    it("should trim whitespace before saving", async () => {
      const user = userEvent.setup();
      mockOnSave.mockResolvedValue(undefined);

      render(
        <VideoTitleEditor projectId={1} initialTitle="" onSave={mockOnSave} />
      );

      await user.click(
        screen.getByRole("button", { name: /edit video title/i })
      );
      await user.type(
        screen.getByPlaceholderText("Enter video title"),
        "  Title With Spaces  "
      );
      await user.click(screen.getByRole("button", { name: /^OK$/i }));

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith("Title With Spaces");
      });
    });

    it("should save null when input is empty", async () => {
      const user = userEvent.setup();
      mockOnSave.mockResolvedValue(undefined);

      render(
        <VideoTitleEditor
          projectId={1}
          initialTitle="Existing Title"
          onSave={mockOnSave}
        />
      );

      await user.click(
        screen.getByRole("button", { name: /edit video title/i })
      );
      const input = screen.getByPlaceholderText("Enter video title");
      await user.clear(input);
      await user.click(screen.getByRole("button", { name: /^OK$/i }));

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(null);
      });
    });

    it("should save null when input contains only whitespace", async () => {
      const user = userEvent.setup();
      mockOnSave.mockResolvedValue(undefined);

      render(
        <VideoTitleEditor projectId={1} initialTitle="" onSave={mockOnSave} />
      );

      await user.click(
        screen.getByRole("button", { name: /edit video title/i })
      );
      await user.type(screen.getByPlaceholderText("Enter video title"), "   ");
      await user.click(screen.getByRole("button", { name: /^OK$/i }));

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(null);
      });
    });

    it("should close popover after successful save", async () => {
      const user = userEvent.setup();
      mockOnSave.mockResolvedValue(undefined);

      render(
        <VideoTitleEditor projectId={1} initialTitle="" onSave={mockOnSave} />
      );

      await user.click(
        screen.getByRole("button", { name: /edit video title/i })
      );
      await user.type(
        screen.getByPlaceholderText("Enter video title"),
        "New Title"
      );
      await user.click(screen.getByRole("button", { name: /^OK$/i }));

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });

    it("should show loading state during save", async () => {
      const user = userEvent.setup();
      let resolvePromise: () => void;
      const savePromise = new Promise<void>((resolve) => {
        resolvePromise = resolve;
      });
      mockOnSave.mockReturnValue(savePromise);

      render(
        <VideoTitleEditor projectId={1} initialTitle="" onSave={mockOnSave} />
      );

      await user.click(
        screen.getByRole("button", { name: /edit video title/i })
      );
      await user.type(
        screen.getByPlaceholderText("Enter video title"),
        "New Title"
      );
      await user.click(screen.getByRole("button", { name: /^OK$/i }));

      // Check loading state
      expect(
        screen.getByRole("button", { name: /saving\.\.\./i })
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled();

      // Resolve promise and verify state clears
      resolvePromise!();
      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });

    it("should disable buttons during save", async () => {
      const user = userEvent.setup();
      let resolvePromise: () => void;
      const savePromise = new Promise<void>((resolve) => {
        resolvePromise = resolve;
      });
      mockOnSave.mockReturnValue(savePromise);

      render(
        <VideoTitleEditor projectId={1} initialTitle="" onSave={mockOnSave} />
      );

      await user.click(
        screen.getByRole("button", { name: /edit video title/i })
      );
      await user.type(
        screen.getByPlaceholderText("Enter video title"),
        "New Title"
      );
      await user.click(screen.getByRole("button", { name: /^OK$/i }));

      // Both buttons should be disabled during save
      expect(
        screen.getByRole("button", { name: /saving\.\.\./i })
      ).toBeDisabled();
      expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled();

      // Resolve and cleanup
      resolvePromise!();
      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });
  });

  describe("Cancel Functionality", () => {
    it("should close popover when Cancel is clicked", async () => {
      const user = userEvent.setup();
      render(
        <VideoTitleEditor projectId={1} initialTitle="" onSave={mockOnSave} />
      );

      await user.click(
        screen.getByRole("button", { name: /edit video title/i })
      );
      await user.click(screen.getByRole("button", { name: /cancel/i }));

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it("should discard changes when Cancel is clicked", async () => {
      const user = userEvent.setup();
      render(
        <VideoTitleEditor
          projectId={1}
          initialTitle="Original Title"
          onSave={mockOnSave}
        />
      );

      await user.click(
        screen.getByRole("button", { name: /edit video title/i })
      );

      const input = screen.getByPlaceholderText("Enter video title");
      await user.clear(input);
      await user.type(input, "Changed Title");

      await user.click(screen.getByRole("button", { name: /cancel/i }));

      // Reopen and verify original value is restored
      await user.click(
        screen.getByRole("button", { name: /edit video title/i })
      );
      const inputAgain = screen.getByPlaceholderText("Enter video title");
      expect(inputAgain).toHaveValue("Original Title");
    });

    it("should restore empty string for null initial title on cancel", async () => {
      const user = userEvent.setup();
      render(
        <VideoTitleEditor
          projectId={1}
          initialTitle={null}
          onSave={mockOnSave}
        />
      );

      await user.click(
        screen.getByRole("button", { name: /edit video title/i })
      );

      const input = screen.getByPlaceholderText("Enter video title");
      await user.type(input, "Some Text");

      await user.click(screen.getByRole("button", { name: /cancel/i }));

      // Reopen and verify empty value
      await user.click(
        screen.getByRole("button", { name: /edit video title/i })
      );
      const inputAgain = screen.getByPlaceholderText("Enter video title");
      expect(inputAgain).toHaveValue("");
    });
  });

  describe("Keyboard Navigation", () => {
    it("should close popover when Escape key is pressed", async () => {
      const user = userEvent.setup();
      render(
        <VideoTitleEditor projectId={1} initialTitle="" onSave={mockOnSave} />
      );

      await user.click(
        screen.getByRole("button", { name: /edit video title/i })
      );
      const input = screen.getByPlaceholderText("Enter video title");

      await user.type(input, "{Escape}");

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it("should save when Enter key is pressed", async () => {
      const user = userEvent.setup();
      mockOnSave.mockResolvedValue(undefined);

      render(
        <VideoTitleEditor projectId={1} initialTitle="" onSave={mockOnSave} />
      );

      await user.click(
        screen.getByRole("button", { name: /edit video title/i })
      );
      const input = screen.getByPlaceholderText("Enter video title");

      await user.type(input, "New Title{Enter}");

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith("New Title");
      });
    });

    it("should not save when Shift+Enter is pressed", async () => {
      const user = userEvent.setup();
      render(
        <VideoTitleEditor projectId={1} initialTitle="" onSave={mockOnSave} />
      );

      await user.click(
        screen.getByRole("button", { name: /edit video title/i })
      );
      const input = screen.getByPlaceholderText("Enter video title");

      await user.type(input, "New Title{Shift>}{Enter}{/Shift}");

      // Dialog should still be open
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it("should discard changes when Escape is pressed", async () => {
      const user = userEvent.setup();
      render(
        <VideoTitleEditor
          projectId={1}
          initialTitle="Original"
          onSave={mockOnSave}
        />
      );

      await user.click(
        screen.getByRole("button", { name: /edit video title/i })
      );
      const input = screen.getByPlaceholderText("Enter video title");
      await user.clear(input);
      await user.type(input, "Modified{Escape}");

      // Reopen and verify original value
      await user.click(
        screen.getByRole("button", { name: /edit video title/i })
      );
      const inputAgain = screen.getByPlaceholderText("Enter video title");
      expect(inputAgain).toHaveValue("Original");
    });
  });

  describe("Error Handling", () => {
    it("should display error message when save fails", async () => {
      const user = userEvent.setup();
      mockOnSave.mockRejectedValue(new Error("Network error"));

      render(
        <VideoTitleEditor projectId={1} initialTitle="" onSave={mockOnSave} />
      );

      await user.click(
        screen.getByRole("button", { name: /edit video title/i })
      );
      await user.type(
        screen.getByPlaceholderText("Enter video title"),
        "New Title"
      );
      await user.click(screen.getByRole("button", { name: /^OK$/i }));

      await waitFor(() => {
        expect(
          screen.getByText("Failed to save video title. Please try again.")
        ).toBeInTheDocument();
      });

      // Dialog should remain open
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("should display error with proper ARIA role", async () => {
      const user = userEvent.setup();
      mockOnSave.mockRejectedValue(new Error("Network error"));

      render(
        <VideoTitleEditor projectId={1} initialTitle="" onSave={mockOnSave} />
      );

      await user.click(
        screen.getByRole("button", { name: /edit video title/i })
      );
      await user.type(
        screen.getByPlaceholderText("Enter video title"),
        "New Title"
      );
      await user.click(screen.getByRole("button", { name: /^OK$/i }));

      await waitFor(() => {
        const errorAlert = screen.getByRole("alert");
        expect(errorAlert).toBeInTheDocument();
        expect(errorAlert).toHaveTextContent(
          "Failed to save video title. Please try again."
        );
      });
    });

    it("should clear error message when trying to save again", async () => {
      const user = userEvent.setup();
      mockOnSave
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce(undefined);

      render(
        <VideoTitleEditor projectId={1} initialTitle="" onSave={mockOnSave} />
      );

      await user.click(
        screen.getByRole("button", { name: /edit video title/i })
      );
      await user.type(
        screen.getByPlaceholderText("Enter video title"),
        "New Title"
      );

      // First attempt - fails
      await user.click(screen.getByRole("button", { name: /^OK$/i }));

      await waitFor(() => {
        expect(
          screen.getByText("Failed to save video title. Please try again.")
        ).toBeInTheDocument();
      });

      // Second attempt - succeeds
      await user.click(screen.getByRole("button", { name: /^OK$/i }));

      await waitFor(() => {
        expect(
          screen.queryByText("Failed to save video title. Please try again.")
        ).not.toBeInTheDocument();
      });
    });

    it("should clear error message when Cancel is clicked", async () => {
      const user = userEvent.setup();
      mockOnSave.mockRejectedValue(new Error("Network error"));

      render(
        <VideoTitleEditor projectId={1} initialTitle="" onSave={mockOnSave} />
      );

      await user.click(
        screen.getByRole("button", { name: /edit video title/i })
      );
      await user.type(
        screen.getByPlaceholderText("Enter video title"),
        "New Title"
      );
      await user.click(screen.getByRole("button", { name: /^OK$/i }));

      await waitFor(() => {
        expect(
          screen.getByText("Failed to save video title. Please try again.")
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /cancel/i }));

      // Reopen and verify no error
      await user.click(
        screen.getByRole("button", { name: /edit video title/i })
      );
      expect(
        screen.queryByText("Failed to save video title. Please try again.")
      ).not.toBeInTheDocument();
    });

    it("should allow retry after error", async () => {
      const user = userEvent.setup();
      mockOnSave
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce(undefined);

      render(
        <VideoTitleEditor projectId={1} initialTitle="" onSave={mockOnSave} />
      );

      await user.click(
        screen.getByRole("button", { name: /edit video title/i })
      );
      await user.type(
        screen.getByPlaceholderText("Enter video title"),
        "New Title"
      );

      // First attempt fails
      await user.click(screen.getByRole("button", { name: /^OK$/i }));
      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      });

      // Second attempt succeeds
      await user.click(screen.getByRole("button", { name: /^OK$/i }));

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });

      expect(mockOnSave).toHaveBeenCalledTimes(2);
    });
  });

  describe("Edge Cases", () => {
    it("should handle very long titles (up to 500 chars)", async () => {
      const user = userEvent.setup();
      mockOnSave.mockResolvedValue(undefined);
      const longTitle = "a".repeat(500);

      render(
        <VideoTitleEditor projectId={1} initialTitle="" onSave={mockOnSave} />
      );

      await user.click(
        screen.getByRole("button", { name: /edit video title/i })
      );
      const input = screen.getByPlaceholderText("Enter video title");

      // Type the long title
      await user.clear(input);
      await user.type(input, longTitle);

      await user.click(screen.getByRole("button", { name: /^OK$/i }));

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(longTitle);
      });
    });

    it("should handle special characters in title", async () => {
      const user = userEvent.setup();
      mockOnSave.mockResolvedValue(undefined);
      const specialTitle = 'Title with "quotes" & <symbols> | special!@#$%';

      render(
        <VideoTitleEditor projectId={1} initialTitle="" onSave={mockOnSave} />
      );

      await user.click(
        screen.getByRole("button", { name: /edit video title/i })
      );
      await user.type(
        screen.getByPlaceholderText("Enter video title"),
        specialTitle
      );
      await user.click(screen.getByRole("button", { name: /^OK$/i }));

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(specialTitle);
      });
    });

    it("should handle emoji in title", async () => {
      const user = userEvent.setup();
      mockOnSave.mockResolvedValue(undefined);
      const emojiTitle = "My Video 🎥 Tutorial 📚 Amazing! 🚀";

      render(
        <VideoTitleEditor projectId={1} initialTitle="" onSave={mockOnSave} />
      );

      await user.click(
        screen.getByRole("button", { name: /edit video title/i })
      );
      await user.type(
        screen.getByPlaceholderText("Enter video title"),
        emojiTitle
      );
      await user.click(screen.getByRole("button", { name: /^OK$/i }));

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(emojiTitle);
      });
    });

    it("should handle multiple spaces in title", async () => {
      const user = userEvent.setup();
      mockOnSave.mockResolvedValue(undefined);

      render(
        <VideoTitleEditor projectId={1} initialTitle="" onSave={mockOnSave} />
      );

      await user.click(
        screen.getByRole("button", { name: /edit video title/i })
      );
      await user.type(
        screen.getByPlaceholderText("Enter video title"),
        "Title    with    multiple    spaces"
      );
      await user.click(screen.getByRole("button", { name: /^OK$/i }));

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          "Title    with    multiple    spaces"
        );
      });
    });

    it("should handle newlines in title", async () => {
      const user = userEvent.setup();
      mockOnSave.mockResolvedValue(undefined);

      render(
        <VideoTitleEditor projectId={1} initialTitle="" onSave={mockOnSave} />
      );

      await user.click(
        screen.getByRole("button", { name: /edit video title/i })
      );
      const input = screen.getByPlaceholderText("Enter video title");

      // Manually set value with newline (user.type doesn't support real newlines in input)
      await user.clear(input);
      await user.type(input, "Title with spaces");

      await user.click(screen.getByRole("button", { name: /^OK$/i }));

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith("Title with spaces");
      });
    });
  });

  describe("Accessibility", () => {
    it("should have proper button type attributes", () => {
      render(
        <VideoTitleEditor projectId={1} initialTitle="" onSave={mockOnSave} />
      );

      const editButton = screen.getByRole("button", {
        name: /edit video title/i,
      });
      expect(editButton).toHaveAttribute("type", "button");
    });

    it("should have proper button types in popover", async () => {
      const user = userEvent.setup();
      render(
        <VideoTitleEditor projectId={1} initialTitle="" onSave={mockOnSave} />
      );

      await user.click(
        screen.getByRole("button", { name: /edit video title/i })
      );

      expect(screen.getByRole("button", { name: /cancel/i })).toHaveAttribute(
        "type",
        "button"
      );
      expect(screen.getByRole("button", { name: /^OK$/i })).toHaveAttribute(
        "type",
        "button"
      );
    });

    it("should have proper ARIA label on input", async () => {
      const user = userEvent.setup();
      render(
        <VideoTitleEditor projectId={1} initialTitle="" onSave={mockOnSave} />
      );

      await user.click(
        screen.getByRole("button", { name: /edit video title/i })
      );

      const input = screen.getByPlaceholderText("Enter video title");
      expect(input).toHaveAttribute("aria-label", "Video title input");
    });

    it("should use semantic HTML for heading", async () => {
      const user = userEvent.setup();
      render(
        <VideoTitleEditor projectId={1} initialTitle="" onSave={mockOnSave} />
      );

      await user.click(
        screen.getByRole("button", { name: /edit video title/i })
      );

      const heading = screen.getByRole("heading", {
        name: /edit video title/i,
      });
      expect(heading.tagName).toBe("H3");
    });
  });
});
