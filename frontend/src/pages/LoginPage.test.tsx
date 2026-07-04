import { describe, expect, it, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/utils";
import { tokenStorage } from "../auth/tokenStorage";
import LoginPage from "./LoginPage";

describe("LoginPage", () => {
  afterEach(() => {
    tokenStorage.clear();
  });

  it("renders the login form", () => {
    renderWithProviders(<LoginPage />, { route: "/login" });

    expect(screen.getByRole("heading", { name: /log in/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("logs in successfully and stores tokens", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />, { route: "/login" });

    await user.type(screen.getByLabelText(/email/i), "alice@example.com");
    await user.type(screen.getByLabelText(/password/i), "SecurePass123");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => {
      expect(tokenStorage.getAccessToken()).toBe("mock-access-token");
    });
  });

  it("shows an error message on invalid credentials", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />, { route: "/login" });

    await user.type(screen.getByLabelText(/email/i), "alice@example.com");
    await user.type(screen.getByLabelText(/password/i), "wrongpassword");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(await screen.findByText(/incorrect email or password/i)).toBeInTheDocument();
    expect(tokenStorage.getAccessToken()).toBeNull();
  });
});
