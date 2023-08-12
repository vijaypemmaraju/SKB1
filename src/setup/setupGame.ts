import { addEntity, addComponent } from "bitecs";
import World from "../World";
import app from "../app";
import Position from "../components/Position";
import Rotation from "../components/Rotation";
import Scale from "../components/Scale";
import Velocity from "../components/Velocity";
import sprites from "../resources/sprites";
import { Sprite } from "pixi.js";

const setupGame = (world: World) => {
  const eid = addEntity(world);
  addComponent(world, Position, eid);
  addComponent(world, Velocity, eid);
  addComponent(world, Rotation, eid);
  addComponent(world, Scale, eid);
  Position.x[eid] = app.screen.width / 2;
  Position.y[eid] = app.screen.height / 2;
  Velocity.x[eid] = 1.23;
  Velocity.y[eid] = 1.23;
  Scale.x[eid] = 1;
  Scale.y[eid] = 1;

  document.body.appendChild(app.view as HTMLCanvasElement);

  const bunny = Sprite.from("https://pixijs.com/assets/bunny.png");

  bunny.anchor.set(0.5);

  app.stage.addChild(bunny);

  sprites.set(eid, bunny);
};

export default setupGame;
