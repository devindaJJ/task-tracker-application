import { describe, expect, it, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/utils";
import { tokenStorage } from "../auth/tokenStorage";
import RegisterPage from "./RegisterPage";

describe("RegisterPage", () => {
  afterEach(() => {
    tokenStorage.clear();
  });

  it("rejects a password shorter than 8 characters before calling the API", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />, { route: "/register" });

    await user.type(screen.getByLabelText(/full name/i), "Alice Smith");
    await user.type(screen.getByLabelText(/email/i), "alice@example.com");
    await user.type(screen.getByLabelText(/password/i), "short");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument();
    expect(tokenStorage.getAccessToken()).toBeNull();
  });

  it("registers and logs in on valid input", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />, { route: "/register" });

    await user.type(screen.getByLabelText(/full name/i), "Alice Smith");
    await user.type(screen.getByLabelText(/email/i), "alice@example.com");
    await user.type(screen.getByLabelText(/password/i), "SecurePass123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(tokenStorage.getAccessToken()).toBe("mock-access-token");
    });
  });
});
