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
import sprites from "../resources/sprites";
import Position from "../components/Position";
import Destination from "../components/Destination";
import animations from "../resources/animations";
import Sprite from "../components/Sprite";

export default class Main extends Scene {
  world!: World;
  pipeline!: (world: World) => void;
  player!: number;
  isFollowing!: boolean;

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
    this.load.aseprite("bunny", "bunny.png", "bunny.json");
    this.load.aseprite("grass", "grass.png", "grass.json");
  }

  create() {
    const graphics = this.add.graphics();

    this.anims.createFromAseprite("bunny");
    this.anims.createFromAseprite("grass");

    graphics.lineStyle(4, 0x00ff00, 1);
    graphics.beginPath();
    graphics.moveTo(0, 0);
    graphics.closePath();
    graphics.strokePath();
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
    Map.width[map] = 8;
    Map.height[map] = 8;

    if (this.game.device.os.android || this.game.device.os.iOS) {
      const width = window.innerWidth;
      const ratio = width / (Map.width[map] * TILE_WIDTH);
      this.cameras.main.setZoom(ratio);
    } else {
      this.cameras.main.setZoom(2);
    }

    this.cameras.main.centerOn(
      Map.width[map] * TILE_WIDTH * 0.5,
      Map.height[map] * TILE_WIDTH * 0.5
    );

    const vignette = this.cameras.main.postFX.addVignette(0.5, 0.5, 0.01, 0.1);
    this.tweens.add({
      targets: vignette,
      radius: 1,
      duration: 1000,
    });

    this.cameras.main.postFX.addBloom(0xffffff, 1, 1, 0.9, 1.4);
    this.cameras.main.postFX.addBarrel(1.1);
    this.cameras.main.postFX.addTiltShift(0.1);

    for (let i = 0; i < Map.width[map]; i++) {
      for (let j = 0; j < Map.height[map]; j++) {
        const eid = buildBaseEntity(i, j, 0, 0, world, "grass");
        Sprite.animated[eid] = 1;
        animations.set(eid, {
          key: "Grass" + Phaser.Math.Between(1, 4),
          repeat: -1,
          frameRate: 1 + Phaser.Math.FloatBetween(-0.1, 0.1),
        });
      }
    }

    let grid: number[][] = [];
    for (let i = 0; i < Map.width[map]; i++) {
      grid[i] = [];
      for (let j = 0; j < Map.height[map]; j++) {
        grid[i][j] = 0;
      }
    }

    // choose 3 random non-adjacent positions
    const positions: { x: number; y: number }[] = [];
    while (positions.length < 3) {
      const x = Phaser.Math.Between(0, Map.width[map] - 1);
      const y = Phaser.Math.Between(0, Map.height[map] - 1);
      if (
        positions.filter(
          (p) =>
            Phaser.Math.Distance.Between(p.x, p.y, x, y) < 2 || grid[x][y] === 1
        ).length === 0
      ) {
        positions.push({ x, y });
        grid[x][y] = 1;
      }
    }

    // create a goal for each position
    positions.forEach((p) => {
      buildGoalEntity(p.x, p.y, 0, world);
    });

    // create a pushable block for each position
    const blocks = positions.map((p) =>
      buildPushableBlockEntity(p.x, p.y, 0, world)
    );

    // push the blocks to the right
    blocks.forEach((b) => {
      const pathLength = Phaser.Math.Between(5, 7);
      for (let i = 0; i < pathLength; i++) {
        Position.x[b] += Phaser.Math.Between(-1, 1);
        Position.y[b] += Phaser.Math.Between(-1, 1);

        // clamp the position to the map
        if (Position.x[b] < 1) {
          Position.x[b] = 1;
        }
        if (Position.x[b] > Map.width[map] - 2) {
          Position.x[b] = Map.width[map] - 2;
        }
        if (Position.y[b] < 1) {
          Position.y[b] = 1;
        }
        if (Position.y[b] > Map.height[map] - 2) {
          Position.y[b] = Map.height[map] - 2;
        }

        Destination.x[b] = Position.x[b];
        Destination.y[b] = Position.y[b];
      }
      // Position.x[b] += 1;
      // Destination.x[b] += 1;
    });

    // buildIcyTileEntity(2, 2, 1, world);
    // buildIcyTileEntity(2, 3, 1, world);
    // buildIcyTileEntity(2, 4, 1, world);
    // buildIcyTileEntity(3, 4, 1, world);
    // buildIcyTileEntity(3, 5, 1, world);
    // buildIcyTileEntity(3, 6, 1, world);
    // buildIcyTileEntity(4, 5, 1, world);
    // buildIcyTileEntity(5, 6, 1, world);
    // buildIcyTileEntity(5, 4, 1, world);
    // buildIcyTileEntity(5, 3, 1, world);
    // buildIcyTileEntity(8, 2, 1, world);
    // buildIcyTileEntity(8, 3, 1, world);
    // buildIcyTileEntity(8, 4, 1, world);
    // buildIcyTileEntity(9, 4, 1, world);
    // buildIcyTileEntity(9, 5, 1, world);
    // buildIcyTileEntity(9, 6, 1, world);
    // buildIcyTileEntity(10, 5, 1, world);
    // buildIcyTileEntity(11, 6, 1, world);
    // buildIcyTileEntity(11, 4, 1, world);
    // buildIcyTileEntity(11, 3, 1, world);

    // buildIcyTileEntity(2, 7, 1, world);
    // buildIcyTileEntity(2, 8, 1, world);
    // buildIcyTileEntity(2, 9, 1, world);
    // buildIcyTileEntity(3, 0, 1, world);
    // buildIcyTileEntity(3, 10, 1, world);
    // buildIcyTileEntity(3, 11, 1, world);
    // buildIcyTileEntity(4, 7, 1, world);
    // buildIcyTileEntity(5, 8, 1, world);
    // buildIcyTileEntity(5, 6, 1, world);
    // buildIcyTileEntity(5, 5, 1, world);
    // buildIcyTileEntity(8, 5, 1, world);
    // buildIcyTileEntity(8, 9, 1, world);
    // buildIcyTileEntity(8, 10, 1, world);
    // buildIcyTileEntity(9, 11, 1, world);
    // buildIcyTileEntity(9, 12, 1, world);
    // buildIcyTileEntity(9, 11, 1, world);
    // buildIcyTileEntity(10, 10, 1, world);
    // buildIcyTileEntity(11, 10, 1, world);
    // buildIcyTileEntity(11, 7, 1, world);
    // buildIcyTileEntity(11, 9, 1, world);

    // buildStaticBlockEntity(4, 2, 1, world);
    // buildStaticBlockEntity(4, 3, 1, world);
    // buildStaticBlockEntity(2, 3, 1, world);
    // buildStaticBlockEntity(7, 4, 1, world);
    // buildStaticBlockEntity(5, 5, 1, world);
    // buildStaticBlockEntity(1, 6, 1, world);

    // for (let i = 0; i < 3; i++) {
    //   buildPushableBlockEntity(4 + i * 2, 4, 1, world);
    // }

    // buildGoalEntity(7, 7, 0, world);
    // buildGoalEntity(7, 9, 0, world);
    // buildGoalEntity(7, 5, 0, world);

    this.player = buildPlayerEntity(4, 6, 3, world);
  }

  update(delta: number) {
    // Update game objects here
    this.pipeline(this.world);

    if (this.input.keyboard?.checkDown(this.input.keyboard.addKey("R"), 500)) {
      this.scene.restart();
    }
    const playerSprite = sprites.get(this.player);
    if (useStore.getState().hasWon && playerSprite && !this.isFollowing) {
      const destinationX = playerSprite.x - this.cameras.main.width * 0.5;
      const destinationY = playerSprite.y - this.cameras.main.height * 0.5;
      this.cameras.main.scrollX +=
        (destinationX - this.cameras.main.scrollX) * 0.000001 * delta;
      this.cameras.main.scrollY +=
        (destinationY - this.cameras.main.scrollY) * 0.000001 * delta;
      if (
        Math.abs(destinationX - this.cameras.main.scrollX) < 1 &&
        Math.abs(destinationY - this.cameras.main.scrollY) < 1
      ) {
        this.isFollowing = true;
        this.cameras.main.startFollow(playerSprite);
      }
    }
  }
}
