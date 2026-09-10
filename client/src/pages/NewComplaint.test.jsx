import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import NewComplaint from "./NewComplaint";
import api from "../services/api";
import { createComplaint } from "../services/complaints";
import { getWards } from "../services/wards";

// The Leaflet map itself isn't the point of this smoke test — stub it out so
// jsdom (which can't do Leaflet's real canvas/DOM work) doesn't get in the way.
vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }) => <div data-testid="mock-map">{children}</div>,
  TileLayer: () => null,
  Marker: () => null,
  useMapEvents: () => null,
}));
vi.mock("../services/api", () => ({ default: { get: vi.fn() } }));
vi.mock("../services/complaints", () => ({ createComplaint: vi.fn() }));
vi.mock("../services/wards", () => ({ getWards: vi.fn() }));

const CATEGORY = { _id: "cat1", name: "Roads" };
const WARD = { _id: "ward1", name: "Ward 5" };

function renderPage() {
  return render(
    <MemoryRouter>
      <NewComplaint />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  api.get.mockResolvedValue({ data: { data: [CATEGORY] } });
  getWards.mockResolvedValue({ data: { data: [WARD] } });
});

describe("NewComplaint page (critical flow: submit complaint)", () => {
  it("renders the complaint form with categories and wards loaded from the API", async () => {
    const { container } = renderPage();
    expect(await screen.findByText("Roads")).toBeInTheDocument();
    expect(screen.getByText("Ward 5")).toBeInTheDocument();
    expect(container.querySelector("textarea")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /submit complaint/i })).toBeInTheDocument();
  });

  it("blocks submission and shows an error when no location has been picked on the map", async () => {
    const { container } = renderPage();
    await screen.findByText("Roads");
    const user = userEvent.setup();

    await user.type(container.querySelector('input[placeholder*="streetlight"]'), "Overflowing drain");
    await user.type(
      container.querySelector("textarea"),
      "Drain has been overflowing for two days near the market."
    );
    await user.selectOptions(screen.getByDisplayValue("Select category"), "cat1");
    await user.selectOptions(screen.getByDisplayValue("Select severity"), "high");
    await user.selectOptions(screen.getByDisplayValue("Select ward"), "ward1");
    await user.click(screen.getByRole("button", { name: /submit complaint/i }));

    expect(await screen.findByText("Please mark the location on map")).toBeInTheDocument();
    expect(createComplaint).not.toHaveBeenCalled();
  });
});