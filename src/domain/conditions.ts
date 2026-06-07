import type { Condition } from "./types.js";

const defined = (value: unknown) => value !== undefined && value !== null && value !== "";

export function evaluateCondition(condition: Condition, values: Record<string, unknown>): boolean {
  const actual = values[condition.field];
  switch (condition.operator) {
    case "ISDEFINED":
      return defined(actual);
    case "ISTRUE":
      return actual === true;
    case "EQUAL":
      return actual === condition.value;
    case "INCLUDES":
      return Array.isArray(actual)
        ? actual.includes(condition.value)
        : typeof actual === "string" && typeof condition.value === "string" && actual.includes(condition.value);
    case "INTERSECTS": {
      if (!Array.isArray(actual) || !Array.isArray(condition.value)) return false;
      const expected = condition.value as unknown[];
      return actual.some((item) => expected.includes(item));
    }
  }
}

export const conditionsMatch = (conditions: Condition[] | undefined, values: Record<string, unknown>) =>
  !conditions?.length || conditions.every((condition) => evaluateCondition(condition, values));
