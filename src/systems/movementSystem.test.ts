import { describe, expect, it } from "vitest";
import movementSystem from "./movementSystem";
import World from "../World";
import { buildBaseEntity } from "../builders";
import { createWorld, getAllEntities } from "bitecs";
import Position from "../components/Position";
import Velocity from "../components/Velocity";

describe("movementSystem", () => {
  it("should move entities", () => {
    const world = createWorld<World>();
    world.time = { delta: 1, elapsed: 0, then: 0 };
    const eid = buildBaseEntity(0, 0, 0, 0, world);
    Velocity.x[eid] = 1;
    Velocity.y[eid] = 1;
    const updatedWorld = movementSystem(world);
    getAllEntities(world);
    expect(Position.x[0]).toBe(1);
    expect(Position.y[0]).toBe(1);
    expect(Position.z[0]).toBe(0);
  });
});
