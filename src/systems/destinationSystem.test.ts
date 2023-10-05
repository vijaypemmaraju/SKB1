import { GameObjects } from "phaser";
import { describe, expect, it, vi } from "vitest";
import destinationSystem from "./destinationSystem";
import World from "../World";
import {
  buildBaseEntity,
  buildGoalEntity,
  buildPushableBlockEntity,
} from "../builders";
import { createWorld, getAllEntities } from "bitecs";
import Position from "../components/Position";
import Velocity from "../components/Velocity";
import sprites from "../resources/sprites";
import Texture from "../components/Texture";
import Pushable from "../components/Pushable";
import useStore from "../useStore";
import Destination from "../components/Destination";

describe("destinationSystem", () => {
  it("should move entities", () => {
    const world = createWorld<World>();
    world.time = { delta: 1, elapsed: 0, then: 0 };
    const eid = buildPushableBlockEntity(24, 24, 24, world);
    destinationSystem(world);
    Destination.x[eid] = 48;
    Destination.y[eid] = 48;
    destinationSystem(world);
    expect(Velocity.x[eid]).toBe(5.656854152679443);
    expect(Velocity.y[eid]).toBe(5.656854152679443);
  });
});
