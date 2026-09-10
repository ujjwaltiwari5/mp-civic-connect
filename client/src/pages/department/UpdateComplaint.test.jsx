import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import UpdateComplaint from "./UpdateComplaint";
import { updateComplaintStatus } from "../../services/complaints";

vi.mock("../../services/complaints", () => ({ updateComplaintStatus: vi.fn() }));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/department/complaints/complaint123/update"]}>
      <Routes>
        <Route path="/department/complaints/:id/update" element={<UpdateComplaint />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("UpdateComplaint page (critical flow: status update)", () => {
  it("renders the status select (defaulting to in_progress) and the update button", () => {
    renderPage();
    expect(screen.getByRole("combobox")).toHaveValue("in_progress");
    expect(screen.getByRole("button", { name: /update status/i })).toBeInTheDocument();
  });

  it("submits the selected status and note against the complaint id from the route", async () => {
    updateComplaintStatus.mockResolvedValueOnce({ data: { success: true } });
    const user = userEvent.setup();
    renderPage();

    await user.selectOptions(screen.getByRole("combobox"), "resolved");
    await user.type(screen.getByPlaceholderText(/what was done/i), "Fixed the streetlight");
    await user.click(screen.getByRole("button", { name: /update status/i }));

    await waitFor(() => expect(updateComplaintStatus).toHaveBeenCalledTimes(1));
    const [id, formData] = updateComplaintStatus.mock.calls[0];
    expect(id).toBe("complaint123");
    expect(formData.get("status")).toBe("resolved");
    expect(formData.get("note")).toBe("Fixed the streetlight");
  });

  it("shows an error message if the update fails", async () => {
    updateComplaintStatus.mockRejectedValueOnce(new Error("network error"));
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: /update status/i }));

    expect(await screen.findByText("Update failed, please try again.")).toBeInTheDocument();
  });
});