import { describe, expect, it } from "vitest";
import { api, getQrActionLabel } from "@/lib/api";

describe("api.buildEvent", () => {
  it("builds a typed risky transaction event", () => {
    const event = api.buildEvent("u_demo", "risky");

    expect(event.event_type).toBe("txn_posted");
    if (event.event_type !== "txn_posted") {
      throw new Error("Expected txn_posted event");
    }

    expect(event.user_id).toBe("u_demo");
    expect(event.amount).toBe(800);
    expect(event.device_mismatch).toBe(true);
    expect(event.multi_account_signal).toBe(true);
  });

  it("maps QR action kinds to user-facing labels", () => {
    expect(getQrActionLabel("add_friend")).toBe("Добавить в друзья");
    expect(getQrActionLabel("ask_assistant")).toBe("Спросить AI");
    expect(getQrActionLabel("none")).toBe("Без действия");
  });
});
