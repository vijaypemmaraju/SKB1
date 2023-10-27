import { defineQuery } from "bitecs";
import World from "../World";
import CameraTarget from "../components/CameraTarget";
import Position from "../components/Position";
import Sprite from "../components/Sprite";
import sprites from "../resources/sprites";
import Input from "../components/Input";
import CameraPointOfInterest from "../components/CameraPointOfInterest";

const cameraPointOfInterest = defineQuery([CameraPointOfInterest, Sprite]);
const playerQuery = defineQuery([CameraTarget, Sprite, Input]);

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
      .map((eid) => sprites.get(eid))
      .filter(Boolean) as Phaser.GameObjects.Sprite[]
  );

  if (visiblePointsOfInterest.length === 0) {
    visiblePointsOfInterest = [
      sprites.get(playerEid) as Phaser.GameObjects.Sprite,
    ];
  }

  const averagePosition = visiblePointsOfInterest.reduce(
    (acc, sprite) => {
      acc.x += sprite.x;
      acc.y += sprite.y;
      return acc;
    },
    { x: 0, y: 0 }
  );

  averagePosition.x /= visiblePointsOfInterest.length;
  averagePosition.y /= visiblePointsOfInterest.length;

  const player = sprites.get(playerEid) as Phaser.GameObjects.Sprite;

  const destinationX =
    0.8 * player.x + 0.2 * averagePosition.x - camera.width / 2;
  const destinationY =
    0.8 * player.y + 0.2 * averagePosition.y - camera.height / 2;

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

  secondaryCamera.scrollX = destinationX;
  secondaryCamera.scrollY = destinationY;
  return world;
};

export default cameraSystem;
