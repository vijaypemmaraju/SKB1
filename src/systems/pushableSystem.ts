import { defineQuery } from "bitecs";
import World from "../World";
import Position from "../components/Position";
import Rotation from "../components/Rotation";
import Scale from "../components/Scale";
import Velocity from "../components/Velocity";
import Pushable from "../components/Pushable";
import Input from "../components/Input";
import gameObjects from "../resources/gameObjects";

const movementQuery = defineQuery([Pushable, Position]);
const playerQuery = defineQuery([Position, Input]);

const pushableSystem = (world: World) => {
  const ents = movementQuery(world);
  const player = playerQuery(world)[0];
  if (!player) {
    return world;
  }

  const entsNextToPlayer = ents.filter((eid) => {
    return (
      (Math.abs(Position.x[player] - Position.x[eid]) == 1 &&
        Math.abs(Position.y[player] - Position.y[eid]) == 0) ||
      (Math.abs(Position.x[player] - Position.x[eid]) == 0 &&
        Math.abs(Position.y[player] - Position.y[eid]) == 1)
    );
  });

  const entsNotNextToPlayer = ents.filter((eid) => {
    return entsNextToPlayer.indexOf(eid) === -1;
  });

  const relevantSpritesNextToPlayer = entsNextToPlayer
    .map((eid) => gameObjects.get(eid))
    .filter(Boolean) as Phaser.GameObjects.Sprite[];

  const relevantSpritesNotNextToPlayer = entsNotNextToPlayer
    .map((eid) => gameObjects.get(eid))
    .filter(Boolean) as Phaser.GameObjects.Sprite[];

  relevantSpritesNextToPlayer.forEach((sprite) => {
    sprite.setTint(0xff0000);
  });

  relevantSpritesNotNextToPlayer.forEach((sprite) => {
    sprite.clearTint();
  });

  const playerSprite = gameObjects.get(player) as Phaser.GameObjects.Sprite;

  return world;
};

export default pushableSystem;
