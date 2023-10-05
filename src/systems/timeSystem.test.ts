import { describe, expect, it, vi } from "vitest";
import timeSystem from "./timeSystem";

vi.mock("../game", () => ({
  default: {
    getTime: () => 1,
    loop: {
      delta: 1000,
    },
  },
}));

describe("timeSystem", () => {
  it("should update the time", () => {
    const world = {
      time: {
        delta: 0,
        elapsed: 0,
        then: 0,
      },
    };
    const updatedWorld = timeSystem(world);
    expect(updatedWorld.time.delta).toBe(1);
    expect(updatedWorld.time.elapsed).toBe(1);
    expect(updatedWorld.time.then).toBe(1);
  });
});
