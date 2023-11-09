import { GameObjects } from "phaser";
import { describe, expect, it, vi } from "vitest";
import gameObjectRenderingSystem from "./gameObjectRenderingSystem";
import World from "../World";
import { buildBaseEntity } from "../builders";
import { createWorld, getAllEntities } from "bitecs";
import Position from "../components/Position";
import Velocity from "../components/Velocity";
import gameObjects from "../resources/gameObjects";

describe("gameObjectRenderingSystem", () => {
  it("should move entities", () => {
    const world = createWorld<World>();
    world.time = { delta: 1, elapsed: 0, then: 0 };
    const eid = buildBaseEntity(24, 24, 24, 13, world);
    gameObjects.set(eid, {
      x: 0,
      y: 0,
      depth: 0,
      rotation: 0,
      scaleX: 0,
      scaleY: 0,
      setFrame: vi.fn(),
    } as unknown as GameObjects.Sprite);
    gameObjectRenderingSystem(world);
    const sprite = gameObjects.get(eid) as GameObjects.Sprite;
    expect(sprite?.x).toBe(384);
    expect(sprite?.y).toBe(384);
    expect(sprite?.depth).toBe(24);
    expect(sprite?.rotation).toBe(0);
    expect(sprite?.scaleX).toBe(1);
    expect(sprite?.scaleY).toBe(1);
    expect(sprite?.setFrame).toBeCalledWith(13);
  });
});
