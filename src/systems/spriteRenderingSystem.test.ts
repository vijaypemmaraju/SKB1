import { GameObjects } from "phaser";
import { describe, expect, it, vi } from "vitest";
import spriteRenderingSystem from "./spriteRenderingSystem";
import World from "../World";
import { buildBaseEntity } from "../builders";
import { createWorld, getAllEntities } from "bitecs";
import Position from "../components/Position";
import Velocity from "../components/Velocity";
import sprites from "../resources/sprites";

describe("spriteRenderingSystem", () => {
  it("should move entities", () => {
    const world = createWorld<World>();
    world.time = { delta: 1, elapsed: 0, then: 0 };
    const eid = buildBaseEntity(24, 24, 24, 13, world);
    sprites.set(eid, {
      x: 0,
      y: 0,
      depth: 0,
      rotation: 0,
      scaleX: 0,
      scaleY: 0,
      setFrame: vi.fn(),
    } as unknown as GameObjects.Sprite);
    spriteRenderingSystem(world);
    expect(sprites.get(eid)?.x).toBe(384);
    expect(sprites.get(eid)?.y).toBe(384);
    expect(sprites.get(eid)?.depth).toBe(24);
    expect(sprites.get(eid)?.rotation).toBe(0);
    expect(sprites.get(eid)?.scaleX).toBe(1);
    expect(sprites.get(eid)?.scaleY).toBe(1);
    expect(sprites.get(eid)?.setFrame).toBeCalledWith(13);
  });
});
