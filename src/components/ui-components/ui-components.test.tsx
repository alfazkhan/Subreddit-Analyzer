import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ChakraUIProvider } from "./ChakraPrimitives";
import DataPagination from "./Data Table/DataPagination";
import {
  LoadingAndError,
  PortalAlert,
  ProgressBar,
  QueryStateView,
  StatusBadge,
} from "./Feedback";
import {
  CheckboxField,
  DateSelector,
  FilterChipRow,
} from "./FormControls";
import { Header } from "./Layout";
import { PasswordInput } from "../ui/password-input";

function renderWithChakra(ui: React.ReactNode) {
  return render(<ChakraUIProvider>{ui}</ChakraUIProvider>);
}

describe("shared UI components", () => {
  it("renders the highlighted page heading", () => {
    renderWithChakra(<Header text="Subreddit Analyzer" highlight="Analyzer" />);

    expect(screen.getByRole("heading", { name: "Subreddit Analyzer" })).toBeVisible();
  });

  it("reports loading and error states", () => {
    const error = Object.assign(new Error("Backend unavailable"), { status: 503 });
    const { rerender, container } = renderWithChakra(
      <LoadingAndError isLoading={false} isError error={error} />,
    );

    expect(screen.getByText("Error 503")).toBeVisible();
    expect(screen.getByText("Backend unavailable")).toBeVisible();

    rerender(
      <ChakraUIProvider>
        <LoadingAndError isLoading isError={false} error={null} />
      </ChakraUIProvider>,
    );
    expect(container.firstElementChild).toBeInTheDocument();
  });

  it("updates both dates when a preset is selected", () => {
    const onChange = vi.fn();
    const { container } = renderWithChakra(
      <DateSelector start="2026-01-01" end="2026-01-31" onChange={onChange} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Last 7 days" }));

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange.mock.calls[0][0]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(onChange.mock.calls[0][1]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(container.querySelectorAll('input[type="date"]')).toHaveLength(2);
  });

  it("shows progress text and percentage", () => {
    renderWithChakra(<ProgressBar value={42} processingStatus="Scraping posts" />);

    expect(screen.getByText("Scraping posts")).toBeVisible();
    expect(screen.getByText("42%")).toBeVisible();
  });

  it("toggles password visibility", () => {
    const { container } = renderWithChakra(<PasswordInput aria-label="Password" />);
    const input = container.querySelector("input");
    const toggle = screen.getByRole("button", { name: "Toggle password visibility" });

    expect(input).toHaveAttribute("type", "password");
    fireEvent.pointerDown(toggle, { button: 0 });
    expect(input).toHaveAttribute("type", "text");
  });

  it("renders StatusBadge, FilterChipRow, CheckboxField, QueryStateView, PortalAlert, and DataPagination", () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();

    renderWithChakra(
      <>
        <div id="test-alert-portal" />
        <StatusBadge active={false} trueLabel="Active" falseLabel="Not Active" />
        <FilterChipRow
          title="Filter Posts By"
          options={[
            { value: "All", label: "All" },
            { value: "Positive", label: "Positive", emoji: "😊" },
          ]}
          selectedValue="All"
          onSelect={onSelect}
        />
        <CheckboxField checked>Keywords</CheckboxField>
        <QueryStateView
          isLoading
          loadingText="Downloading KPI..."
          progress={55}
        >
          <div>Loaded content</div>
        </QueryStateView>
        <PortalAlert
          open
          status="success"
          title="Saved!"
          description="User created"
          onClose={onClose}
          portalTargetId="test-alert-portal"
        />
        <DataPagination
          totalItems={5}
          currentPage={1}
          pageSize={10}
          onPageChange={vi.fn()}
          hideWhenSinglePage={false}
        />
      </>,
    );

    expect(screen.getByText("Not Active")).toBeVisible();
    fireEvent.click(screen.getByText("Positive"));
    expect(onSelect).toHaveBeenCalledWith("Positive");
    expect(screen.getByText("Keywords")).toBeVisible();
    expect(screen.getByText("Downloading KPI... 55%")).toBeVisible();
    expect(screen.getByText("Saved!")).toBeVisible();
    expect(screen.getByText("User created")).toBeVisible();
    expect(screen.getByRole("button", { name: "page 1" })).toBeVisible();
  });
});