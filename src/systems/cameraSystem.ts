import { defineQuery } from "bitecs";
import World from "../World";
import CameraTarget from "../components/CameraTarget";
import Position from "../components/Position";
import GameObject from "../components/GameObject";
import gameObjects from "../resources/gameObjects";
import Input from "../components/Input";
import CameraPointOfInterest from "../components/CameraPointOfInterest";

const cameraPointOfInterest = defineQuery([CameraPointOfInterest, GameObject]);
const playerQuery = defineQuery([CameraTarget, GameObject, Input]);

const cameraSystem = (world: World) => {
  const ents = cameraPointOfInterest(world);
  const playerEid = playerQuery(world)[0];

  if (ents.length === 0 && !playerEid) {
    return world;
  }

  const camera = world.currentCamera;
  const secondaryCamera = world.secondaryCamera;

  let visiblePointsOfInterest = camera.cull(
    ents
      .map((eid) => gameObjects.get(eid))
      .filter(Boolean) as Phaser.GameObjects.Sprite[]
  );

  if (visiblePointsOfInterest.length === 0) {
    visiblePointsOfInterest = [
      gameObjects.get(playerEid) as Phaser.GameObjects.Sprite,
    ];
  }

  const averagePosition = visiblePointsOfInterest.reduce(
    (acc, sprite) => {
      const center = sprite.getCenter();
      if (!center.x || !center.y) {
        return acc;
      }
      acc.x += center.x;
      acc.y += center.y;
      return acc;
    },
    { x: 0, y: 0 }
  );

  averagePosition.x /= visiblePointsOfInterest.length;
  averagePosition.y /= visiblePointsOfInterest.length;

  const player = gameObjects.get(playerEid) as Phaser.GameObjects.Sprite;
  const center = player.getCenter();

  const destinationX =
    0.8 * center.x! + 0.2 * averagePosition.x - camera.width / 2;
  const destinationY =
    0.8 * center.y! + 0.2 * averagePosition.y - camera.height / 2;

  const velocity = {
    x: destinationX - camera.scrollX,
    y: destinationY - camera.scrollY,
  };

  const magnitude = Math.sqrt(
    velocity.x * velocity.x + velocity.y * velocity.y
  );

  // velocity.x = magnitude;
  // velocity.y = magnitude;

  const speed = 2;

  camera.scrollX += velocity.x * speed * world.time.delta;
  camera.scrollY += velocity.y * speed * world.time.delta;

  camera.scrollX = Math.floor(camera.scrollX);
  camera.scrollY = Math.floor(camera.scrollY);

  secondaryCamera.scrollX = destinationX;
  secondaryCamera.scrollY = destinationY;
  return world;
};

export default cameraSystem;
