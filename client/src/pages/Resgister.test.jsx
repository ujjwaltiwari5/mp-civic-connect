import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Register from "./Register";
import { AuthProvider } from "../context/AuthContext";
import api from "../services/api";

vi.mock("../services/api", () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));

function renderRegister() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Register />
      </AuthProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  api.get.mockRejectedValue({ response: { status: 401 } });
});

describe("Register page (smoke test)", () => {
  it("renders name/email/phone/password fields", () => {
    const { container } = renderRegister();
    expect(container.querySelector('input[name="name"]')).toBeInTheDocument();
    expect(container.querySelector('input[name="email"]')).toBeInTheDocument();
    expect(container.querySelector('input[name="phone"]')).toBeInTheDocument();
    expect(container.querySelector('input[name="password"]')).toBeInTheDocument();
  });

  it("does not submit when required fields are empty (native HTML5 validation)", async () => {
    renderRegister();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /^register$/i }));
    expect(api.post).not.toHaveBeenCalled();
  });

  it("registers successfully with valid input", async () => {
    api.post.mockResolvedValueOnce({
      data: { success: true, data: { id: "2", name: "Neha Sharma", email: "neha@test.com", role: "citizen" } },
    });
    const user = userEvent.setup();
    const { container } = renderRegister();

    await user.type(container.querySelector('input[name="name"]'), "Neha Sharma");
    await user.type(container.querySelector('input[name="email"]'), "neha@test.com");
    await user.type(container.querySelector('input[name="password"]'), "password123");
    await user.click(screen.getByRole("button", { name: /^register$/i }));

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith("/auth/register", {
        name: "Neha Sharma",
        email: "neha@test.com",
        password: "password123",
        phone: "",
      })
    );
  });
});