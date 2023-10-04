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
import Collidable from "../components/Colllidable";
import Pushable from "../components/Pushable";
import Icy from "../components/Icy";
import {
  buildIcyTileEntity,
  buildBaseEntity,
  buildPushableBlockEntity,
  buildPlayerEntity,
} from "../builders";

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

    this.cameras.main.setZoom(2);
    this.cameras.main.centerOn(
      Map.width[map] * TILE_WIDTH * 0.5,
      Map.height[map] * TILE_WIDTH * 0.5
    );

    for (let i = 0; i < Map.width[map]; i++) {
      for (let j = 0; j < Map.height[map]; j++) {
        buildBaseEntity(i, j, 0, world);
      }
    }

    for (let i = 0; i < Map.width[map]; i++) {
      for (let j = 0; j < Map.height[map]; j++) {
        if ((i === 6 || i === 7) && (j === 6 || j === 7)) {
          buildIcyTileEntity(i, j, 3, world);
        }
      }
    }

    for (let i = 0; i < 3; i++) {
      buildPushableBlockEntity(4 + i * 2, 4, 2, world);
    }

    buildPlayerEntity(4, 6, 1, world);
  }

  update() {
    // Update game objects here
    this.pipeline(this.world);

    if (this.input.keyboard?.checkDown(this.input.keyboard.addKey("R"), 500)) {
      this.scene.restart();
    }
  }
}
