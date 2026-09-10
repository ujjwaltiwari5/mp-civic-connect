import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Login from "./Login";
import { AuthProvider } from "../context/AuthContext";
import api from "../services/api";

// Login.jsx doesn't call the API directly — it goes through AuthContext's
// login(), which uses services/api.js. Mocking that one module covers both.
vi.mock("../services/api", () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));

function renderLogin() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Login />
      </AuthProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  // AuthProvider probes GET /auth/me on mount to check for an existing
  // session — treat it as "not logged in yet" for these tests.
  api.get.mockRejectedValue({ response: { status: 401 } });
});

// NOTE: Login.jsx's <label> elements aren't wired to their <input>s via
// htmlFor/id (or nesting), so getByLabelText can't find them — that's a real,
// minor accessibility gap worth a small follow-up fix, not something these
// tests should paper over by touching the page. Querying by `name` instead.
describe("Login page (critical flow: login)", () => {
  it("renders the email/password form", () => {
    const { container } = renderLogin();
    expect(container.querySelector('input[name="email"]')).toBeInTheDocument();
    expect(container.querySelector('input[name="password"]')).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
  });

  it("submits the entered credentials to the login API", async () => {
    api.post.mockResolvedValueOnce({
      data: { success: true, data: { id: "1", name: "Asha", email: "asha@test.com", role: "citizen" } },
    });
    const user = userEvent.setup();
    const { container } = renderLogin();

    await user.type(container.querySelector('input[name="email"]'), "asha@test.com");
    await user.type(container.querySelector('input[name="password"]'), "password123");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith("/auth/login", { email: "asha@test.com", password: "password123" })
    );
  });

  it("shows the server's error message on a failed login", async () => {
    api.post.mockRejectedValueOnce({ response: { data: { message: "Invalid email or password" } } });
    const user = userEvent.setup();
    const { container } = renderLogin();

    await user.type(container.querySelector('input[name="email"]'), "asha@test.com");
    await user.type(container.querySelector('input[name="password"]'), "wrongpass");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(await screen.findByText("Invalid email or password")).toBeInTheDocument();
  });
});