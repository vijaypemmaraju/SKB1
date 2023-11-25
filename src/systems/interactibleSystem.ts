import {
  addComponent,
  addEntity,
  defineQuery,
  enterQuery,
  exitQuery,
  hasComponent,
  removeComponent,
  removeEntity,
} from "bitecs";
import World from "../World";
import gameObjects from "../resources/gameObjects";
import GameObject from "../components/GameObject";
import game from "../game";
import Anchor from "../components/Anchor";
import Shader from "../components/Shader";
import shaderData from "../resources/shaderData";
import Position from "../components/Position";
import ScrollFactor from "../components/ScrollFactor";
import Input from "../components/Input";
import Sprite from "../components/Sprite";
import Interactible, { InteractibleType } from "../components/Interactible";
import Rotation from "../components/Rotation";
import Texture from "../components/Texture";
import Velocity from "../components/Velocity";
import Scale from "../components/Scale";
import textures from "../resources/textures";
import Destination from "../components/Destination";
import Pushable from "../components/Pushable";

const spriteQuery = defineQuery([Position, Input, Sprite]);

const interactibleQuery = defineQuery([Position, Interactible, GameObject]);

const interactibleSystem = (world: World) => {
  const player = spriteQuery(world)[0];

  if (!player) {
    return world;
  }

  const interactibles = interactibleQuery(world);

  const availableInteractibles = interactibles;

  const interaciblesWithinRange = availableInteractibles.filter((eid) => {
    const distance = Math.sqrt(
      Math.pow(Position.x[eid] - Position.x[player], 2) +
        Math.pow(Position.y[eid] - Position.y[player], 2)
    );
    return distance < 2;
  });
  const closestInteractible = interaciblesWithinRange.reduce(
    (closest, current) => {
      const closestDistance = Math.sqrt(
        Math.pow(Position.x[closest] - Position.x[player], 2) +
          Math.pow(Position.y[closest] - Position.y[player], 2)
      );
      const currentDistance = Math.sqrt(
        Math.pow(Position.x[current] - Position.x[player], 2) +
          Math.pow(Position.y[current] - Position.y[player], 2)
      );
      if (currentDistance < closestDistance) {
        return current;
      }
      return closest;
    },
    interaciblesWithinRange[0]
  );
  const z = game.scene.scenes[0].input.keyboard?.addKey("z");

  // console.log(closestInteractible);
  if (closestInteractible) {
    if (!Interactible.cursor[closestInteractible] && !z?.isDown) {
      const eid = addEntity(world);
      addComponent(world, Position, eid);
      addComponent(world, Velocity, eid);
      addComponent(world, Rotation, eid);
      addComponent(world, Scale, eid);
      addComponent(world, GameObject, eid);
      addComponent(world, Sprite, eid);
      addComponent(world, Texture, eid);
      addComponent(world, Destination, eid);
      const x = Position.x[closestInteractible];
      const y = Position.y[closestInteractible];
      const z = Position.z[closestInteractible];
      Position.x[eid] = x;
      Position.y[eid] = y;
      Position.z[eid] = z;
      Destination.x[eid] = x;
      Destination.y[eid] = y - 1;
      Velocity.x[eid] = 0;
      Velocity.y[eid] = 0;
      Rotation.angle[eid] = 0;
      Scale.x[eid] = 1;
      Scale.y[eid] = 1;
      Velocity.x[eid] = 0;
      Velocity.y[eid] = 0;
      // Sprite.anchor[eid] = 0.5;
      Texture.frame[eid] = 0;
      textures.set(eid, "sheet");
      Interactible.cursor[closestInteractible] = eid;
    } else {
      if (game.scene.scenes[0].input.keyboard?.checkDown(z!)) {
        if (
          Interactible.type[closestInteractible] ===
            InteractibleType.Pushable &&
          !hasComponent(world, Pushable, closestInteractible)
        ) {
          removeEntity(world, Interactible.cursor[closestInteractible]);
          Interactible.cursor[closestInteractible] = 0;
          Interactible.interacting[closestInteractible] = 0;

          addComponent(world, Pushable, closestInteractible);
          Pushable.distanceFromPlayerX[closestInteractible] = Math.round(
            Position.x[closestInteractible] - Position.x[player]
          );
          Pushable.distanceFromPlayerY[closestInteractible] = Math.round(
            Position.y[closestInteractible] - Position.y[player]
          );

          Interactible.interacting[closestInteractible] = 1;
          const adjacentPoints = [
            {
              x: Position.x[closestInteractible],
              y: Position.y[closestInteractible] - 1,
            },
            {
              x: Position.x[closestInteractible],
              y: Position.y[closestInteractible] + 1,
            },
            {
              x: Position.x[closestInteractible] - 1,
              y: Position.y[closestInteractible],
            },
            {
              x: Position.x[closestInteractible] + 1,
              y: Position.y[closestInteractible],
            },
          ];
          const playerCenter = {
            x: Position.x[player] + 0.5,
            y: Position.y[player] + 0.5,
          };
          const closestPointToPlayer = adjacentPoints.reduce(
            (closest, current) => {
              const closestDistance = Math.sqrt(
                Math.pow(closest.x - playerCenter.x, 2) +
                  Math.pow(closest.y - playerCenter.y, 2)
              );
              const currentDistance = Math.sqrt(
                Math.pow(current.x - playerCenter.x, 2) +
                  Math.pow(current.y - playerCenter.y, 2)
              );
              if (currentDistance < closestDistance) {
                return current;
              }
              return closest;
            },
            adjacentPoints[0]
          );
          // console.log(closestPointToPlayer);
          Destination.x[player] = closestPointToPlayer.x;
          Destination.y[player] = closestPointToPlayer.y;
        }
      } else {
        removeComponent(world, Pushable, closestInteractible);
        const sprite = gameObjects.get(
          closestInteractible
        ) as Phaser.GameObjects.Sprite;
        sprite.setTint(0xffffff);
        Interactible.interacting[closestInteractible] = 0;
      }
    }
  } else {
    interactibles.forEach((eid) => {
      removeEntity(world, Interactible.cursor[eid]);
      Interactible.cursor[eid] = 0;
      Interactible.interacting[eid] = 0;
    });
  }

  return world;
};

export default interactibleSystem;
