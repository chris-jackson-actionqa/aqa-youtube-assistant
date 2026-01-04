import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TemplateSelector } from "../TemplateSelector";
import { getTemplates } from "@/app/lib/api";

jest.mock("@/app/lib/api", () => ({
  getTemplates: jest.fn(),
}));

type Template =
  Awaited<ReturnType<typeof getTemplates>> extends Array<infer T> ? T : never;

const mockTemplates: Template[] = [
  {
    id: 1,
    type: "title",
    name: "Launch Title",
    content: "Launch your product with confidence",
    workspace_id: 1,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },
  {
    id: 2,
    type: "title",
    name: "Engagement Boost",
    content: "Unlock engagement with this format",
    workspace_id: 1,
    created_at: "2025-01-02T00:00:00Z",
    updated_at: "2025-01-02T00:00:00Z",
  },
];

describe("TemplateSelector", () => {
  const user = userEvent.setup();
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    jest.clearAllMocks();
    (getTemplates as jest.Mock).mockResolvedValue(mockTemplates);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  const renderComponent = (
    currentTitle: string | null = "Current Title",
    onApply: (title: string) => Promise<void> = jest
      .fn()
      .mockResolvedValue(undefined)
  ) => {
    render(<TemplateSelector currentTitle={currentTitle} onApply={onApply} />);
    return { onApply };
  };

  it("opens dropdown and loads templates", async () => {
    renderComponent();

    await user.click(screen.getByRole("button", { name: /apply template/i }));

    await waitFor(() => {
      expect(getTemplates).toHaveBeenCalledWith("title");
    });

    expect(
      screen.getByRole("menu", { name: /template list/i })
    ).toBeInTheDocument();
    expect(screen.getByText("Launch Title")).toBeInTheDocument();
    expect(screen.getByText("Engagement Boost")).toBeInTheDocument();
  });

  it("shows empty state when no templates exist", async () => {
    (getTemplates as jest.Mock).mockResolvedValueOnce([]);
    renderComponent();

    await user.click(screen.getByRole("button", { name: /apply template/i }));

    expect(await screen.findByText(/no templates available/i)).toBeVisible();
    expect(
      screen.getByRole("link", { name: /create your first template/i })
    ).toHaveAttribute("href", "/templates");
  });

  it("applies template directly when no current title", async () => {
    const { onApply } = renderComponent(null);

    await user.click(screen.getByRole("button", { name: /apply template/i }));
    await user.click(screen.getByRole("button", { name: /launch title/i }));

    await waitFor(() => {
      expect(onApply).toHaveBeenCalledWith(
        "Launch your product with confidence"
      );
    });

    expect(
      screen.queryByRole("menu", { name: /template list/i })
    ).not.toBeInTheDocument();
  });

  it("shows confirmation when current title exists", async () => {
    renderComponent("Existing Title");

    await user.click(screen.getByRole("button", { name: /apply template/i }));
    await user.click(screen.getByRole("button", { name: /launch title/i }));

    expect(
      await screen.findByRole("alertdialog", {
        name: /replace existing video title/i,
      })
    ).toBeInTheDocument();
    expect(screen.getByText(/existing title/i)).toBeInTheDocument();
  });

  it("replaces title after confirmation", async () => {
    const { onApply } = renderComponent("Existing Title");

    await user.click(screen.getByRole("button", { name: /apply template/i }));
    await user.click(screen.getByRole("button", { name: /launch title/i }));
    await user.click(screen.getByRole("button", { name: /replace/i }));

    await waitFor(() => {
      expect(onApply).toHaveBeenCalledWith(
        "Launch your product with confidence"
      );
    });

    expect(
      screen.queryByRole("alertdialog", {
        name: /replace existing video title/i,
      })
    ).not.toBeInTheDocument();
  });

  it("cancels confirmation and resets selection", async () => {
    renderComponent("Existing Title");

    await user.click(screen.getByRole("button", { name: /apply template/i }));
    await user.click(screen.getByRole("button", { name: /launch title/i }));

    await user.click(screen.getByRole("button", { name: /^cancel$/i }));

    expect(
      screen.queryByRole("alertdialog", {
        name: /replace existing video title/i,
      })
    ).not.toBeInTheDocument();
  });

  it("shows error when loading templates fails", async () => {
    (getTemplates as jest.Mock).mockRejectedValueOnce(new Error("fail"));
    renderComponent();

    await user.click(screen.getByRole("button", { name: /apply template/i }));

    expect(
      await screen.findByText(/unable to load templates/i)
    ).toBeInTheDocument();
  });

  it("keeps dropdown open and shows error if apply fails without confirmation", async () => {
    const onApply = jest.fn().mockRejectedValue(new Error("apply error"));
    renderComponent(null, onApply);

    await user.click(screen.getByRole("button", { name: /apply template/i }));
    await user.click(screen.getByRole("button", { name: /launch title/i }));

    await waitFor(() => {
      expect(onApply).toHaveBeenCalled();
    });

    expect(
      screen.getByRole("menu", { name: /template list/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/failed to apply template/i)).toBeInTheDocument();
  });

  it("closes dropdown with escape key", async () => {
    renderComponent();

    await user.click(screen.getByRole("button", { name: /apply template/i }));
    await user.keyboard("{Escape}");

    expect(
      screen.queryByRole("menu", { name: /template list/i })
    ).not.toBeInTheDocument();
  });

  it("closes dropdown with cancel button", async () => {
    renderComponent();

    await user.click(screen.getByRole("button", { name: /apply template/i }));
    await user.click(
      screen.getByRole("button", { name: /^cancel$/i, hidden: false })
    );

    expect(
      screen.queryByRole("menu", { name: /template list/i })
    ).not.toBeInTheDocument();
  });

  it("closes dropdown when clicking outside", async () => {
    renderComponent();

    await user.click(screen.getByRole("button", { name: /apply template/i }));
    await user.click(document.body);

    expect(
      screen.queryByRole("menu", { name: /template list/i })
    ).not.toBeInTheDocument();
  });

  it("clears error and confirmation when reopening dropdown", async () => {
    const mockGetTemplates = getTemplates as jest.Mock;
    mockGetTemplates.mockResolvedValue([mockTemplates[0]]);
    renderComponent("Existing Title");

    // Open dropdown and select template to show confirmation
    await user.click(screen.getByRole("button", { name: /apply template/i }));

    await waitFor(() => {
      expect(screen.getByText(mockTemplates[0].name)).toBeInTheDocument();
    });

    await user.click(screen.getByText(mockTemplates[0].name));

    // Confirmation should be showing
    await waitFor(() => {
      expect(
        screen.getByText(/replace existing video title/i)
      ).toBeInTheDocument();
    });

    // Close confirmation
    await user.click(screen.getByRole("button", { name: /^cancel$/i }));

    // Close and reopen dropdown - should clear previous state
    await user.click(screen.getByRole("button", { name: /apply template/i }));
    await user.click(screen.getByRole("button", { name: /apply template/i }));

    // Should not show confirmation
    expect(
      screen.queryByText(/replace existing video title/i)
    ).not.toBeInTheDocument();
  });

  it("prevents race condition from rapid confirmation clicks", async () => {
    const mockGetTemplates = getTemplates as jest.Mock;

    // Mock applyTemplate to simulate slow API call
    let resolveApply: () => void;
    const applyPromise = new Promise<void>((resolve) => {
      resolveApply = resolve;
    });
    const mockApplyTemplate = jest.fn().mockReturnValue(applyPromise);
    mockGetTemplates.mockResolvedValue([mockTemplates[0]]);

    render(
      <TemplateSelector
        currentTitle="Existing Title"
        onApply={mockApplyTemplate}
      />
    );

    const user = userEvent.setup();

    // Open dropdown and select template
    await user.click(screen.getByRole("button", { name: /apply template/i }));

    await waitFor(() => {
      expect(screen.getByText(mockTemplates[0].name)).toBeInTheDocument();
    });

    await user.click(screen.getByText(mockTemplates[0].name));

    // Wait for confirmation to appear
    await waitFor(() => {
      expect(
        screen.getByText(/replace existing video title/i)
      ).toBeInTheDocument();
    });

    // Click Replace multiple times rapidly
    const replaceButton = screen.getByRole("button", { name: /^replace$/i });
    await user.click(replaceButton);
    await user.click(replaceButton); // Second click should be ignored
    await user.click(replaceButton); // Third click should be ignored

    // applyTemplate should only be called once despite multiple clicks
    expect(mockApplyTemplate).toHaveBeenCalledTimes(1);

    // Resolve the promise to finish the test
    resolveApply!();

    await waitFor(() => {
      expect(
        screen.queryByText(/replace existing video title/i)
      ).not.toBeInTheDocument();
    });
  });

  it("implements focus trap in confirmation dialog", async () => {
    const mockGetTemplates = getTemplates as jest.Mock;
    mockGetTemplates.mockResolvedValue([mockTemplates[0]]);
    renderComponent("Existing Title");

    // Open dropdown and select template to show confirmation
    await user.click(screen.getByRole("button", { name: /apply template/i }));
    await waitFor(() => {
      expect(screen.getByText(mockTemplates[0].name)).toBeInTheDocument();
    });
    await user.click(screen.getByText(mockTemplates[0].name));

    // Confirmation dialog should be showing
    await waitFor(() => {
      expect(
        screen.getByText(/replace existing video title/i)
      ).toBeInTheDocument();
    });

    // Verify focus is on Replace button (initial focus)
    const replaceButton = screen.getByRole("button", { name: /^replace$/i });
    await waitFor(() => {
      expect(replaceButton).toHaveFocus();
    });
  });

  it("closes confirmation dialog on Escape key", async () => {
    const mockGetTemplates = getTemplates as jest.Mock;
    mockGetTemplates.mockResolvedValue([mockTemplates[0]]);
    renderComponent("Existing Title");

    // Open dropdown and select template to show confirmation
    await user.click(screen.getByRole("button", { name: /apply template/i }));
    await waitFor(() => {
      expect(screen.getByText(mockTemplates[0].name)).toBeInTheDocument();
    });
    await user.click(screen.getByText(mockTemplates[0].name));

    // Confirmation should be showing
    await waitFor(() => {
      expect(
        screen.getByText(/replace existing video title/i)
      ).toBeInTheDocument();
    });

    // Press Escape key to close confirmation
    await user.keyboard("{Escape}");

    // Confirmation should be closed
    await waitFor(() => {
      expect(
        screen.queryByText(/replace existing video title/i)
      ).not.toBeInTheDocument();
    });
  });

  it("uses template cache to reduce API calls", async () => {
    const mockGetTemplates = getTemplates as jest.Mock;
    mockGetTemplates.mockResolvedValue([mockTemplates[0]]);
    renderComponent();

    // Open dropdown - first API call
    await user.click(screen.getByRole("button", { name: /apply template/i }));
    await waitFor(() => {
      expect(screen.getByText(mockTemplates[0].name)).toBeInTheDocument();
    });
    expect(mockGetTemplates).toHaveBeenCalledTimes(1);

    // Close dropdown
    await user.click(screen.getByRole("button", { name: /^close$/i }));

    // Reopen dropdown - should use cache (no new API call)
    await user.click(screen.getByRole("button", { name: /apply template/i }));
    await waitFor(() => {
      expect(screen.getByText(mockTemplates[0].name)).toBeInTheDocument();
    });

    // API should still only have been called once (cached)
    expect(mockGetTemplates).toHaveBeenCalledTimes(1);
  });

  it("traps focus within confirmation dialog using Tab", async () => {
    const mockGetTemplates = getTemplates as jest.Mock;
    mockGetTemplates.mockResolvedValue([mockTemplates[0]]);
    renderComponent("Existing Title");

    // Open dropdown and select template to show confirmation
    await user.click(screen.getByRole("button", { name: /apply template/i }));
    await waitFor(() => {
      expect(screen.getByText(mockTemplates[0].name)).toBeInTheDocument();
    });
    await user.click(screen.getByText(mockTemplates[0].name));

    // Confirmation dialog should be showing
    await waitFor(() => {
      expect(
        screen.getByText(/replace existing video title/i)
      ).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole("button", { name: /^cancel$/i });
    const replaceButton = screen.getByRole("button", { name: /^replace$/i });

    // Wait for initial focus on Replace button
    await waitFor(() => {
      expect(replaceButton).toHaveFocus();
    });

    // Simulate Tab key from last element (Replace button)
    fireEvent.keyDown(document, { key: "Tab", code: "Tab" });
    // Focus should wrap back to first element
    expect(cancelButton).toHaveFocus();

    // Focus on Cancel button, then simulate Shift+Tab from first element
    cancelButton.focus();
    fireEvent.keyDown(document, { key: "Tab", code: "Tab", shiftKey: true });
    // Focus should wrap to last element
    expect(replaceButton).toHaveFocus();
  });
});
