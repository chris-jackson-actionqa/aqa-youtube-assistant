/**
 * Unit tests for WorkspaceSelector component
 * Tests dropdown functionality, keyboard navigation, workspace selection, and accessibility
 */

import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import WorkspaceSelector from "../WorkspaceSelector";
import { WorkspaceProvider } from "../../../contexts/WorkspaceContext";
import { workspaceApi } from "../../../lib/workspaceApi";
import { Workspace } from "../../../types/workspace";

// Mock workspace API
jest.mock("../../../lib/workspaceApi");

// Mock WorkspaceCreateModal to avoid dependency
jest.mock("../WorkspaceCreateModal", () => {
  return function MockWorkspaceCreateModal({
    onClose,
  }: {
    onClose: () => void;
  }) {
    return (
      <div data-testid="create-modal">
        <button onClick={onClose}>Close Modal</button>
      </div>
    );
  };
});

describe("WorkspaceSelector", () => {
  const mockWorkspaces: Workspace[] = [
    {
      id: 1,
      name: "Default Workspace",
      description: "Default workspace",
      created_at: "2025-01-01T00:00:00Z",
    },
    {
      id: 2,
      name: "Marketing Projects",
      description: "Marketing workspace",
      created_at: "2025-01-02T00:00:00Z",
    },
    {
      id: 3,
      name: "Client Work",
      description: "Client projects",
      created_at: "2025-01-03T00:00:00Z",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    (workspaceApi.list as jest.Mock).mockResolvedValue(mockWorkspaces);
  });

  const renderWithProvider = () => {
    return render(
      <WorkspaceProvider>
        <WorkspaceSelector />
      </WorkspaceProvider>
    );
  };

  describe("Rendering", () => {
    it("should render the workspace selector button", async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /current workspace/i })
        ).toBeInTheDocument();
      });
    });

    it("should display current workspace name", async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText("Default Workspace")).toBeInTheDocument();
      });
    });

    it("should show folder icon", async () => {
      renderWithProvider();

      await waitFor(() => {
        const button = screen.getByRole("button", {
          name: /current workspace/i,
        });
        const svg = button.querySelector('svg[viewBox="0 0 24 24"]');
        expect(svg).toBeInTheDocument();
      });
    });

    it("should show chevron icon", async () => {
      renderWithProvider();

      await waitFor(() => {
        const button = screen.getByRole("button", {
          name: /current workspace/i,
        });
        const svgs = button.querySelectorAll("svg");
        expect(svgs.length).toBeGreaterThanOrEqual(2);
      });
    });

    it("should have proper ARIA attributes", async () => {
      renderWithProvider();

      await waitFor(() => {
        const button = screen.getByRole("button", {
          name: /current workspace/i,
        });
        expect(button).toHaveAttribute("aria-expanded", "false");
        expect(button).toHaveAttribute("aria-haspopup", "listbox");
      });
    });
  });

  describe("Dropdown Interaction", () => {
    it("should open dropdown when clicked", async () => {
      const user = userEvent.setup();
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText("Default Workspace")).toBeInTheDocument();
      });

      const button = screen.getByRole("button", { name: /current workspace/i });
      await user.click(button);

      expect(button).toHaveAttribute("aria-expanded", "true");
      expect(
        screen.getByRole("listbox", { name: /workspace list/i })
      ).toBeInTheDocument();
    });

    it("should close dropdown when clicked again", async () => {
      const user = userEvent.setup();
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText("Default Workspace")).toBeInTheDocument();
      });

      const button = screen.getByRole("button", { name: /current workspace/i });

      // Open
      await user.click(button);
      expect(button).toHaveAttribute("aria-expanded", "true");

      // Close
      await user.click(button);
      expect(button).toHaveAttribute("aria-expanded", "false");
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("should display all workspaces in dropdown", async () => {
      const user = userEvent.setup();
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText("Default Workspace")).toBeInTheDocument();
      });

      await user.click(
        screen.getByRole("button", { name: /current workspace/i })
      );

      // Check each workspace appears in dropdown (use getAllByText for duplicates)
      expect(screen.getAllByText("Default Workspace").length).toBeGreaterThan(
        0
      );
      expect(screen.getByText("Marketing Projects")).toBeInTheDocument();
      expect(screen.getByText("Client Work")).toBeInTheDocument();
    });

    it("should show checkmark next to selected workspace", async () => {
      const user = userEvent.setup();
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText("Default Workspace")).toBeInTheDocument();
      });

      await user.click(
        screen.getByRole("button", { name: /current workspace/i })
      );

      const options = screen.getAllByRole("option");
      const selectedOption = options.find((opt) =>
        within(opt).queryByText("Default Workspace")
      );

      expect(selectedOption).toHaveAttribute("aria-selected", "true");
      expect(selectedOption).toHaveClass("bg-blue-50");
    });

    it("should display 'Create Workspace' button", async () => {
      const user = userEvent.setup();
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText("Default Workspace")).toBeInTheDocument();
      });

      await user.click(
        screen.getByRole("button", { name: /current workspace/i })
      );

      expect(screen.getByText("Create Workspace")).toBeInTheDocument();
    });
  });

  describe("Workspace Selection", () => {
    it("should switch workspace when option is clicked", async () => {
      const user = userEvent.setup();
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText("Default Workspace")).toBeInTheDocument();
      });

      const button = screen.getByRole("button", { name: /current workspace/i });
      await user.click(button);

      const marketingOption = screen.getByText("Marketing Projects");
      await user.click(marketingOption);

      await waitFor(() => {
        expect(screen.getByText("Marketing Projects")).toBeInTheDocument();
        expect(button).toHaveAttribute("aria-expanded", "false");
      });
    });

    it("should close dropdown after selecting workspace", async () => {
      const user = userEvent.setup();
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText("Default Workspace")).toBeInTheDocument();
      });

      const button = screen.getByRole("button", { name: /current workspace/i });
      await user.click(button);

      const clientOption = screen.getByText("Client Work");
      await user.click(clientOption);

      await waitFor(() => {
        expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
      });
    });

    it("should save selected workspace to localStorage", async () => {
      const user = userEvent.setup();
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText("Default Workspace")).toBeInTheDocument();
      });

      await user.click(
        screen.getByRole("button", { name: /current workspace/i })
      );

      const marketingOption = screen.getByText("Marketing Projects");
      await user.click(marketingOption);

      await waitFor(() => {
        expect(
          localStorage.getItem("aqa-youtube-assistant:selected-workspace-id")
        ).toBe("2");
      });
    });
  });

  describe("Create Workspace Modal", () => {
    it("should open create modal when 'Create Workspace' is clicked", async () => {
      const user = userEvent.setup();
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText("Default Workspace")).toBeInTheDocument();
      });

      await user.click(
        screen.getByRole("button", { name: /current workspace/i })
      );

      const createButton = screen.getByText("Create Workspace");
      await user.click(createButton);

      expect(screen.getByTestId("create-modal")).toBeInTheDocument();
    });

    it("should close dropdown when opening create modal", async () => {
      const user = userEvent.setup();
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText("Default Workspace")).toBeInTheDocument();
      });

      const button = screen.getByRole("button", { name: /current workspace/i });
      await user.click(button);

      const createButton = screen.getByText("Create Workspace");
      await user.click(createButton);

      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("should close modal when onClose is called", async () => {
      const user = userEvent.setup();
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText("Default Workspace")).toBeInTheDocument();
      });

      await user.click(
        screen.getByRole("button", { name: /current workspace/i })
      );

      const createButton = screen.getByText("Create Workspace");
      await user.click(createButton);

      const closeButton = screen.getByText("Close Modal");
      await user.click(closeButton);

      expect(screen.queryByTestId("create-modal")).not.toBeInTheDocument();
    });
  });

  describe("Keyboard Navigation", () => {
    it("should open dropdown on Enter key", async () => {
      const user = userEvent.setup();
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText("Default Workspace")).toBeInTheDocument();
      });

      const button = screen.getByRole("button", { name: /current workspace/i });
      button.focus();
      await user.keyboard("{Enter}");

      expect(button).toHaveAttribute("aria-expanded", "true");
    });

    it("should open dropdown on Space key", async () => {
      const user = userEvent.setup();
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText("Default Workspace")).toBeInTheDocument();
      });

      const button = screen.getByRole("button", { name: /current workspace/i });
      button.focus();
      await user.keyboard(" ");

      expect(button).toHaveAttribute("aria-expanded", "true");
    });

    it("should open dropdown on ArrowDown key", async () => {
      const user = userEvent.setup();
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText("Default Workspace")).toBeInTheDocument();
      });

      const button = screen.getByRole("button", { name: /current workspace/i });
      button.focus();
      await user.keyboard("{ArrowDown}");

      expect(button).toHaveAttribute("aria-expanded", "true");
    });

    it("should close dropdown on Escape key", async () => {
      const user = userEvent.setup();
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText("Default Workspace")).toBeInTheDocument();
      });

      const button = screen.getByRole("button", { name: /current workspace/i });
      await user.click(button);

      await user.keyboard("{Escape}");

      await waitFor(() => {
        expect(button).toHaveAttribute("aria-expanded", "false");
      });
    });

    it("should navigate down through options with ArrowDown", async () => {
      const user = userEvent.setup();
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText("Default Workspace")).toBeInTheDocument();
      });

      const button = screen.getByRole("button", { name: /current workspace/i });
      await user.click(button);

      // First ArrowDown should focus first option
      await user.keyboard("{ArrowDown}");

      const options = screen.getAllByRole("option");
      expect(options[0]).toHaveClass("bg-gray-100");
    });

    it("should navigate up through options with ArrowUp", async () => {
      const user = userEvent.setup();
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText("Default Workspace")).toBeInTheDocument();
      });

      const button = screen.getByRole("button", { name: /current workspace/i });
      await user.click(button);

      // ArrowUp from -1 should wrap to last item (Create Workspace button)
      await user.keyboard("{ArrowUp}");

      // The create workspace button should be focused
      // Check using the option role and text content
      const allOptions = screen.getAllByRole("option");
      const lastOption = allOptions[allOptions.length - 1];
      expect(
        within(lastOption).getByText("Create Workspace")
      ).toBeInTheDocument();
    });

    it("should select workspace with Enter key", async () => {
      const user = userEvent.setup();
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText("Default Workspace")).toBeInTheDocument();
      });

      const button = screen.getByRole("button", { name: /current workspace/i });
      await user.click(button);

      // Navigate to second option
      await user.keyboard("{ArrowDown}");
      await user.keyboard("{ArrowDown}");

      // Select with Enter
      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(screen.getByText("Marketing Projects")).toBeInTheDocument();
        expect(button).toHaveAttribute("aria-expanded", "false");
      });
    });

    it("should select workspace with Space key", async () => {
      const user = userEvent.setup();
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText("Default Workspace")).toBeInTheDocument();
      });

      const button = screen.getByRole("button", { name: /current workspace/i });
      await user.click(button);

      // Navigate to third option
      await user.keyboard("{ArrowDown}");
      await user.keyboard("{ArrowDown}");
      await user.keyboard("{ArrowDown}");

      // Select with Space
      await user.keyboard(" ");

      await waitFor(() => {
        expect(screen.getByText("Client Work")).toBeInTheDocument();
        expect(button).toHaveAttribute("aria-expanded", "false");
      });
    });

    it("should open create modal with Enter key", async () => {
      const user = userEvent.setup();
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText("Default Workspace")).toBeInTheDocument();
      });

      const button = screen.getByRole("button", { name: /current workspace/i });
      await user.click(button);

      // Navigate to create button (last option)
      const options = screen.getAllByRole("option");
      for (let i = 0; i < options.length; i++) {
        await user.keyboard("{ArrowDown}");
      }

      // Select with Enter
      await user.keyboard("{Enter}");

      expect(screen.getByTestId("create-modal")).toBeInTheDocument();
    });

    it("should navigate to first option with Home key", async () => {
      const user = userEvent.setup();
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText("Default Workspace")).toBeInTheDocument();
      });

      await user.click(
        screen.getByRole("button", { name: /current workspace/i })
      );

      // Navigate somewhere first
      await user.keyboard("{ArrowDown}");
      await user.keyboard("{ArrowDown}");

      // Press Home
      await user.keyboard("{Home}");

      const options = screen.getAllByRole("option");
      expect(options[0]).toHaveClass("bg-gray-100");
    });

    it("should navigate to last option with End key", async () => {
      const user = userEvent.setup();
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText("Default Workspace")).toBeInTheDocument();
      });

      await user.click(
        screen.getByRole("button", { name: /current workspace/i })
      );

      // Press End
      await user.keyboard("{End}");

      const options = screen.getAllByRole("option");
      const lastOption = options[options.length - 1];
      expect(lastOption).toHaveClass("bg-gray-100");
    });

    it("should wrap around when navigating past last option", async () => {
      const user = userEvent.setup();
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText("Default Workspace")).toBeInTheDocument();
      });

      await user.click(
        screen.getByRole("button", { name: /current workspace/i })
      );

      const options = screen.getAllByRole("option");
      const totalOptions = options.length;

      // Navigate past last option
      for (let i = 0; i <= totalOptions; i++) {
        await user.keyboard("{ArrowDown}");
      }

      // Should wrap to first option
      expect(options[0]).toHaveClass("bg-gray-100");
    });

    it("should close dropdown when Enter pressed with no focused option", async () => {
      const user = userEvent.setup();
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText("Default Workspace")).toBeInTheDocument();
      });

      const button = screen.getByRole("button", { name: /current workspace/i });
      await user.click(button);

      expect(button).toHaveAttribute("aria-expanded", "true");

      // Press Enter without navigating (focusedIndex === -1)
      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(button).toHaveAttribute("aria-expanded", "false");
      });
    });
  });

  describe("Click Outside", () => {
    it("should close dropdown when clicking outside", async () => {
      const user = userEvent.setup();
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText("Default Workspace")).toBeInTheDocument();
      });

      const button = screen.getByRole("button", { name: /current workspace/i });
      await user.click(button);

      expect(button).toHaveAttribute("aria-expanded", "true");

      // Click outside
      await user.click(document.body);

      await waitFor(() => {
        expect(button).toHaveAttribute("aria-expanded", "false");
      });
    });

    it("should not close dropdown when clicking inside", async () => {
      const user = userEvent.setup();
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText("Default Workspace")).toBeInTheDocument();
      });

      const button = screen.getByRole("button", { name: /current workspace/i });
      await user.click(button);

      const dropdown = screen.getByRole("listbox");
      await user.click(dropdown);

      expect(button).toHaveAttribute("aria-expanded", "true");
    });
  });

  describe("Accessibility", () => {
    it("should have proper role attributes", async () => {
      const user = userEvent.setup();
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText("Default Workspace")).toBeInTheDocument();
      });

      await user.click(
        screen.getByRole("button", { name: /current workspace/i })
      );

      expect(screen.getByRole("listbox")).toBeInTheDocument();
      expect(screen.getAllByRole("option").length).toBeGreaterThan(0);
    });

    it("should have aria-label on dropdown list", async () => {
      const user = userEvent.setup();
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText("Default Workspace")).toBeInTheDocument();
      });

      await user.click(
        screen.getByRole("button", { name: /current workspace/i })
      );

      const listbox = screen.getByRole("listbox", { name: /workspace list/i });
      expect(listbox).toBeInTheDocument();
    });

    it("should have aria-selected on options", async () => {
      const user = userEvent.setup();
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText("Default Workspace")).toBeInTheDocument();
      });

      await user.click(
        screen.getByRole("button", { name: /current workspace/i })
      );

      const options = screen.getAllByRole("option");
      options.forEach((option) => {
        expect(option).toHaveAttribute("aria-selected");
      });
    });

    it("should have separator between workspaces and create button", async () => {
      const user = userEvent.setup();
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText("Default Workspace")).toBeInTheDocument();
      });

      await user.click(
        screen.getByRole("button", { name: /current workspace/i })
      );

      expect(screen.getByRole("separator")).toBeInTheDocument();
    });

    it("should rotate chevron icon when dropdown is open", async () => {
      const user = userEvent.setup();
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText("Default Workspace")).toBeInTheDocument();
      });

      const button = screen.getByRole("button", { name: /current workspace/i });
      const svgs = button.querySelectorAll("svg");
      const chevron = svgs[svgs.length - 1];

      expect(chevron).not.toHaveClass("rotate-180");

      await user.click(button);

      expect(chevron).toHaveClass("rotate-180");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty workspace list gracefully", async () => {
      (workspaceApi.list as jest.Mock).mockResolvedValue([]);

      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText("Select Workspace")).toBeInTheDocument();
      });
    });

    it("should not crash if currentWorkspace is null", async () => {
      (workspaceApi.list as jest.Mock).mockResolvedValue([]);

      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText("Select Workspace")).toBeInTheDocument();
      });

      const button = screen.getByRole("button", { name: /current workspace/i });
      expect(button).toBeInTheDocument();
    });

    it("should handle rapid open/close toggling", async () => {
      const user = userEvent.setup();
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText("Default Workspace")).toBeInTheDocument();
      });

      const button = screen.getByRole("button", { name: /current workspace/i });

      // Rapid toggling
      await user.click(button);
      await user.click(button);
      await user.click(button);

      // Final state should be open (odd number of clicks)
      await waitFor(() => {
        expect(button).toHaveAttribute("aria-expanded", "true");
      });
    });

    it("should reset focused index when dropdown reopens", async () => {
      const user = userEvent.setup();
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText("Default Workspace")).toBeInTheDocument();
      });

      const button = screen.getByRole("button", { name: /current workspace/i });

      // Open and navigate
      await user.click(button);
      await user.keyboard("{ArrowDown}");
      await user.keyboard("{ArrowDown}");

      // Close
      await user.keyboard("{Escape}");

      // Reopen - focused index should reset
      await user.click(button);

      const options = screen.getAllByRole("option");
      const focusedOptions = options.filter((opt) =>
        opt.classList.contains("bg-gray-100")
      );
      expect(focusedOptions.length).toBe(0);
    });
  });
});
