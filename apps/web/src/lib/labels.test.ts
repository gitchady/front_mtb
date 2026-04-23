import { describe, expect, it } from "vitest";
import { formatEventKind, formatRewardKind, formatRewardType, formatRiskFlag } from "@/lib/labels";

describe("labels", () => {
  it("uses non-monetary wording for reward and event labels", () => {
    expect(formatRewardType("social_ring_reward")).not.toMatch(/кэшбэк|выплат|лимит|денеж|операц/i);
    expect(formatRewardType("quest_cashback")).not.toMatch(/кэшбэк/i);
    expect(formatRewardKind("cashback")).not.toMatch(/кэшбэк/i);
    expect(formatRewardKind("limit_boost")).not.toMatch(/лимит/i);
    expect(formatEventKind("partner")).not.toMatch(/покупк|операц/i);
    expect(formatRiskFlag("large_amount")).not.toMatch(/операц/i);
  });
});
