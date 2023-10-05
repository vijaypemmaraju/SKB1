import { Scene } from "phaser";
import { addComponent, addEntity, createWorld, pipe } from "bitecs";
import timeSystem from "../systems/timeSystem";
import spriteRenderingSystem, {
  TILE_WIDTH,
} from "../systems/spriteRenderingSystem";
import spriteSystem from "../systems/spriteSystem";
import movementSystem from "../systems/movementSystem";
import World from "../World";
import inputSystem from "../systems/inputSystem";
import destinationSystem from "../systems/destinationSystem";
import mapMovementSystem from "../systems/mapMovementSystem";
import Map from "../components/Map";
import {
  buildIcyTileEntity,
  buildBaseEntity,
  buildPushableBlockEntity,
  buildPlayerEntity,
  buildStaticBlockEntity,
  buildGoalEntity,
} from "../builders";
import goalSystem from "../systems/goalSystem";
import useStore from "../useStore";

export default class Main extends Scene {
  world!: World;
  pipeline!: (world: World) => void;

  constructor() {
    super({ key: "Main" });
  }

  preload() {
    this.load.scenePlugin(
      "rexgesturesplugin",
      "https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexgesturesplugin.min.js",
      "rexGestures",
      "rexGestures"
    );
    this.pipeline = pipe(
      timeSystem,
      spriteSystem,
      inputSystem,
      destinationSystem,
      mapMovementSystem,
      movementSystem,
      goalSystem,
      spriteRenderingSystem
    );

    this.world = createWorld<World>();
    this.world.time = { delta: 0, elapsed: 0, then: 0 };

    this.load.atlas("sheet", "sheet.png", "sheet.json");
  }

  create() {
    const swipe = (this as any).rexGestures.add.swipe({
      enable: true,
      bounds: undefined,

      threshold: 10,
      velocityThreshold: 1000,
      dir: "4dir",
    });

    useStore.setState({ swipe });
    const world = this.world;
    addEntity(world);

    const map = addEntity(world);
    addComponent(world, Map, map);
    Map.width[map] = 16;
    Map.height[map] = 16;

    if (this.game.device.os.android || this.game.device.os.iOS) {
      const width = window.innerWidth;
      const ratio = width / ((Map.width[map] - 2) * TILE_WIDTH);
      this.cameras.main.setZoom(ratio);
    } else {
      this.cameras.main.setZoom(2);
    }

    this.cameras.main.centerOn(
      Map.width[map] * TILE_WIDTH * 0.5,
      Map.height[map] * TILE_WIDTH * 0.5
    );

    for (let i = 0; i < Map.width[map]; i++) {
      for (let j = 0; j < Map.height[map]; j++) {
        buildBaseEntity(
          i,
          j,
          0,
          Phaser.Math.Between(0, 1) === 1 ? 0 : 5,
          world
        );
      }
    }

    buildIcyTileEntity(2, 2, 1, world);
    buildIcyTileEntity(2, 3, 1, world);
    buildIcyTileEntity(2, 4, 1, world);
    buildIcyTileEntity(3, 4, 1, world);
    buildIcyTileEntity(3, 5, 1, world);
    buildIcyTileEntity(3, 6, 1, world);
    buildIcyTileEntity(4, 5, 1, world);
    buildIcyTileEntity(5, 6, 1, world);
    buildIcyTileEntity(5, 4, 1, world);
    buildIcyTileEntity(5, 3, 1, world);
    buildIcyTileEntity(8, 2, 1, world);
    buildIcyTileEntity(8, 3, 1, world);
    buildIcyTileEntity(8, 4, 1, world);
    buildIcyTileEntity(9, 4, 1, world);
    buildIcyTileEntity(9, 5, 1, world);
    buildIcyTileEntity(9, 6, 1, world);
    buildIcyTileEntity(10, 5, 1, world);
    buildIcyTileEntity(11, 6, 1, world);
    buildIcyTileEntity(11, 4, 1, world);
    buildIcyTileEntity(11, 3, 1, world);

    buildIcyTileEntity(2, 7, 1, world);
    buildIcyTileEntity(2, 8, 1, world);
    buildIcyTileEntity(2, 9, 1, world);
    buildIcyTileEntity(3, 0, 1, world);
    buildIcyTileEntity(3, 10, 1, world);
    buildIcyTileEntity(3, 11, 1, world);
    buildIcyTileEntity(4, 7, 1, world);
    buildIcyTileEntity(5, 8, 1, world);
    buildIcyTileEntity(5, 6, 1, world);
    buildIcyTileEntity(5, 5, 1, world);
    buildIcyTileEntity(8, 5, 1, world);
    buildIcyTileEntity(8, 9, 1, world);
    buildIcyTileEntity(8, 10, 1, world);
    buildIcyTileEntity(9, 11, 1, world);
    buildIcyTileEntity(9, 12, 1, world);
    buildIcyTileEntity(9, 11, 1, world);
    buildIcyTileEntity(10, 10, 1, world);
    buildIcyTileEntity(11, 10, 1, world);
    buildIcyTileEntity(11, 7, 1, world);
    buildIcyTileEntity(11, 9, 1, world);

    buildStaticBlockEntity(4, 2, 1, world);
    buildStaticBlockEntity(4, 3, 1, world);
    buildStaticBlockEntity(2, 3, 1, world);
    buildStaticBlockEntity(7, 4, 1, world);
    buildStaticBlockEntity(5, 5, 1, world);
    buildStaticBlockEntity(1, 6, 1, world);

    for (let i = 0; i < 3; i++) {
      buildPushableBlockEntity(4 + i * 2, 4, 1, world);
    }

    buildGoalEntity(7, 7, 0, world);
    buildGoalEntity(7, 9, 0, world);
    buildGoalEntity(7, 5, 0, world);

    buildPlayerEntity(4, 6, 3, world);
  }

  update() {
    // Update game objects here
    this.pipeline(this.world);

    if (this.input.keyboard?.checkDown(this.input.keyboard.addKey("R"), 500)) {
      this.scene.restart();
    }
  }
}
