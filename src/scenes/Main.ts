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
import conditionalDestroySystem from "../systems/conditionalDestroySystem";
import ConditionalDestroy from "../components/CoditionalDestroy";
import conditionalDestroys from "../resources/conditionalDestroys";

export default class Main extends Scene {
  world!: World;
  pipeline!: (world: World) => void;
  player!: number;
  isFollowing!: boolean;
  oceanTop!: Phaser.GameObjects.Polygon;
  oceanLeft: Phaser.GameObjects.Polygon;

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
      spriteRenderingSystem,
      conditionalDestroySystem
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
    Map.width[map] = 64;
    Map.height[map] = 64;
    const midWidth = Map.width[map] / 2;
    const midHeight = Map.height[map] / 2;
    const initialRoomSize = 8;

    if (this.game.device.os.android || this.game.device.os.iOS) {
      this.cameras.main.setZoom(1.5);
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
      radius: 0.3,
      duration: 1000,
    });

    const colorMatrix = this.cameras.main.postFX.addColorMatrix().sepia();
    const bloom = this.cameras.main.postFX.addBloom(0xffffff, 1, 1, 0.9, 2.1);
    const barrel = this.cameras.main.postFX.addBarrel(2.6);
    const tiltShift = this.cameras.main.postFX.addTiltShift(9.5);

    useStore.subscribe(() => {
      if (useStore.getState().hasWon) {
        this.tweens.add({
          targets: colorMatrix,
          alpha: 0,
          duration: 1000,
        });
        this.tweens.add({
          targets: bloom,
          strength: 1,
          duration: 1000,
        });
        this.tweens.add({
          targets: vignette,
          radius: 1,
          duration: 1000,
        });
        this.tweens.add({
          targets: barrel,
          amount: 1,
          duration: 1000,
        });
        this.tweens.add({
          targets: tiltShift,
          radius: 0.1,
          duration: 1000,
        });
        this.tweens.add({
          targets: this.cameras.main,
          zoom: 2.5,
          duration: 1500,
          ease: Phaser.Math.Easing.Quadratic.InOut,
        });
      }
    });

    useStore.setState({ hasWon: true });

    for (
      let i = midWidth - initialRoomSize / 2;
      i < midWidth + initialRoomSize / 2;
      i++
    ) {
      for (
        let j = midHeight - initialRoomSize / 2;
        j < midHeight + initialRoomSize / 2;
        j++
      ) {
        // const eid = buildBaseEntity(i, j, 0, 0, world, "grass");
        // Sprite.animated[eid] = 1;
        // animations.set(eid, {
        //   key: "Grass" + Phaser.Math.Between(1, 4),
        //   repeat: -1,
        //   frameRate: 1 + Phaser.Math.FloatBetween(-0.1, 0.1),
        // });
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
      const x = Phaser.Math.Between(
        midWidth - initialRoomSize / 2 + 2,
        midWidth + initialRoomSize / 2 - 2
      );
      const y = Phaser.Math.Between(
        midHeight - initialRoomSize / 2 + 2,
        midHeight + initialRoomSize / 2 - 2
      );
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
        if (Position.x[b] < midWidth - initialRoomSize / 2 + 2) {
          Position.x[b] = midWidth - initialRoomSize / 2 + 2;
        }
        if (Position.x[b] > midWidth + initialRoomSize / 2 - 2) {
          Position.x[b] = midWidth + initialRoomSize / 2 - 2;
        }
        if (Position.y[b] < midHeight - initialRoomSize / 2 + 2) {
          Position.y[b] = midHeight - initialRoomSize / 2 + 2;
        }
        if (Position.y[b] > midHeight + initialRoomSize / 2 - 2) {
          Position.y[b] = midHeight + initialRoomSize / 2 - 2;
        }

        Destination.x[b] = Position.x[b];
        Destination.y[b] = Position.y[b];
      }
      // Position.x[b] += 1;
      // Destination.x[b] += 1;
    });

    // draw a perimeter of static blocks around the blocks
    for (let i = 0; i <= Map.width[map] - 1; i++) {
      for (let j = 0; j <= Map.height[map] - 1; j++) {
        const isGrass = j >= midHeight - initialRoomSize / 2 - 1;
        let texture = isGrass ? "grass" : "grass";
        let frame = isGrass ? 0 : 0;
        const eid = buildBaseEntity(i, j, -1, frame, world, texture);
        if (isGrass) {
          Sprite.animated[eid] = 1;
          animations.set(eid, {
            key: "Grass" + Phaser.Math.Between(1, 4),
            repeat: -1,
            frameRate: 1 + Phaser.Math.FloatBetween(-0.1, 0.1),
          });
        }
      }
    }

    const predicate = () => useStore.getState().hasWon;
    for (
      let i = midWidth - initialRoomSize / 2 - 1;
      i <= midWidth + initialRoomSize / 2;
      i++
    ) {
      for (
        let j = midHeight - initialRoomSize / 2 - 1;
        j <= midHeight + initialRoomSize / 2;
        j++
      ) {
        if (
          i === midWidth - initialRoomSize / 2 - 1 ||
          i === midWidth + initialRoomSize / 2 ||
          j === midHeight - initialRoomSize / 2 - 1 ||
          j === midHeight + initialRoomSize / 2
        ) {
          const eid = buildStaticBlockEntity(i, j, 0, world);
          addComponent(world, ConditionalDestroy, eid);
          const predicates = conditionalDestroys.get(eid) || [];
          predicates.push(predicate);
          conditionalDestroys.set(eid, predicates);
        }
      }
    }

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

    this.player = buildPlayerEntity(midWidth, midHeight, 3, world);

    // build ocean
    // create a polygon that is the width of the map and 10 tiles high
    // make sure to have at least 50 points on the bottom side of the polygon
    let points = [];
    points.push(0, 0);
    points.push(0, 10 * TILE_WIDTH);
    // for (let i = 0; i < 200; i++) {
    //   points.push(Map.width[map] * TILE_WIDTH * (i / 200), 10 * TILE_WIDTH);
    // }
    points.push(Map.width[map] * TILE_WIDTH, 10 * TILE_WIDTH);
    // points.push(Map.width[map] * TILE_WIDTH, 0);

    // this.oceanTop.alpha = 0;
    // this.oceanTop.blendMode = Phaser.BlendModes.SCREEN;
    // points.push(0, 0);
    // for (let j = 0; j < 200; j++) {
    //   points.push(
    //     Map.width[map] * TILE_WIDTH,
    //     10 * TILE_WIDTH + Map.height[map] * TILE_WIDTH * (j / 200)
    //   );
    // }
    // points.push(Map.width[map] * TILE_WIDTH, Map.height[map] * TILE_WIDTH);
    points.push(Map.width[map] * TILE_WIDTH, 0);
    // points.push(
    //   (Map.width[map] + 1) * TILE_WIDTH,
    //   Map.height[map] * TILE_WIDTH
    // );

    this.oceanTop = this.add.polygon(
      (Map.width[map] * TILE_WIDTH) / 2,
      0,
      points,
      0x0000ff
    );
    this.oceanTop.postFX.addBloom(0xffffff, 1, 1, 0.9, 1.1);
    this.oceanTop.postFX.addBlur(2, 0, 1, 0.25, 0xffffff);
    this.oceanTop.postFX.addGradient(0x176b87, 0x04364a);
    this.oceanTop.postFX.addGlow(0xffffff, 2.5, 0, false, 2, 5);
  }

  update(time: number, delta: number) {
    // Update game objects here
    this.pipeline(this.world);

    const oceanTopPoints = this.oceanTop.geom.points;

    // for (let i = 2; i < 202; i++) {
    //   oceanTopPoints[i].y =
    //     10 * TILE_WIDTH +
    //     Math.cos(time * 0.0002 + i * 100) *
    //       2 *
    //       Math.sin(time * 0.001 + i * 25) +
    //     Math.cos(time * 0.001 + i * 100) * Math.cos(time * 0.002 + i * 1);
    // }

    // for (let i = 204; i < 404; i++) {
    //   oceanTopPoints[i].x =
    //     10 * TILE_WIDTH +
    //     Math.cos(time * 0.0002 + i * 100) *
    //       2 *
    //       Math.sin(time * 0.001 + i * 25) +
    //     Math.cos(time * 0.001 + i * 100) * Math.cos(time * 0.002 + i * 1);
    // }

    this.oceanTop.setTo(oceanTopPoints);

    if (this.input.keyboard?.checkDown(this.input.keyboard.addKey("R"), 500)) {
      this.scene.restart();
    }

    const playerSprite = sprites.get(this.player);
    if (useStore.getState().hasWon && playerSprite && !this.isFollowing) {
      const destinationX = playerSprite.x - this.cameras.main.width * 0.5;
      const destinationY = playerSprite.y - this.cameras.main.height * 0.5;
      this.cameras.main.scrollX +=
        (destinationX - this.cameras.main.scrollX) * 0.00001 * delta;
      this.cameras.main.scrollY +=
        (destinationY - this.cameras.main.scrollY) * 0.00001 * delta;
      if (
        Math.abs(destinationX - this.cameras.main.scrollX) < delta &&
        Math.abs(destinationY - this.cameras.main.scrollY) < delta
      ) {
        this.isFollowing = true;
        this.cameras.main.startFollow(playerSprite, true, 0.1, 0.1);
      }
    }
  }
}
