import { union } from "martinez-polygon-clipping";
import { addComponent, addEntity, createWorld, pipe } from "bitecs";
import { Scene } from "phaser";
import World from "../World";
import * as marchingsquares from "marchingsquares";
import { mergePolygonsByDistance } from "merge-polygons";
import {
  NodeType,
  LinkType,
  GROUP_NODE_SIZES,
  GROUP_COLORS,
} from "../graphGenerator";
import useStore from "../useStore";
import { Delaunay } from "d3-delaunay";
import Offset from "polygon-offset";
import * as turf from "@turf/turf";
import { buildBaseEntity } from "../builders";
import PolygonMerger from "../PolygonMerger";
import simplify from "simplify-js";
import { Geom } from "polygon-clipping";
import Anchor from "../components/Anchor";
import GameObject from "../components/GameObject";
import Position from "../components/Position";
import ScrollFactor from "../components/ScrollFactor";
import Shader from "../components/Shader";
import shaderData from "../resources/shaderData";
import water from "../resources/shaders/water";
import timeSystem from "../systems/timeSystem";
import cameraSystem from "../systems/cameraSystem";
import conditionalDestroySystem from "../systems/conditionalDestroySystem";
import destinationSystem from "../systems/destinationSystem";
import gameObjectRenderingSystem from "../systems/gameObjectRenderingSystem";
import goalSystem from "../systems/goalSystem";
import inputSystem from "../systems/inputSystem";
import interactibleSystem from "../systems/interactibleSystem";
import mapMovementSystem from "../systems/mapMovementSystem";
import movementSystem from "../systems/movementSystem";
import pushableSystem from "../systems/pushableSystem";
import renderTextureSystem from "../systems/renderTextureSystem";
import shaderSystem from "../systems/shaderSystem";
import spriteAnimationSystem from "../systems/spriteAnimationSystem";
import spriteFramingSystem from "../systems/spriteFramingSystem";
import spriteSystem from "../systems/spriteSystem";
import Scale from "../components/Scale";

export default class Main2 extends Scene {
  world: World;
  pipeline!: (world: World) => void;
  player: Phaser.GameObjects.Arc;
  polygons: number[][][];
  island: number[][];

  constructor() {
    super({ key: "Main2" });
    this.world = createWorld<World>();
  }

  preload() {
    this.load.image("grass", "grass1.png");
  }

  create() {
    const nullEntity = addEntity(this.world);

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

    this.world.currentCamera = this.cameras.main;
    this.world.time = { delta: 0, elapsed: 0, then: 0 };

    let entities: Phaser.GameObjects.GameObject[] = [];

    // zoom on scroll
    this.input.on("wheel", (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
      const zoom = this.cameras.main.zoom;
      this.cameras.main.zoom = Phaser.Math.Clamp(
        zoom - deltaY * 0.001,
        0.01,
        2
      );
    });

    // drag to pan
    let lastX = 0;
    let lastY = 0;
    let dragging = false;
    this.input.on("pointerdown", (pointer) => {
      lastX = pointer.x;
      lastY = pointer.y;
      dragging = true;
    });

    this.input.on("pointerup", () => {
      dragging = false;
    });

    this.input.on("pointermove", (pointer) => {
      if (dragging) {
        const dx = pointer.x - lastX;
        const dy = pointer.y - lastY;
        lastX = pointer.x;
        lastY = pointer.y;
        this.cameras.main.scrollX -= dx;
        this.cameras.main.scrollY -= dy;
      }
    });

    setTimeout(async () => {
      const graph = useStore.getState().forceGraphInstance;
      const data = graph?.graphData();
      const lowestX = Math.min(
        ...(data?.nodes.map((n) => (n as NodeType).x!) || [])
      );
      const lowestY = Math.min(
        ...(data?.nodes.map((n) => (n as NodeType).y!) || [])
      );
      const scaleMultiplier = 0.125;

      const centerOfScreen = {
        x: 0,
        y: 0,
      };

      const movedData = {
        nodes: data?.nodes.map((n) => ({
          ...n,
          x:
            ((n as NodeType).x! - lowestX) / scaleMultiplier + centerOfScreen.x,
          y:
            ((n as NodeType).y! - lowestY) / scaleMultiplier + centerOfScreen.y,
        })),
        links: data?.links.map(
          (l) =>
            ({
              ...l,
              source: {
                ...(l.source as NodeType),
                x:
                  ((l.source as NodeType).x! - lowestX) / scaleMultiplier +
                  centerOfScreen.x,
                y:
                  ((l.source as NodeType).y! - lowestY) / scaleMultiplier +
                  centerOfScreen.y,
              },
              target: {
                ...(l.target as NodeType),
                x:
                  ((l.target as NodeType).x! - lowestX) / scaleMultiplier +
                  centerOfScreen.x,
                y:
                  ((l.target as NodeType).y! - lowestY) / scaleMultiplier +
                  centerOfScreen.y,
              },
              __controlPoints: (l as any).__controlPoints
                ? [
                    ((l as any).__controlPoints[0] - lowestX) /
                      scaleMultiplier +
                      centerOfScreen.x,
                    ((l as any).__controlPoints[1] - lowestY) /
                      scaleMultiplier +
                      centerOfScreen.y,
                  ]
                : undefined,
            } as LinkType)
        ),
      };

      const midpoint = movedData.nodes!.reduce(
        (acc, n) => {
          acc.x += n.x!;
          acc.y += n.y!;
          return acc;
        },
        { x: 0, y: 0 }
      );

      midpoint.x /= movedData.nodes!.length;
      midpoint.y /= movedData.nodes!.length;

      this.cameras.main.centerOn(midpoint.x, midpoint.y);
      this.cameras.main.zoom = 0.05;
      const points = movedData.nodes!.map((n) => [n.x, n.y]) as [
        number,
        number
      ][];

      movedData.nodes?.forEach((n) => {
        entities.push(
          this.add
            .circle(
              n.x!,
              n.y!,
              GROUP_NODE_SIZES[(n as NodeType).group] / scaleMultiplier,
              Number(GROUP_COLORS[(n as NodeType).group].replace("#", "0x"))
            )
            .setDepth(2)
        );
      });

      for (const n of movedData?.nodes || []) {
        const y = Math.floor(n.y);
        const x = Math.floor(n.x);
        for (
          let radius = 0;
          radius < GROUP_NODE_SIZES[(n as NodeType).group];
          radius++
        ) {
          for (let angle = 0; angle < 360; angle += 60) {
            const dx = Math.floor(Math.cos(angle) * radius);
            const dy = Math.floor(Math.sin(angle) * radius);
            entities.push(this.add.circle(x + dx, y + dy, 0xff0000));
            // points.push([x + dx, y + dy]);
          }
        }
      }

      let polygons = [];

      for (const l of movedData?.links || []) {
        const startX = Math.floor((l.source as NodeType).x!);
        const startY = Math.floor((l.source as NodeType).y!);
        const endX = Math.floor((l.target as NodeType).x!);
        const endY = Math.floor((l.target as NodeType).y!);

        // integer step from start to end

        const slope = (endY - startY) / (endX - startX);

        const bezier = new Phaser.Curves.QuadraticBezier(
          new Phaser.Math.Vector2(startX, startY),
          (l as any).__controlPoints
            ? new Phaser.Math.Vector2(
                (l as any).__controlPoints[0],
                (l as any).__controlPoints[1]
              )
            : new Phaser.Math.Vector2(startX, startY),
          new Phaser.Math.Vector2(endX, endY)
        );

        const bPoints = bezier.getDistancePoints(128);
        const ppoints = bPoints.map((p) => [p.x, p.y]);
        // entities.push(this.add.polygon(0, 0, bPoints, 0xff0000).setDepth(1));
        for (const p of bPoints) {
          entities.push(
            this.add.circle(p.x, p.y, 4 / scaleMultiplier, 0x353535).setDepth(1)
          );
        }

        const graphics = this.add.graphics();
        const line = new Offset().data(ppoints).offsetLine(320).flat();
        polygons.push(line);
      }
      console.log("polygons", polygons);
      polygons = polygons.map((poly) => {
        return simplify(poly.map((p) => ({ x: p[0], y: p[1] }))).map((p) => [
          p.x,
          p.y,
        ]);
      });
      let merged = new PolygonMerger(polygons as Geom).mergePolygons();
      merged = new PolygonMerger(merged[0] as Geom).mergePolygons();

      console.log("merged", merged, merged.length);

      await new Promise((resolve) => setTimeout(resolve, 1000));
      entities.forEach((e) => e.destroy());

      // this.add.polygon(0, 0, merged, 0xff0000).setOrigin(0, 0).setDepth(1);
      this.island = merged[0].flat();
      const polygon = this.add
        .polygon(0, 0, this.island, 0x00ff00)
        .setOrigin(0, 0);
      // polygons.forEach((p) => {
      //   this.add.polygon(0, 0, p, 0x00ff00).setOrigin(0, 0);
      // });

      this.polygons = polygons;
      const root = movedData.nodes?.find(
        (node) => (node as NodeType).group === "ROOT"
      );
      const player = this.add.circle(root?.x, root?.y, 15, 0xff0000);
      player.setDepth(2);
      // player.visible = false;

      this.player = player;
      this.cameras.main.startFollow(player, true, 0.05, 0.05);
      this.cameras.main.setZoom(1);

      const waterShader = addEntity(this.world);
      addComponent(this.world, GameObject, waterShader);
      addComponent(this.world, Shader, waterShader);
      addComponent(this.world, Position, waterShader);
      addComponent(this.world, ScrollFactor, waterShader);
      addComponent(this.world, Anchor, waterShader);
      Anchor.x[waterShader] = 0;
      Anchor.y[waterShader] = 0;
      Position.x[waterShader] = -16384;
      Position.y[waterShader] = -16384;
      Position.z[waterShader] = -3;
      ScrollFactor.x[waterShader] = 1;
      ScrollFactor.y[waterShader] = 1;
      Shader.width[waterShader] = 81920;
      Shader.height[waterShader] = 81920;
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
    }, 0);
  }

  update(time: number, delta: number) {
    this.pipeline(this.world);

    const player = this.player;
    if (player) {
      const speed = 1;
      const velocity = {
        x: 0,
        y: 0,
      };
      if (this.input.keyboard?.addKey("W").isDown) {
        velocity.y -= speed * delta;
      }
      if (this.input.keyboard?.addKey("S").isDown) {
        velocity.y += speed * delta;
      }
      if (this.input.keyboard?.addKey("A").isDown) {
        velocity.x -= speed * delta;
      }
      if (this.input.keyboard?.addKey("D").isDown) {
        velocity.x += speed * delta;
      }

      for (let i = 0; i < this.island.length - 1; i++) {
        const start = {
          x: this.island[i][0],
          y: this.island[i][1],
        };
        const end = {
          x: this.island[i + 1][0],
          y: this.island[i + 1][1],
        };

        const ray = {
          start: { x: player.x, y: player.y },
          end: { x: player.x + velocity.x, y: player.y + velocity.y },
        };

        const intersection = Phaser.Geom.Intersects.GetLineToLine(
          new Phaser.Geom.Line(ray.start.x, ray.start.y, ray.end.x, ray.end.y),
          new Phaser.Geom.Line(start.x, start.y, end.x, end.y)
        );

        if (intersection) {
          // project player velocity onto the line
          const vector = new Phaser.Math.Vector2(velocity.x, velocity.y);
          const line = new Phaser.Math.Vector2(
            end.x - start.x,
            end.y - start.y
          );
          const projected = vector.project(line);
          velocity.x = projected.x;
          velocity.y = projected.y;
        }
      }

      // check if player is in water
      const islandPolygon = new Phaser.Geom.Polygon(this.island);
      if (!islandPolygon.contains(player.x, player.y)) {
        // find the closest point on the polygon to the player
        const rays = Phaser.Geom.Intersects.GetRaysFromPointToPolygon(
          player.x,
          player.y,
          islandPolygon
        );

        // find the closest point on the polygon to the player
        const closest = rays.reduce(
          (closest, ray) => {
            const distance = Phaser.Math.Distance.BetweenPoints(
              player,
              new Phaser.Math.Vector2(ray.x, ray.y)
            );
            return distance < closest.distance ? { ray, distance } : closest;
          },
          { ray: rays[0], distance: Infinity }
        );
        player.x = closest.ray.x;
        player.y = closest.ray.y;
      }

      player.x += velocity.x;
      player.y += velocity.y;
    }
  }
}
