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
import ConditionalDestroy from "../components/ConditionalDestroy";
import conditionalDestroys from "../resources/conditionalDestroys";
import { GROUP_NODE_SIZES, NodeType } from "../graphGenerator";
import { AUTOTILE_MAPPING, BLOB_NUMBERS } from "../utils";
import cameraSystem from "../systems/cameraSystem";

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
      spriteRenderingSystem,
      cameraSystem,
      conditionalDestroySystem
    );

    this.world = createWorld<World>();
    this.world.time = { delta: 0, elapsed: 0, then: 0 };

    this.load.atlas("sheet", "sheet.png", "sheet.json");
    this.load.aseprite("bunny", "bunny.png", "bunny.json");
    this.load.aseprite("grass", "grass.png", "grass.json");
    this.load.atlas("autotile", "islands-sheet.png", "islands.json");
    this.load.spritesheet("autotile-sheet", "islands-sheet.png", {
      frameWidth: 16,
      frameHeight: 16,
      margin: 1,
      spacing: 1,
    });
    this.load.glsl("water", "shaders/water.frag");
    this.load.audio("music", "skb1_1_v0.2.mp3");
  }

  create() {
    this.sound.play("music", { loop: true });
    this.anims.createFromAseprite("bunny");
    this.anims.createFromAseprite("grass");
    const rt1 = this.add.renderTexture(
      0,
      0,
      this.cameras.main.width,
      this.cameras.main.height
    );

    const secondaryCamera = this.cameras.add(
      this.cameras.main.x,
      this.cameras.main.y,
      this.cameras.main.width,
      this.cameras.main.height,
      false
    );

    secondaryCamera.alpha = 0;

    this.world.secondaryCamera = secondaryCamera;

    this.world.renderTexture = rt1;

    const shader = this.add.shader("water", 1024, 1024, 8192, 8192);
    shader.depth = -2;

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
    Map.width[map] = 100;
    Map.height[map] = 100;
    const midWidth = Map.width[map] / 2;
    const midHeight = Map.height[map] / 2;
    const initialRoomSize = 8;

    if (this.game.device.os.android || this.game.device.os.iOS) {
      this.cameras.main.setZoom(1.5);
    } else {
      this.cameras.main.setZoom(2);
    }

    const vignette = this.cameras.main.postFX.addVignette(0.5, 0.5, 0.01, 0.4);

    this.tweens.add({
      targets: vignette,
      radius: 0.5,
      duration: 3000,
    });

    const colorMatrix = this.cameras.main.postFX.addColorMatrix().sepia();
    const red = this.cameras.main.postFX.addGradient(0xff0000, 0xff0000, 0);
    red.alpha = 1;
    const night = this.cameras.main.postFX.addColorMatrix().night();
    night.alpha = 0;
    const bloom = this.cameras.main.postFX.addBloom(0xffffff, 1, 1, 1.1, 1.5);

    this.tweens.add({
      targets: bloom,
      strength: 0.8,
      duration: 3000,
    });

    const barrel = this.cameras.main.postFX.addBarrel(2.6);

    this.tweens.add({
      targets: barrel,
      amount: 1.1,
      duration: 3000,
    });

    const tiltShift = this.cameras.main.postFX.addTiltShift(7.5);

    this.tweens.add({
      targets: tiltShift,
      radius: 0.8,
      duration: 3000,
    });

    useStore.subscribe(() => {
      if (useStore.getState().hasWon) {
        this.tweens.add({
          targets: colorMatrix,
          alpha: 0,
          duration: 3000,
        });
        this.tweens.add({
          targets: red,
          alpha: 0.7,
          delay: 2000,
          duration: 15000,
        });
        this.tweens.add({
          targets: red,
          alpha: 1,
          delay: 17000,
          duration: 5000,
        });
        this.tweens.add({
          targets: night,
          alpha: 0.5,
          delay: 15000,
          duration: 10000,
        });
        this.tweens.add({
          targets: vignette,
          radius: 0.3,
          duration: 3000,
        });
        this.tweens.add({
          targets: bloom,
          strength: 1.1,
          duration: 3000,
        });
        this.tweens.add({
          targets: vignette,
          radius: 1.2,
          duration: 3000,
        });
        this.tweens.add({
          targets: barrel,
          amount: 1.05,
          duration: 3000,
        });
        this.tweens.add({
          targets: tiltShift,
          radius: 0.025,
          duration: 3000,
        });
        this.tweens.add({
          targets: this.cameras.main,
          zoom: 2.5,
          duration: 2000,
          delay: 2000,
          ease: Phaser.Math.Easing.Quadratic.InOut,
        });
        secondaryCamera.zoom = 2.5;
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

    // for (let i = 0; i <= Map.width[map] - 1; i++) {
    //   for (let j = 0; j <= Map.height[map] - 1; j++) {
    //     const isGrass = j >= midHeight - initialRoomSize / 2 - 1;
    //     let texture = isGrass ? "grass" : "grass";
    //     let frame = isGrass ? 0 : 0;
    //     const eid = buildBaseEntity(i, j, -1, frame, world, texture);
    //     if (isGrass) {
    //       Sprite.animated[eid] = 1;
    //       animations.set(eid, {
    //         key: "Grass" + Phaser.Math.Between(1, 4),
    //         repeat: -1,
    //         frameRate: 1 + Phaser.Math.FloatBetween(-0.1, 0.1),
    //       });
    //     }
    //   }
    // }

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

    setTimeout(async () => {
      const tileData: number[][] = [];
      const graph = useStore.getState().forceGraphInstance;
      const data = graph?.graphData();
      const lowestX =
        Math.min(...(data?.nodes.map((n) => (n as NodeType).x!) || [])) - 200;
      const lowestY =
        Math.min(...(data?.nodes.map((n) => (n as NodeType).y!) || [])) - 200;

      const movedData = {
        nodes: data?.nodes.map((n) => ({
          ...n,
          x: ((n as NodeType).x! - lowestX) / 4,
          y: ((n as NodeType).y! - lowestY) / 4,
        })),
        links: data?.links.map((l) => ({
          ...l,
          source: {
            ...(l.source as NodeType),
            x: ((l.source as NodeType).x! - lowestX) / 4,
            y: ((l.source as NodeType).y! - lowestY) / 4,
          },
          target: {
            ...(l.target as NodeType),
            x: ((l.target as NodeType).x! - lowestX) / 4,
            y: ((l.target as NodeType).y! - lowestY) / 4,
          },
        })),
      };

      console.log(movedData?.links);

      const bounds = graph?.getGraphBbox();
      const [minX, minY, maxX, maxY] = [
        Math.floor(bounds!.x[0] - lowestX),
        Math.floor(bounds!.y[0] - lowestY),
        Math.floor(bounds!.x[1] - lowestX),
        Math.floor(bounds!.y[1] - lowestY),
      ];
      const width = maxX - minX;
      const height = maxY - minY;
      const scaledWidth = Math.floor(width);
      const scaledHeight = Math.floor(height);

      const sparseMap: number[][] = [];
      for (let i = 0; i < scaledHeight; i++) {
        sparseMap[i] = [];
        for (let j = 0; j < scaledWidth; j++) {
          sparseMap[i][j] = 0;
        }
      }
      for (let i = 0; i < scaledHeight; i++) {
        sparseMap[i] ||= [];
        for (let j = 0; j < scaledWidth; j++) {
          // sparseMap[i][j] = 1;
        }
      }
      for (const n of movedData?.nodes || []) {
        const y = Math.floor(n.y);
        const x = Math.floor(n.x);
        for (
          let radius = 0;
          radius < GROUP_NODE_SIZES[(n as NodeType).group];
          radius++
        ) {
          for (let angle = 0; angle < 360; angle += 1) {
            const dx = Math.floor(Math.cos(angle) * radius);
            const dy = Math.floor(Math.sin(angle) * radius);
            sparseMap[y + dy] ||= [];
            sparseMap[y + dy][x + dx] = 1;
          }
        }
      }
      for (const l of movedData?.links || []) {
        const startX = Math.floor((l.source as NodeType).x!);
        const startY = Math.floor((l.source as NodeType).y!);
        const endX = Math.floor((l.target as NodeType).x!);
        const endY = Math.floor((l.target as NodeType).y!);

        // integer step from start to end

        const slope = (endY - startY) / (endX - startX);

        for (
          let x = Math.min(startX, endX);
          x < Math.max(startX, endX);
          x += 0.1
        ) {
          const y = slope * (x - startX) + startY;
          sparseMap[Math.floor(y)] ||= [];
          sparseMap[Math.floor(y)][Math.floor(x)] = 1;
          const randomRadius = Phaser.Math.FloatBetween(1, 3);
          for (let radius = 0; radius < randomRadius; radius += 0.1) {
            for (let angle = 0; angle < 360; angle += 1) {
              const dx = Math.cos(angle) * radius;
              const dy = Math.sin(angle) * radius;
              sparseMap[Math.floor(y + dy)] ||= [];
              sparseMap[Math.floor(y + dy)][Math.floor(x + dx)] = 1;
            }
          }
        }
      }

      // for (let i = 0; i < 200; i++) {
      //   const firstNonZero = sparseMap[i].indexOf(1);
      //   const lastNonZero = sparseMap[i].lastIndexOf(1);
      //   if (firstNonZero !== -1 && lastNonZero !== -1) {
      //     for (let j = firstNonZero; j < lastNonZero; j++) {
      //       if (sparseMap[i]) sparseMap[i][j] = 1;
      //     }
      //   }
      // }
      // for (let j = 0; j < 200; j++) {
      //   const firstNonZero = sparseMap.map((row) => row[j]).indexOf(1);
      //   const lastNonZero = sparseMap.map((row) => row[j]).lastIndexOf(1);
      //   if (firstNonZero !== -1 && lastNonZero !== -1) {
      //     for (let i = firstNonZero; i < lastNonZero; i++) {
      //       if (sparseMap[i]) sparseMap[i][j] = 1;
      //     }
      //   }
      // }

      // console.table(sparseMap);
      const bitmasks: number[][] = [];
      for (let i = 0; i <= scaledWidth + 5; i++) {
        bitmasks[i] = [];
        for (let j = 0; j <= scaledHeight + 5; j++) {
          bitmasks[i][j] = 0;
        }
      }
      const uniqueBitmasks = new Set<number>();
      for (let i = 0; i <= scaledWidth + 5; i++) {
        bitmasks[i] = [];
        for (let j = 0; j <= scaledHeight + 5; j++) {
          // if (sparseMap[i][j] === 0) {
          //   continue;
          // }
          let bitmask = 0;
          let foundEdge = false;
          // north
          if (sparseMap[j - 1]?.[i]) {
            bitmask += 1;
          }
          // northeast
          if (sparseMap[j - 1]?.[i + 1]) {
            bitmask += 2;
          }
          // east
          if (sparseMap[j]?.[i + 1]) {
            bitmask += 4;
          }
          // southeast
          if (sparseMap[j + 1]?.[i + 1]) {
            bitmask += 8;
          }
          // south
          if (sparseMap[j + 1]?.[i]) {
            bitmask += 16;
          }
          // southwest
          if (sparseMap[j + 1]?.[i - 1]) {
            bitmask += 32;
          }
          // west
          if (sparseMap[j]?.[i - 1]) {
            bitmask += 64;
          }
          // northwest
          if (sparseMap[j - 1]?.[i - 1]) {
            bitmask += 128;
          }

          if (!BLOB_NUMBERS.has(bitmask)) {
            // sparseMap[j][i] = 0;
            bitmask = 0;
          }
          bitmasks[i][j] = bitmask;
          uniqueBitmasks.add(bitmask);

          // Sprite.animated[eid] = 1;
          // animations.set(eid, {
          //   key: "Grass" + Phaser.Math.Between(1, 4),
          //   repeat: -1,
          //   frameRate: 1 + Phaser.Math.FloatBetween(-0.1, 0.1),
          // });
        }
      }

      for (let i = 0; i < scaledWidth; i++) {
        for (let j = 0; j < scaledHeight; j++) {
          let bitmask = bitmasks[i][j];
          // if 1 neighbor or less, drop the tile
          if (
            [
              bitmasks[i - 1]?.[j],
              bitmasks[i + 1]?.[j],
              bitmasks[i]?.[j - 1],
              bitmasks[i]?.[j + 1],
              bitmasks[i - 1]?.[j - 1],
              bitmasks[i + 1]?.[j + 1],
              bitmasks[i - 1]?.[j + 1],
              bitmasks[i + 1]?.[j - 1],
            ].filter((b) => b !== 0).length <= 3
          ) {
            sparseMap[j][i] = 0;
            bitmask = 0;
            continue;
          }
          const index = AUTOTILE_MAPPING.indexOf(bitmask);
          const eid = buildBaseEntity(
            i,
            j,
            -1,
            index,
            // bitmask > 0 ? AUTOTILE_MAPPING.indexOf(255) : 0,
            world,
            "autotile"
          );
          tileData[j] ||= [];
          tileData[j][i] = bitmask > 0 ? 1 : 0;
        }
      }

      world.map = tileData;

      // choose 3 random non-adjacent positions
      const positions: { x: number; y: number }[] = [];

      // create an array of indices of all non-zero positions
      const indices: number[] = [];
      for (let i = 0; i < scaledWidth; i++) {
        for (let j = 0; j < scaledHeight; j++) {
          if (tileData[j]?.[i]) {
            indices.push(i + j * scaledWidth);
          }
        }
      }

      // finds a random non-zero position in sparseMap
      const randomPositionOnMap = () => {
        const index = Phaser.Math.RND.pick(indices);
        const x = index % scaledWidth;
        const y = Math.floor(index / scaledWidth);
        return { x, y };
      };

      const { x: startX, y: startY } = randomPositionOnMap();
      this.player = buildPlayerEntity(startX, startY, 3, world);

      while (positions.length < 3) {
        const { x, y } = randomPositionOnMap();
        if (
          positions.filter(
            (p) =>
              Phaser.Math.Distance.Between(p.x, p.y, x, y) < 2 ||
              grid[x]?.[y] === 1
          ).length === 0
        ) {
          positions.push({ x, y });
          grid[x] ||= [];
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
          const { x, y } = randomPositionOnMap();
          Position.x[b] = x;
          Position.y[b] = y;

          Destination.x[b] = Position.x[b];
          Destination.y[b] = Position.y[b];
        }
        // Position.x[b] += 1;
        // Destination.x[b] += 1;
      });
    }, 2500);
  }

  update(time: number, delta: number) {
    // Update game objects here
    this.pipeline(this.world);
    this.world.currentCamera = this.cameras.main;

    if (this.input.keyboard?.checkDown(this.input.keyboard.addKey("R"), 500)) {
      this.scene.restart();
    }

    // const playerSprite = sprites.get(this.player);
    // if (playerSprite && !this.isFollowing) {
    //   const destinationX = playerSprite.x - this.cameras.main.width * 0.5;
    //   const destinationY = playerSprite.y - this.cameras.main.height * 0.5;
    //   this.cameras.main.scrollX +=
    //     (destinationX - this.cameras.main.scrollX) * 0.005 * delta;
    //   this.cameras.main.scrollY +=
    //     (destinationY - this.cameras.main.scrollY) * 0.005 * delta;
    //   if (
    //     Math.abs(destinationX - this.cameras.main.scrollX) < delta * 0.1 &&
    //     Math.abs(destinationY - this.cameras.main.scrollY) < delta * 0.1
    //   ) {
    //     this.isFollowing = true;
    //     this.cameras.main.startFollow(playerSprite, true, 0.1, 0.1);
    //   }
    // }
  }
}
