import { describe, it, expect, beforeEach, vi } from "vitest";

const createStorage = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    clear: () => {
      store = {};
    },
  };
};

describe("proximityAlerts", () => {
  beforeEach(() => {
    vi.resetModules();
    const storage = createStorage();
    vi.stubGlobal("localStorage", storage);
    vi.stubGlobal("window", { localStorage: storage });
  });

  it("defaults to false when no preference is stored", async () => {
    const { isProximityAlertsEnabled } = await import("../../src/utils/proximityAlerts");
    expect(isProximityAlertsEnabled()).toBe(false);
  });

  it("persists preference to localStorage", async () => {
    const { isProximityAlertsEnabled, setProximityAlertsEnabled } = await import(
      "../../src/utils/proximityAlerts"
    );
    setProximityAlertsEnabled(true);
    expect(window.localStorage.getItem("rememberme:proximity-alerts-enabled")).toBe("true");
    expect(isProximityAlertsEnabled()).toBe(true);
  });
});
