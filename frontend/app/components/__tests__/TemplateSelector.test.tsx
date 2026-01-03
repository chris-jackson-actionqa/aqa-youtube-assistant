import { render, screen, waitFor } from "@testing-library/react";
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
});
