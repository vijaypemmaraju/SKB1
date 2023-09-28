import { Scene } from "phaser";
import { addComponent, addEntity, createWorld, pipe } from "bitecs";
import timeSystem from "../systems/timeSystem";
import spriteMovementSystem from "../systems/spriteMovementSystem";
import spriteSystem from "../systems/spriteSystem";
import movementSystem from "../systems/movementSystem";
import World from "../World";
import spriteTextureSystem from "../systems/spriteTextureSystem";
import Position from "../components/Position";
import Rotation from "../components/Rotation";
import Sprite from "../components/Sprite";
import Texture from "../components/Texture";
import Velocity from "../components/Velocity";
import textures from "../resources/textures";
import Scale from "../components/Scale";

export default class Main extends Scene {
  world!: World;
  pipeline!: (world: World) => void;

  constructor() {
    super({ key: "Main" });
  }

  preload() {
    this.pipeline = pipe(
      timeSystem,
      spriteSystem,
      movementSystem,
      spriteTextureSystem,
      spriteMovementSystem
    );

    this.world = createWorld<World>();
    this.world.time = { delta: 0, elapsed: 0, then: 0 };

    this.load.atlas("sheet", "sheet.png", "sheet.json");
  }

  create() {
    const world = this.world;
    addEntity(world);

    this.cameras.main.setZoom(2);
    this.cameras.main.centerOn(200, 200);

    // const eid = addEntity(world);
    // addComponent(world, Position, eid);
    // addComponent(world, Velocity, eid);
    // addComponent(world, Rotation, eid);
    // addComponent(world, Scale, eid);
    // addComponent(world, Sprite, eid);

    for (let i = 0; i < 25; i++) {
      for (let j = 0; j < 25; j++) {
        const eid = addEntity(world);
        addComponent(world, Position, eid);
        addComponent(world, Velocity, eid);
        addComponent(world, Rotation, eid);
        addComponent(world, Scale, eid);
        addComponent(world, Sprite, eid);
        addComponent(world, Texture, eid);
        Position.x[eid] = i * 16;
        Position.y[eid] = j * 16;
        Velocity.x[eid] = 0;
        Velocity.y[eid] = 0;
        Rotation.angle[eid] = 0;
        Scale.x[eid] = 1;
        Scale.y[eid] = 1;
        Sprite.anchor[eid] = 0.5;
        textures.set(eid, "sheet");
      }
    }

    // addComponent(world, Texture, eid);
    // Position.x[eid] = 200;
    // Position.y[eid] = 200;
    // Velocity.x[eid] = 1.23;
    // Velocity.y[eid] = 1.23;
    // Scale.x[eid] = 1;
    // Scale.y[eid] = 1;
    // Sprite.anchor[eid] = 0.5;
  }

  update() {
    // Update game objects here
    this.pipeline(this.world);
  }
}
