import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@capacitor/local-notifications", () => ({
  LocalNotifications: {
    schedule: vi.fn(),
    cancel: vi.fn(),
    requestPermissions: vi.fn(async () => ({ display: "granted" })),
  },
}));

vi.mock("@capacitor/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@capacitor/core")>();
  return {
    ...actual,
    Capacitor: {
      ...actual.Capacitor,
      isNativePlatform: () => true,
      getPlatform: () => "ios",
    },
  };
});

vi.mock("../../src/utils/analytics", () => ({
  trackEvent: vi.fn(async () => {}),
}));

import { LocalNotifications } from "@capacitor/local-notifications";
import {
  __resetProximityTestState,
  __buildVenuesToMonitorForTests,
  __setVenuesSnapshotForTests,
  scheduleNotification,
} from "../../src/utils/proximityService";
import type { MonitoredVenue } from "../../src/utils/proximityService";

const makeVenue = (id: string) =>
  ({
    id,
    name: `Venue ${id}`,
    favorite: false,
    proximityMeta: { totalPeople: 0, favoriteNames: [] },
  }) as MonitoredVenue;

describe("proximityService scheduleNotification", () => {
  beforeEach(() => {
    __resetProximityTestState();
    vi.clearAllMocks();
  });

  it("does not schedule if venue is missing", async () => {
    __setVenuesSnapshotForTests([makeVenue("v1")]);
    await scheduleNotification("missing");
    expect(LocalNotifications.schedule).not.toHaveBeenCalled();
  });

  it("respects the per-venue cooldown window", async () => {
    __setVenuesSnapshotForTests([makeVenue("v1")]);
    await scheduleNotification("v1");
    await scheduleNotification("v1");

    expect(LocalNotifications.schedule).toHaveBeenCalledTimes(1);
  });

  it("uses a stable notification id per venue", async () => {
    const { getProximityNotificationId } = await import("../../src/utils/proximityService");
    expect(getProximityNotificationId("v1")).toBe(getProximityNotificationId("v1"));
    expect(getProximityNotificationId("v1")).not.toBe(getProximityNotificationId("v2"));
  });
});

describe("proximityService venue filtering", () => {
  it("filters venues without coords or disabled toggles", () => {
    const venues: MonitoredVenue[] = [
      {
        id: "v1",
        name: "Has coords",
        coords: { lat: 1, lon: 2 },
        favorite: false,
      },
      {
        id: "v2",
        name: "Disabled",
        coords: { lat: 3, lon: 4 },
        favorite: false,
        proximityAlertsEnabled: false,
      },
      {
        id: "v3",
        name: "Missing coords",
        favorite: false,
      },
    ];

    const result = __buildVenuesToMonitorForTests(venues);
    expect(result.map((item) => item.id)).toEqual(["v1"]);
  });
});
