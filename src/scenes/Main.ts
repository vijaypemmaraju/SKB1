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
import { GROUP_NODE_SIZES, NodeType } from "../graphGenerator";
import { AUTOTILE_MAPPING, BLOB_NUMBERS } from "../utils";

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
  }

  create() {
    this.anims.createFromAseprite("bunny");
    this.anims.createFromAseprite("grass");
    const rt1 = this.add.renderTexture(
      0,
      0,
      this.cameras.main.width,
      this.cameras.main.height
    );

    this.world.renderTexture = rt1;

    const shader = this.add.shader("water", 0, 0, 4096, 4096);
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
    // const saturation = this.cameras.main.postFX.addColorMatrix().saturate();
    // saturation.alpha = 0;
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
        // this.tweens.add({
        //   targets: saturation,
        //   alpha: 0.5,
        //   duration: 3000,
        // });
        this.tweens.add({
          targets: vignette,
          radius: 0.3,
          duration: 3000,
        });
        this.tweens.add({
          targets: bloom,
          strength: 1.2,
          duration: 3000,
        });
        this.tweens.add({
          targets: vignette,
          radius: 1.2,
          duration: 3000,
        });
        this.tweens.add({
          targets: barrel,
          amount: 1.01,
          duration: 3000,
        });
        this.tweens.add({
          targets: tiltShift,
          radius: 0.1,
          duration: 3000,
        });
        this.tweens.add({
          targets: this.cameras.main,
          zoom: 2.5,
          duration: 2000,
          delay: 2000,
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

    setTimeout(() => {
      const tileData: number[][] = [];
      const graph = useStore.getState().forceGraphInstance;
      const data = graph?.graphData();
      const lowestX =
        Math.min(...(data?.nodes.map((n) => (n as NodeType).x!) || [])) - 100;
      const lowestY =
        Math.min(...(data?.nodes.map((n) => (n as NodeType).y!) || [])) - 100;

      const movedData = {
        nodes: data?.nodes.map((n) => ({
          ...n,
          x: (n as NodeType).x! - lowestX,
          y: (n as NodeType).y! - lowestY,
        })),
        links: data?.links.map((l) => ({
          ...l,
          source: {
            ...(l.source as NodeType),
            x: (l.source as NodeType).x! - lowestX,
            y: (l.source as NodeType).y! - lowestY,
          },
          target: {
            ...(l.target as NodeType),
            x: (l.target as NodeType).x! - lowestX,
            y: (l.target as NodeType).y! - lowestY,
          },
        })),
      };

      const bounds = graph?.getGraphBbox();
      const [minX, minY, maxX, maxY] = [
        Math.floor(bounds!.x[0] - lowestX),
        Math.floor(bounds!.y[0] - lowestY),
        Math.floor(bounds!.x[1] - lowestX) + 200,
        Math.floor(bounds!.y[1] - lowestY) + 200,
      ];
      const width = maxX - minX;
      const height = maxY - minY;
      const scaledWidth = Math.floor(width / 4);
      const scaledHeight = Math.floor(height / 4);

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
        // buildBaseEntity(
        //   Math.floor(n.x / 3),
        //   Math.floor(n.y / 3),
        //   2,
        //   0,
        //   world,
        //   "autotile"
        // );
        const y = Math.floor(n.y / 4);
        const x = Math.floor(n.x / 4);
        for (
          let radius = 0;
          radius < GROUP_NODE_SIZES[(n as NodeType).group] / 1.5;
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
        const startX = Math.floor((l.source as NodeType).x! / 8);
        const startY = Math.floor((l.source as NodeType).y! / 8);
        const endX = Math.floor((l.target as NodeType).x! / 8);
        const endY = Math.floor((l.target as NodeType).y! / 8);

        // integer step from start to end
        const stepX = endX - startX;
        const stepY = endY - startY;
        const step = Math.max(Math.abs(stepX), Math.abs(stepY));
        const stepXNormalized = stepX / step;
        const stepYNormalized = stepY / step;

        let x = startX;
        let y = startY;
        for (let i = 0; i < step; i++) {
          x += stepXNormalized;
          y += stepYNormalized;
          if (!sparseMap[Math.floor(y)]) {
          }
          sparseMap[Math.floor(y) - 1][Math.floor(x)] = 1;
          sparseMap[Math.floor(y)][Math.floor(x) - 1] = 1;
          sparseMap[Math.floor(y)][Math.floor(x)] = 1;
          sparseMap[Math.floor(y)][Math.floor(x) + 1] = 1;
          sparseMap[Math.floor(y) + 1][Math.floor(x)] = 1;
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

      // finds a random non-zero position in sparseMap
      const randomPositionOnMap = () => {
        let x = Phaser.Math.Between(0, scaledWidth - 1);
        let y = Phaser.Math.Between(0, scaledHeight - 1);

        while (!tileData[y]?.[x]) {
          x = Phaser.Math.Between(0, scaledWidth - 1);
          y = Phaser.Math.Between(0, scaledHeight - 1);
        }
        return { x, y };
      };

      const { x: startX, y: startY } = randomPositionOnMap();
      this.player = buildPlayerEntity(startX, startY, 3, world);

      // choose 3 random non-adjacent positions
      const positions: { x: number; y: number }[] = [];
      while (positions.length < 3) {
        let x = Phaser.Math.Between(
          midWidth - initialRoomSize / 2 + 2,
          midWidth + initialRoomSize / 2 - 2
        );
        let y = Phaser.Math.Between(
          midHeight - initialRoomSize / 2 + 2,
          midHeight + initialRoomSize / 2 - 2
        );

        while (!tileData[x][y]) {
          x = Phaser.Math.Between(
            midWidth - initialRoomSize / 2 + 2,
            midWidth + initialRoomSize / 2 - 2
          );
          y = Phaser.Math.Between(
            midHeight - initialRoomSize / 2 + 2,
            midHeight + initialRoomSize / 2 - 2
          );
        }

        if (
          positions.filter(
            (p) =>
              Phaser.Math.Distance.Between(p.x, p.y, x, y) < 2 ||
              grid[x][y] === 1
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
    }, 2500);
  }

  update(time: number, delta: number) {
    // Update game objects here
    this.pipeline(this.world);

    if (this.input.keyboard?.checkDown(this.input.keyboard.addKey("R"), 500)) {
      this.scene.restart();
    }

    const playerSprite = sprites.get(this.player);
    if (playerSprite && !this.isFollowing) {
      const destinationX = playerSprite.x - this.cameras.main.width * 0.5;
      const destinationY = playerSprite.y - this.cameras.main.height * 0.5;
      this.cameras.main.scrollX +=
        (destinationX - this.cameras.main.scrollX) * 0.005 * delta;
      this.cameras.main.scrollY +=
        (destinationY - this.cameras.main.scrollY) * 0.005 * delta;
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
