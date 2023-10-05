import { GameObjects } from "phaser";
import { describe, expect, it, vi } from "vitest";
import spriteSystem from "./spriteSystem";
import World from "../World";
import { buildBaseEntity } from "../builders";
import { createWorld, getAllEntities, removeEntity } from "bitecs";
import Position from "../components/Position";
import Velocity from "../components/Velocity";
import sprites from "../resources/sprites";

vi.mock("../game", () => ({
  default: {
    scene: {
      scenes: [
        {
          add: {
            sprite: vi.fn(() => ({
              x: 24,
              y: 24,
              depth: 0,
              rotation: 0,
              scaleX: 1,
              scaleY: 1,
              setOrigin: vi.fn(),
              destroy: vi.fn(),
            })),
          },
        },
      ],
    },
  },
}));

describe("spriteSystem", () => {
  it("should move entities", () => {
    const world = createWorld<World>();
    world.time = { delta: 1, elapsed: 0, then: 0 };
    const eid = buildBaseEntity(24, 24, 24, 13, world);
    spriteSystem(world);
    const sprite = sprites.get(eid);
    expect(sprite?.x).toBe(24);
    expect(sprite?.y).toBe(24);
    expect(sprite?.depth).toBe(0);
    expect(sprite?.rotation).toBe(0);
    expect(sprite?.scaleX).toBe(1);
    expect(sprite?.scaleY).toBe(1);
    expect(sprite?.setOrigin).toBeCalledWith(0, 0);
    removeEntity(world, eid);
    spriteSystem(world);
    expect(sprites.get(eid)).toBeUndefined();
  });
});
