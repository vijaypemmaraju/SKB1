import { GameObjects } from "phaser";
import { describe, expect, it, vi } from "vitest";
import goalSystem from "./goalSystem";
import World from "../World";
import {
  buildBaseEntity,
  buildGoalEntity,
  buildPushableBlockEntity,
} from "../builders";
import { createWorld, getAllEntities } from "bitecs";
import Position from "../components/Position";
import Velocity from "../components/Velocity";
import gameObjects from "../resources/gameObjects";
import Texture from "../components/Texture";
import Pushable from "../components/Pushable";
import useStore from "../useStore";

describe("goalSystem", () => {
  it("should move entities", () => {
    const world = createWorld<World>();
    world.time = { delta: 1, elapsed: 0, then: 0 };
    const gid = buildGoalEntity(24, 24, 24, world);
    const pid = buildPushableBlockEntity(24, 24, 24, world);
    goalSystem(world);
    expect(Position.x[pid]).toBe(24);
    expect(Position.y[pid]).toBe(24);
    expect(Position.z[pid]).toBe(24);
    expect(Position.x[gid]).toBe(24);
    expect(Position.y[gid]).toBe(24);
    expect(Position.z[gid]).toBe(24);
    expect(Texture.frame[pid]).toBe(7);
    // expect(Pushable[pid]).toBeUndefined();
    goalSystem(world);
    expect(useStore.getState().hasWon).toBe(true);
  });
});
