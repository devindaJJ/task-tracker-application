import { describe, expect, it } from "vitest";
import axios, { AxiosError } from "axios";
import { getErrorMessage } from "./errors";

function makeAxiosError(status: number, data: unknown): AxiosError {
  const error = new AxiosError("Request failed");
  error.response = {
    status,
    data,
    statusText: "",
    headers: {},
    config: {} as never,
  };
  return error;
}

describe("getErrorMessage", () => {
  it("extracts a plain error message", () => {
    const error = makeAxiosError(409, { error: { code: 409, message: "Email already exists" } });
    expect(getErrorMessage(error)).toBe("Email already exists");
  });

  it("extracts the first validation detail with field name", () => {
    const error = makeAxiosError(422, {
      error: {
        code: 422,
        message: "Validation error",
        details: [{ loc: ["body", "password"], msg: "String should have at least 8 characters" }],
      },
    });
    expect(getErrorMessage(error)).toBe("password: String should have at least 8 characters");
  });

  it("returns a network error hint for connection failures", () => {
    const error = new AxiosError("Network Error");
    expect(getErrorMessage(error)).toMatch(/could not reach the server/i);
  });

  it("falls back to a generic message for non-axios errors", () => {
    expect(getErrorMessage(new Error("boom"))).toMatch(/something went wrong/i);
  });

  it("is a real AxiosError per axios.isAxiosError", () => {
    const error = makeAxiosError(500, {});
    expect(axios.isAxiosError(error)).toBe(true);
  });
});
