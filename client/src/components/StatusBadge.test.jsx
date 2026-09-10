import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import StatusBadge from "./StatusBadge";

describe("StatusBadge", () => {
  it("renders the correct label for a known status", () => {
    render(<StatusBadge status="in_progress" />);
    expect(screen.getByText("In Progress")).toBeInTheDocument();
  });

  it("renders the closed status added in Phase 13", () => {
    render(<StatusBadge status="closed" />);
    expect(screen.getByText("Closed")).toBeInTheDocument();
  });

  it("falls back to the raw status string for an unknown value instead of crashing", () => {
    render(<StatusBadge status="some_future_status" />);
    expect(screen.getByText("some_future_status")).toBeInTheDocument();
  });
});