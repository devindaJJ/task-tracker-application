import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { server } from "./server";

// jsdom has no real network stack; MSW intercepts fetch/XHR (and therefore
// axios) at that layer for every test.
beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// The app opens a real WebSocket for live updates (see useTaskSocket). jsdom
// doesn't implement WebSocket, and even if it did we don't want tests
// depending on a live socket server. Stub it out so components that use the
// hook don't crash -- we test the hook's cache-patching logic separately
// with a fake socket, not a real connection.
class MockWebSocket {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  close = vi.fn();
  url: string;
  constructor(url: string) {
    this.url = url;
  }
}

vi.stubGlobal("WebSocket", MockWebSocket);
