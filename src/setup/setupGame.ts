import { addEntity, addComponent } from "bitecs";
import World from "../World";
import app from "../app";
import Position from "../components/Position";
import Rotation from "../components/Rotation";
import Scale from "../components/Scale";
import Velocity from "../components/Velocity";
import Texture from "../components/Texture";
import { texturePaths } from "../resources/textures";
import Sprite from "../components/Sprite";

const setupGame = (world: World) => {
  // null entity
  addEntity(world);

  const eid = addEntity(world);
  addComponent(world, Position, eid);
  addComponent(world, Velocity, eid);
  addComponent(world, Rotation, eid);
  addComponent(world, Scale, eid);
  addComponent(world, Sprite, eid);

  texturePaths.set(eid, "https://pixijs.com/assets/bunny.png");
  addComponent(world, Texture, eid);
  Position.x[eid] = app.screen.width / 2;
  Position.y[eid] = app.screen.height / 2;
  Velocity.x[eid] = 1.23;
  Velocity.y[eid] = 1.23;
  Scale.x[eid] = 1;
  Scale.y[eid] = 1;
  Sprite.anchor[eid] = 0.5;
};

export default setupGame;
