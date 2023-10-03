import { Scene } from "phaser";
import { addComponent, addEntity, createWorld, pipe } from "bitecs";
import timeSystem from "../systems/timeSystem";
import spriteRenderingSystem, {
  TILE_WIDTH,
} from "../systems/spriteRenderingSystem";
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
import inputSystem from "../systems/inputSystem";
import Input from "../components/Input";
import destinationSystem from "../systems/destinationSystem";
import Destination from "../components/Destination";
import mapMovementSystem from "../systems/mapMovementSystem";
import Map from "../components/Map";

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
      inputSystem,
      destinationSystem,
      mapMovementSystem,
      movementSystem,
      spriteTextureSystem,
      spriteRenderingSystem
    );

    this.world = createWorld<World>();
    this.world.time = { delta: 0, elapsed: 0, then: 0 };

    this.load.atlas("sheet", "sheet.png", "sheet.json");
  }

  create() {
    const world = this.world;
    addEntity(world);

    const map = addEntity(world);
    addComponent(world, Map, map);
    Map.width[map] = 16;
    Map.height[map] = 16;

    this.cameras.main.setZoom(4);
    this.cameras.main.centerOn(
      Map.width[map] * TILE_WIDTH * 0.5,
      Map.height[map] * TILE_WIDTH * 0.5
    );

    for (let i = 0; i < Map.width[map]; i++) {
      for (let j = 0; j < Map.height[map]; j++) {
        const eid = addEntity(world);
        addComponent(world, Position, eid);
        addComponent(world, Velocity, eid);
        addComponent(world, Rotation, eid);
        addComponent(world, Scale, eid);
        addComponent(world, Sprite, eid);
        addComponent(world, Texture, eid);
        Position.x[eid] = i;
        Position.y[eid] = j;
        Velocity.x[eid] = 0;
        Velocity.y[eid] = 0;
        Rotation.angle[eid] = 0;
        Scale.x[eid] = 1;
        Scale.y[eid] = 1;
        Sprite.anchor[eid] = 0.5;
        Texture.frame[eid] = 0;
        textures.set(eid, "sheet");
      }
    }

    const eid = addEntity(world);
    addComponent(world, Position, eid);
    addComponent(world, Velocity, eid);
    addComponent(world, Rotation, eid);
    addComponent(world, Scale, eid);
    addComponent(world, Sprite, eid);
    addComponent(world, Texture, eid);
    addComponent(world, Velocity, eid);
    addComponent(world, Input, eid);
    addComponent(world, Destination, eid);
    Position.x[eid] = 0;
    Position.y[eid] = 0;
    Velocity.x[eid] = 0;
    Velocity.y[eid] = 0;
    Rotation.angle[eid] = 0;
    Scale.x[eid] = 1;
    Scale.y[eid] = 1;
    Velocity.x[eid] = 1;
    Velocity.y[eid] = 1;
    Sprite.anchor[eid] = 0.5;
    Texture.frame[eid] = 1;
    textures.set(eid, "sheet");
  }

  update() {
    // Update game objects here
    this.pipeline(this.world);
  }
}
