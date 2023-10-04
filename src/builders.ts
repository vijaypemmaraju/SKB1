import { addEntity, addComponent } from "bitecs";
import World from "./World";
import Collidable from "./components/Colllidable";
import Destination from "./components/Destination";
import Position from "./components/Position";
import Pushable from "./components/Pushable";
import Rotation from "./components/Rotation";
import Sprite from "./components/Sprite";
import Texture from "./components/Texture";
import Velocity from "./components/Velocity";
import textures from "./resources/textures";
import Scale from "./components/Scale";
import Icy from "./components/Icy";
import Input from "./components/Input";

export const buildBaseEntity = (
  x: number,
  y: number,
  frame: number,
  world: World
): number => {
  const eid = addEntity(world);
  addComponent(world, Position, eid);
  addComponent(world, Velocity, eid);
  addComponent(world, Rotation, eid);
  addComponent(world, Scale, eid);
  addComponent(world, Sprite, eid);
  addComponent(world, Texture, eid);
  addComponent(world, Velocity, eid);
  Position.x[eid] = x;
  Position.y[eid] = y;
  Destination.x[eid] = x;
  Destination.y[eid] = y;
  Velocity.x[eid] = 0;
  Velocity.y[eid] = 0;
  Rotation.angle[eid] = 0;
  Scale.x[eid] = 1;
  Scale.y[eid] = 1;
  Velocity.x[eid] = 0;
  Velocity.y[eid] = 0;
  Sprite.anchor[eid] = 0.5;
  Texture.frame[eid] = frame;
  textures.set(eid, "sheet");

  return eid;
};

export const buildIcyTileEntity = (
  x: number,
  y: number,
  frame: number,
  world: World
): number => {
  const eid = buildBaseEntity(x, y, frame, world);
  addComponent(world, Icy, eid);
  return eid;
};

export const buildPushableBlockEntity = (
  x: number,
  y: number,
  frame: number,
  world: World
): number => {
  const eid = buildBaseEntity(x, y, frame, world);
  addComponent(world, Destination, eid);
  addComponent(world, Collidable, eid);
  addComponent(world, Pushable, eid);
  return eid;
};

export const buildPlayerEntity = (
  x: number,
  y: number,
  frame: number,
  world: World
): number => {
  const eid = buildBaseEntity(x, y, frame, world);
  addComponent(world, Collidable, eid);
  addComponent(world, Destination, eid);
  addComponent(world, Input, eid);
  return eid;
};
