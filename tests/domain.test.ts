import { describe, expect, it } from "vitest";
import { evaluateCondition } from "../src/domain/conditions.js";
import { applyHiddenDefaults, firstUnsupported, missingRequired, visibleComponents } from "../src/domain/form-engine.js";
import { memoryEnabled } from "../src/domain/state.js";
import { resolveMandatoryProducts } from "../src/domain/products.js";
import { reminderTimes, renderSlot } from "../src/domain/time.js";
import { validateForSubmission } from "../src/domain/validation.js";
import { newBookingState } from "../src/domain/state.js";
import type { BookingForm } from "../src/domain/types.js";
import { DateTime } from "luxon";

describe("condition operators", () => {
  const values = { name: "Ada", tags: ["a", "b"], enabled: true, empty: "" };
  it.each([
    [{ field: "name", operator: "ISDEFINED" as const }, true],
    [{ field: "tags", operator: "INCLUDES" as const, value: "b" }, true],
    [{ field: "name", operator: "EQUAL" as const, value: "Ada" }, true],
    [{ field: "tags", operator: "INTERSECTS" as const, value: ["x", "a"] }, true],
    [{ field: "enabled", operator: "ISTRUE" as const }, true],
    [{ field: "empty", operator: "ISDEFINED" as const }, false]
  ])("evaluates %o", (condition, expected) => expect(evaluateCondition(condition, values)).toBe(expected));
});

describe("form engine", () => {
  const form: BookingForm = {
    slug: "test",
    components: [{
      id: "group", type: "summary", _groups: [[
        { id: "hidden", type: "hidden", name: "newsletter", hidden: true, defaultValue: false },
        { id: "contact", type: "contactDetails", name: "contact", required: true },
        { id: "ship", type: "shippingDetails", name: "shipping", conditions: [{ field: "hardCopy", operator: "ISTRUE" }] }
      ]]
    }]
  };
  it("resolves nested groups and hidden defaults", () => {
    expect(applyHiddenDefaults(form, {})).toEqual({ newsletter: false });
    expect(visibleComponents(form, {}).map((x) => x.id)).toEqual(["group", "contact"]);
    expect(missingRequired(form, {}).map((x) => x.id)).toEqual(["contact"]);
  });
  it("detects unsupported visible components", () => {
    const bad = { ...form, components: [{ id: "x", type: "futureWidget" }] };
    expect(firstUnsupported(bad, {})?.id).toBe("x");
  });
});

it("adds transitive mandatory products", () => {
  expect(resolveMandatoryProducts(["a"], [
    { id: "a", name: "A", requiredProducts: ["b"] },
    { id: "b", name: "B", requiredProducts: ["c"] },
    { id: "c", name: "C" }
  ])).toEqual(["a", "b", "c"]);
});

it("enables memory after three successful submissions", () => {
  expect(memoryEnabled(2)).toBe(false);
  expect(memoryEnabled(3)).toBe(true);
});

it("renders user and Vienna time", () => {
  expect(renderSlot("2026-06-08T10:00:00Z", "America/New_York")).toContain("(Vienna)");
});

it("skips reminders in the past", () => {
  const now = DateTime.fromISO("2026-06-07T12:00:00Z") as DateTime<true>;
  expect(reminderTimes("2026-06-08T11:00:00Z", now)).toHaveLength(1);
});

it("requires explicit product, terms, and final confirmation", () => {
  expect(validateForSubmission(newBookingState())).toHaveLength(4);
});
