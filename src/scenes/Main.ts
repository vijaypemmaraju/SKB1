import { Scene } from "phaser";
import { addComponent, addEntity, createWorld, pipe } from "bitecs";
import timeSystem from "../systems/timeSystem";
import gameObjectRenderingSystem, {
  TILE_HEIGHT,
  TILE_WIDTH,
} from "../systems/gameObjectRenderingSystem";
import spriteSystem from "../systems/spriteSystem";
import movementSystem from "../systems/movementSystem";
import World from "../World";
import inputSystem from "../systems/inputSystem";
import destinationSystem from "../systems/destinationSystem";
import mapMovementSystem from "../systems/mapMovementSystem";
import Map from "../components/Map";
import {
  buildBaseEntity,
  buildPushableBlockEntity,
  buildPlayerEntity,
  buildGoalEntity,
} from "../builders";
import goalSystem from "../systems/goalSystem";
import useStore from "../useStore";
import Position from "../components/Position";
import Destination from "../components/Destination";
import conditionalDestroySystem from "../systems/conditionalDestroySystem";
import { GROUP_NODE_SIZES, LinkType, NodeType } from "../graphGenerator";
import { AUTOTILE_MAPPING, BLOB_NUMBERS } from "../utils";
import cameraSystem from "../systems/cameraSystem";
import pushableSystem from "../systems/pushableSystem";
import glsl from "../utils/glsl";
import spriteAnimationSystem from "../systems/spriteAnimationSystem";
import spriteFramingSystem from "../systems/spriteFramingSystem";
import GameObject from "../components/GameObject";
import RenderTexture from "../components/RenderTexture";
import renderTextureSystem from "../systems/renderTextureSystem";
import renderTextures, { saveToTextures } from "../resources/renderTextures";
import shaderSystem from "../systems/shaderSystem";
import Shader from "../components/Shader";
import shaderData from "../resources/shaderData";
import Sprite from "../components/Sprite";
import grass from "../resources/shaders/grass";
import water from "../resources/shaders/water";
import ScrollFactor from "../components/ScrollFactor";
import Anchor from "../components/Anchor";
import foam from "../resources/shaders/foam";
import interactibleSystem from "../systems/interactibleSystem";
import island from "../resources/shaders/island";
import gameObjects from "../resources/gameObjects";
import Rotation from "../components/Rotation";
import Scale from "../components/Scale";
import Velocity from "../components/Velocity";
import Texture from "../components/Texture";
import textures from "../resources/textures";

export default class Main extends Scene {
  world!: World;
  pipeline!: (world: World) => void;
  player!: number;
  isFollowing!: boolean;
  shader!: Phaser.GameObjects.Shader;

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
      renderTextureSystem,
      shaderSystem,
      inputSystem,
      interactibleSystem,
      pushableSystem,
      movementSystem,
      mapMovementSystem,
      destinationSystem,
      goalSystem,
      cameraSystem,
      spriteFramingSystem,
      spriteAnimationSystem,
      gameObjectRenderingSystem,
      conditionalDestroySystem
    );

    this.world = createWorld<World>();
    this.world.currentCamera = this.cameras.main;
    this.world.time = { delta: 0, elapsed: 0, then: 0 };

    this.load.atlas("sheet", "sheet.png", "sheet.json");
    this.load.aseprite("bunny", "bunny.png", "bunny.json");
    this.load.aseprite("grass", "grass.png", "grass.json");
    this.load.aseprite("block", "block.png", "block.json");
    this.load.atlas("autotile", "islands-sheet.png", "islands.json");
    this.load.spritesheet("autotile-sheet", "islands-sheet.png", {
      frameWidth: 16,
      frameHeight: 16,
      margin: 1,
      spacing: 1,
    });
    this.load.audio("music", "skb1_1_v0.2.mp3");
    this.load.image("auto", "wangbl.png");
    this.load.image("gradient", "gradient.png");
    this.load.image("noise", "noise.png");
    this.load.image("clouds", "clouds.png");
  }

  create() {
    const nullEntity = addEntity(this.world);
    // this.sound.play("music", { loop: true });
    this.anims.createFromAseprite("bunny");
    this.anims.createFromAseprite("grass");

    const secondaryCamera = this.cameras.add(
      this.cameras.main.x,
      this.cameras.main.y,
      this.cameras.main.width,
      this.cameras.main.height,
      false
    );

    secondaryCamera.alpha = 0;

    this.world.secondaryCamera = secondaryCamera;

    // const waterShader = this.add.shader("water", 1024, 1024, 8192, 8192);
    // waterShader.depth = -2;

    const waterShader = addEntity(this.world);
    addComponent(this.world, GameObject, waterShader);
    addComponent(this.world, Shader, waterShader);
    addComponent(this.world, Position, waterShader);
    addComponent(this.world, ScrollFactor, waterShader);
    addComponent(this.world, Anchor, waterShader);
    Anchor.x[waterShader] = 0;
    Anchor.y[waterShader] = 0;
    Position.x[waterShader] = -512;
    Position.y[waterShader] = -512;
    Position.z[waterShader] = -3;
    ScrollFactor.x[waterShader] = 1;
    ScrollFactor.y[waterShader] = 1;
    Shader.width[waterShader] = 8192;
    Shader.height[waterShader] = 8192;
    shaderData.set(waterShader, {
      key: "water",
      fragmentShader: water,
      uniforms: {
        tex: { type: "sampler2D", value: "renderTex" },
        camera_position: {
          type: "2f",
          value: { x: 0, y: 0 },
        },
        camera_zoom: {
          type: "1f",
          value: 1.0,
        },
      },
    });

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
      this.cameras.main.setZoom(1);
    }

    // const vignette = this.cameras.main.postFX.addVignette(0.5, 0.5, 0.01, 0.4);

    // this.tweens.add({
    //   targets: vignette,
    //   radius: 0.5,
    //   duration: 30,
    // });

    // const colorMatrix = this.cameras.main.postFX.addColorMatrix().sepia();
    // const red = this.cameras.main.postFX.addGradient(0xff0000, 0xff0000, 0);
    // red.alpha = 0.99;
    // const night = this.cameras.main.postFX.addColorMatrix().night();
    // night.alpha = 0.0;
    // const bloom = this.cameras.main.postFX.addBloom(0xffffff, 1, 1, 1.1, 1.5);

    // this.tweens.add({
    //   targets: bloom,
    //   strength: 0.8,
    //   duration: 30,
    // });

    // const barrel = this.cameras.main.postFX.addBarrel(2.6);

    // this.tweens.add({
    //   targets: barrel,
    //   amount: 1.1,
    //   duration: 30,
    // });

    // const tiltShift = this.cameras.main.postFX.addTiltShift(7.5);

    // this.tweens.add({
    //   targets: tiltShift,
    //   radius: 0.8,
    //   duration: 30,
    // });

    useStore.subscribe(() => {
      if (useStore.getState().hasWon) {
        // this.tweens.add({
        //   targets: colorMatrix,
        //   alpha: 0,
        //   duration: 30,
        // });
        // // this.tweens.add({
        // //   targets: red,
        // //   alpha: 0.7,
        // //   delay: 2000,
        // //   duration: 15000,
        // // });
        // // this.tweens.add({
        // //   targets: red,
        // //   alpha: 1,
        // //   delay: 17000,
        // //   duration: 5000,
        // // });
        // // this.tweens.add({
        // //   targets: night,
        // //   alpha: 0.5,
        // //   delay: 15000,
        // //   duration: 10000,
        // // });
        // this.tweens.add({
        //   targets: vignette,
        //   radius: 0.3,
        //   duration: 30,
        // });
        // this.tweens.add({
        //   targets: bloom,
        //   strength: 1.15,
        //   duration: 30,
        // });
        // this.tweens.add({
        //   targets: vignette,
        //   radius: 1.2,
        //   duration: 30,
        // });
        // this.tweens.add({
        //   targets: barrel,
        //   amount: 1.0,
        //   duration: 30,
        // });
        // this.tweens.add({
        //   targets: tiltShift,
        //   radius: 0,
        //   duration: 30,
        // });
        // this.tweens.add({
        //   targets: this.cameras.main,
        //   zoom: 0.5,
        //   duration: 20,
        //   delay: 20,
        //   ease: Phaser.Math.Easing.Quadratic.InOut,
        // });
        secondaryCamera.zoom = 0.3;
      } else {
        // this.tweens.add({
        //   targets: vignette,
        //   radius: 0.001,
        //   duration: 30,
        // });
        // this.tweens.add({
        //   targets: bloom,
        //   strength: 1,
        //   duration: 30,
        // });
        // this.tweens.add({
        //   targets: barrel,
        //   amount: 1.1,
        //   duration: 30,
        // });
        // this.tweens.add({
        //   targets: tiltShift,
        //   radius: 0.8,
        //   duration: 30,
        // });
        // this.tweens.add({
        //   targets: this.cameras.main,
        //   zoom: 0.6,
        //   duration: 30,
        //   ease: Phaser.Math.Easing.Quadratic.InOut,
        // });
        secondaryCamera.zoom = 0.5;
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
      const tileData: (number | undefined)[][] = [];
      const graph = useStore.getState().forceGraphInstance;
      const data = graph?.graphData();
      const lowestX = Math.min(
        ...(data?.nodes.map((n) => (n as NodeType).x!) || [])
      );
      const lowestY = Math.min(
        ...(data?.nodes.map((n) => (n as NodeType).y!) || [])
      );

      const scaleMultiplier = 4;

      const movedData = {
        nodes: data?.nodes.map((n) => ({
          ...n,
          x: ((n as NodeType).x! - lowestX) / scaleMultiplier,
          y: ((n as NodeType).y! - lowestY) / scaleMultiplier,
        })),
        links: data?.links.map(
          (l) =>
            ({
              ...l,
              source: {
                ...(l.source as NodeType),
                x: ((l.source as NodeType).x! - lowestX) / scaleMultiplier,
                y: ((l.source as NodeType).y! - lowestY) / scaleMultiplier,
              },
              target: {
                ...(l.target as NodeType),
                x: ((l.target as NodeType).x! - lowestX) / scaleMultiplier,
                y: ((l.target as NodeType).y! - lowestY) / scaleMultiplier,
              },
              __controlPoints: [
                ((l as any).__controlPoints[0] - lowestX) / scaleMultiplier,
                ((l as any).__controlPoints[1] - lowestY) / scaleMultiplier,
              ],
            } as LinkType)
        ),
      };

      const bounds = graph?.getGraphBbox();
      const minX = movedData?.nodes!.reduce(
        (acc, n) => Math.min(acc, n.x),
        Infinity
      );
      const minY = movedData?.nodes!.reduce(
        (acc, n) => Math.min(acc, n.y),
        Infinity
      );
      const maxX = movedData?.nodes!.reduce(
        (acc, n) => Math.max(acc, n.x),
        -Infinity
      );
      const maxY = movedData?.nodes!.reduce(
        (acc, n) => Math.max(acc, n.y),
        -Infinity
      );
      // const [minX, minY, maxX, maxY] = [
      //   Math.floor(bounds!.x[0] - lowestX),
      //   Math.floor(bounds!.y[0] - lowestY),
      //   Math.floor(bounds!.x[1] - lowestX),
      //   Math.floor(bounds!.y[1] - lowestY),
      // ];
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
            sparseMap[y + dy][x + dx] = (n as NodeType).depth || 1;
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

        const bezier = new Phaser.Curves.QuadraticBezier(
          new Phaser.Math.Vector2(startX, startY),
          new Phaser.Math.Vector2(
            (l as any).__controlPoints[0],
            (l as any).__controlPoints[1]
          ),
          new Phaser.Math.Vector2(endX, endY)
        );

        const points = bezier.getDistancePoints(4);

        for (const point of points) {
          const x = point.x;
          const y = point.y;
          sparseMap[Math.floor(y)] ||= [];
          sparseMap[Math.floor(y)][Math.floor(x)] ||=
            (l.source as NodeType).depth || 1;
          const randomRadius = Phaser.Math.FloatBetween(2, 3);
          for (let radius = 0; radius < randomRadius; radius += 0.1) {
            for (let angle = 0; angle < 360; angle += 1) {
              const dx = Math.cos(angle) * radius;
              const dy = Math.sin(angle) * radius;
              sparseMap[Math.floor(y + dy)] ||= [];
              sparseMap[Math.floor(y + dy)][Math.floor(x + dx)] ||=
                (l.source as NodeType).depth || 1;
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
          // const eid = buildBaseEntity(
          //   i,
          //   j,
          //   1,
          //   // index,
          //   bitmask > 0 ? AUTOTILE_MAPPING.indexOf(255) : 0,
          //   world,
          //   "autotile"
          // );
          if (sparseMap[j][i] === 1) {
            // GameObject.renderTexture[eid] = rt;
          }
          tileData[j] ||= [];
          tileData[j][i] = bitmask > 0 ? sparseMap[j][i] : undefined;
        }
      }

      const textureData: string[][] = [];
      for (let i = 0; i < scaledWidth; i++) {
        for (let j = 0; j < scaledHeight; j++) {
          textureData[j] ||= [];
          if (!tileData[j]?.[i]) {
            textureData[j][i] = ".";
          } else {
            textureData[j][i] = tileData[j][i]!.toString();
          }
        }
      }

      console.table(textureData);
      const weightedAverageTextureData: string[][] = [];

      // for (let i = 0; i < scaledWidth * scaledHeight; i++) {
      //   let value = 0;
      //   const currentRow = Math.floor(i / scaledWidth);
      //   const currentColumn = i % scaledWidth;
      //   if (!sparseMap[currentRow]?.[currentColumn]) {
      //     continue;
      //   }
      //   for (let j = 0; j < scaledWidth; j++) {
      //     for (let k = 0; k < scaledHeight; k++) {
      //       //       // compute distance from current tile
      //       const distance = Phaser.Math.Distance.Between(
      //         currentRow,
      //         currentColumn,
      //         j,
      //         k
      //       );
      //       //       // compute weight
      //       const weight = 1 / (distance + 1);
      //       // add to value
      //       value += weight * sparseMap[k]?.[j]!;
      //     }
      //   }

      //   // value /= scaledWidth * scaledHeight;

      //   weightedAverageTextureData[currentRow] ||= [];
      //   weightedAverageTextureData[currentRow][currentColumn] =
      //     value.toString();
      // }

      // console.table(weightedAverageTextureData);

      this.textures.generate("sparseMap", {
        data: textureData,
        pixelWidth: 16,
        pixelHeight: 16,
        palette: {
          0: "#000",
          1: "#9D9D9D",
          2: "#FFF",
          3: "#BE2633",
          4: "#E06F8B",
          5: "#493C2B",
          6: "#A46422",
          7: "#EB8931",
          8: "#F7E26B",
          9: "#2F484E",
          A: "#44891A",
          B: "#A3CE27",
          C: "#1B2632",
          D: "#005784",
          E: "#31A2F2",
          F: "#B2DCEF",
        },
      });

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

      const islandShader = addEntity(this.world);
      addComponent(this.world, GameObject, islandShader);
      addComponent(this.world, Shader, islandShader);
      addComponent(this.world, Position, islandShader);
      addComponent(this.world, Rotation, islandShader);
      addComponent(this.world, Scale, islandShader);
      addComponent(this.world, Velocity, islandShader);
      addComponent(this.world, Texture, islandShader);
      addComponent(this.world, ScrollFactor, islandShader);
      addComponent(this.world, Anchor, islandShader);
      // Anchor.x[islandShader] = 0.5;
      // Anchor.y[islandShader] = 0.5;
      Position.x[islandShader] = 0;
      Position.y[islandShader] = 0;

      Position.z[islandShader] = -2;
      Scale.x[islandShader] = 16 / 16;
      Scale.y[islandShader] = 16 / 16;
      // setInterval(() => {
      //   Scale.x[islandShader] = 1 / this.cameras.main.zoom;
      //   Scale.y[islandShader] = 1 / this.cameras.main.zoom;
      // }, 1);
      Rotation.angle[islandShader] = 0;
      ScrollFactor.x[islandShader] = 0;
      ScrollFactor.y[islandShader] = 0;
      Shader.width[islandShader] = textureData[0].length * 16;
      Shader.height[islandShader] = textureData.length * 16;

      const rt = addEntity(this.world);
      addComponent(this.world, GameObject, rt);
      addComponent(this.world, Position, rt);
      addComponent(this.world, RenderTexture, rt);
      this.cameras.main.setBounds(-8192, -8192, 16384, 16384);
      Position.x[rt] = 1;
      Position.y[rt] = 1;
      RenderTexture.width[rt] = textureData[0].length * 16;
      RenderTexture.height[rt] = textureData.length * 16;

      saveToTextures.set(rt, "renderTex");
      GameObject.renderTexture[islandShader] = rt;
      // console.log("rt", islandShader, rt);
      shaderData.set(islandShader, {
        key: "island",
        fragmentShader: island,
        uniforms: {
          tex: { type: "sampler2D", value: "sparseMap" },
          camera_position: {
            type: "2f",
            value: { x: 0, y: 0 },
          },
          camera_zoom: {
            type: "1f",
            value: 1.0,
          },
        },
      });

      setTimeout(() => {
        const islandShaderItem = gameObjects.get(
          islandShader
        ) as Phaser.GameObjects.Shader;
        // islandShaderItem.visible = false;
        // console.log(
        //   islandShaderItem.displayWidth,
        //   islandShaderItem.displayHeight
        // );
        // this.game.config.width = 800;
        // islandShaderItem.width = textureData[0].length * 16;
        // islandShaderItem.height = textureData.length * 16;
        // this.cameras.main.centerOn(islandShaderItem.x, islandShaderItem.y);
        islandShaderItem.setRenderToTexture("islandTex", true);
        // islandShaderItem.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
        textures.set(islandShader, "islandTex");

        let grassShader = addEntity(this.world);
        addComponent(this.world, GameObject, grassShader);
        addComponent(this.world, Shader, grassShader);
        addComponent(this.world, Position, grassShader);
        addComponent(this.world, Position, grassShader);
        addComponent(this.world, Rotation, grassShader);
        addComponent(this.world, Scale, grassShader);
        addComponent(this.world, Velocity, grassShader);
        // addComponent(this.world, Texture, grassShader);
        addComponent(this.world, ScrollFactor, grassShader);
        addComponent(this.world, Anchor, grassShader);
        Anchor.x[grassShader] = 0;
        Anchor.y[grassShader] = 0;
        Position.x[grassShader] = 0;
        Position.y[grassShader] = 0;
        // this.cameras.main.centerOn(
        //   Position.x[grassShader] * TILE_WIDTH,
        //   Position.y[grassShader] * TILE_HEIGHT
        // );
        // this.input.on("pointermove", (pointer) => {
        //   Position.x[grassShader] =
        //     pointer.x / 16 - this.cameras.main.width / 2 / 16;
        //   Position.y[grassShader] =
        //     pointer.y / 16 - this.cameras.main.height / 2 / 16;

        //   this.cameras.main.centerOn(
        //     Position.x[grassShader] * TILE_WIDTH,
        //     Position.y[grassShader] * TILE_HEIGHT
        //   );
        // });
        Position.z[grassShader] = -1;
        Scale.x[islandShader] = 1;
        Scale.y[islandShader] = -1;
        // setInterval(() => {
        //   // Scale.x[grassShader] = 1 / this.cameras.main.zoom;
        //   // Scale.y[grassShader] = 1 / this.cameras.main.zoom;
        // }, 1);
        // Rotation.angle[grassShader] = 0;
        ScrollFactor.x[grassShader] = 1;
        ScrollFactor.y[grassShader] = 1;
        Shader.width[grassShader] = textureData[0].length * 16;
        Shader.height[grassShader] = textureData.length * 16;
        shaderData.set(grassShader, {
          key: "grassy",
          fragmentShader: grass,
          uniforms: {
            resolution: {
              type: "2f",
              value: {
                x: this.cameras.main.width,
                y: this.cameras.main.height,
              },
            },
            wind_speed: { type: "1f", value: 0.01 },
            gradient: { type: "sampler2D", value: "gradient" },
            tex: { type: "sampler2D", value: "renderTex" },
            noise_tex: { type: "sampler2D", value: "noise" },
            cloud_tex: { type: "sampler2D", value: "clouds" },
            wind_direction: { type: "2f", value: { x: 1.0, y: -1.0 } },
            tip_color: {
              type: "4f",
              // value: { x: 0.996078, y: 0.976471, z: 0.517647, w: 1.0 },
              value: { x: 127 / 255, y: 180 / 255, z: 100 / 255, w: 1.0 },
            },
            wind_color: {
              type: "4f",
              // value: { x: 1.0, y: 0.984314, z: 0.639216, w: 1.0 },
              value: { x: 129 / 255, y: 178 / 255, z: 100 / 255, w: 1.0 },
            },
            noise_tex_size: { type: "2f", value: { x: 50.0, y: 1.0 } },
            camera_position: {
              type: "2f",
              value: { x: 0, y: 0 },
            },
            camera_zoom: {
              type: "1f",
              value: 1.0,
            },
          },
        });

        const foamShader = addEntity(this.world);
        addComponent(this.world, GameObject, foamShader);
        addComponent(this.world, Shader, foamShader);
        addComponent(this.world, Position, foamShader);
        addComponent(this.world, ScrollFactor, foamShader);
        addComponent(this.world, Anchor, foamShader);
        Anchor.x[foamShader] = 0;
        Anchor.y[foamShader] = 0;
        Position.x[foamShader] = 0;
        Position.y[foamShader] = 0;
        Position.z[foamShader] = -2;
        ScrollFactor.x[foamShader] = 1;
        ScrollFactor.y[foamShader] = 1;
        Shader.width[foamShader] = textureData[0].length * TILE_WIDTH;
        Shader.height[foamShader] = textureData.length * TILE_HEIGHT;
        shaderData.set(foamShader, {
          key: "foam",
          fragmentShader: foam,
          uniforms: {
            tex: { type: "sampler2D", value: "renderTex" },
            camera_position: {
              type: "2f",
              value: { x: 0, y: 0 },
            },
            camera_zoom: {
              type: "1f",
              value: 1.0,
            },
          },
        });
        this.tweens.add({
          targets: this.cameras.main,
          zoom: 3.5,
          duration: 20,
          delay: 20,
          ease: Phaser.Math.Easing.Quadratic.InOut,
        });
      }, 1000);
      world.map = tileData;

      this.player = buildPlayerEntity(startX, startY, 3, world);
      this.cameras.main.centerOn(
        Position.x[this.player] * TILE_WIDTH,
        Position.y[this.player] * TILE_HEIGHT
      );

      while (positions.length < 1) {
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
    }, 0);
  }

  update(time: number, delta: number) {
    this.pipeline(this.world);
    // (
    //   this.renderer as Phaser.Renderer.WebGL.WebGLRenderer
    // ).currentScissorEnabled = true;
    // console.log(
    //   (this.renderer as Phaser.Renderer.WebGL.WebGLRenderer).currentScissor
    // );
    // // this.cameras.main.setViewport(0, 0, 8192, 8192);
    // (this.renderer as Phaser.Renderer.WebGL.WebGLRenderer).setFramebuffer(
    //   (this.renderer as Phaser.Renderer.WebGL.WebGLRenderer).currentFramebuffer,
    //   true
    // );
    (this.renderer as Phaser.Renderer.WebGL.WebGLRenderer).setScissor(
      0,
      0,
      16384,
      16384
    );
    // console.log(
    //   (this.renderer as Phaser.Renderer.WebGL.WebGLRenderer).currentScissor
    // );

    this.world.currentCamera = this.cameras.main;
    if (this.input.keyboard?.checkDown(this.input.keyboard.addKey("R"), 500)) {
      this.scene.restart();
    }

    if (this.input.keyboard?.checkDown(this.input.keyboard.addKey("One"), 5)) {
      this.cameras.main.setZoom(0.1);
    }

    if (this.input.keyboard?.checkDown(this.input.keyboard.addKey("Two"), 5)) {
      this.cameras.main.setZoom(0.2);
    }

    if (
      this.input.keyboard?.checkDown(this.input.keyboard.addKey("Three"), 5)
    ) {
      this.cameras.main.setZoom(0.3);
    }

    if (this.input.keyboard?.checkDown(this.input.keyboard.addKey("Four"), 5)) {
      this.cameras.main.setZoom(0.4);
    }

    if (this.input.keyboard?.checkDown(this.input.keyboard.addKey("Five"), 5)) {
      this.cameras.main.setZoom(0.5);
    }

    if (this.input.keyboard?.checkDown(this.input.keyboard.addKey("Six"), 5)) {
      this.cameras.main.setZoom(0.6);
    }

    if (
      this.input.keyboard?.checkDown(this.input.keyboard.addKey("Seven"), 5)
    ) {
      this.cameras.main.setZoom(0.7);
    }

    if (
      this.input.keyboard?.checkDown(this.input.keyboard.addKey("Eight"), 5)
    ) {
      this.cameras.main.setZoom(0.8);
    }

    if (this.input.keyboard?.checkDown(this.input.keyboard.addKey("Nine"), 5)) {
      this.cameras.main.setZoom(0.9);
    }

    if (this.input.keyboard?.checkDown(this.input.keyboard.addKey("Zero"), 5)) {
      this.cameras.main.setZoom(1);
    }
  }
}
