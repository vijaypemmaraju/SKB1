import "./style.css";
import * as PIXI from "pixi.js";
import {
  createWorld,
  defineQuery,
  addEntity,
  addComponent,
  pipe,
  IWorld,
} from "bitecs";
import Position from "./components/Position";
import Velocity from "./components/Velocity";
import Rotation from "./components/Rotation";
import Scale from "./components/Scale";

type World = IWorld & {
  time: {
    delta: number;
    elapsed: number;
    then: number;
  };
};

const movementQuery = defineQuery([Position, Rotation, Scale, Velocity]);

const movementSystem = (world: World) => {
  const {
    time: { delta },
  } = world;
  const ents = movementQuery(world);
  for (let i = 0; i < ents.length; i++) {
    const eid = ents[i];
    Position.x[eid] += Velocity.x[eid] * delta;
    Position.y[eid] += Velocity.y[eid] * delta;
    Position.z[eid] += Velocity.z[eid] * delta;
    Rotation.angle[eid] += delta * 0.1;
  }
  return world;
};

const timeSystem = (world: World) => {
  const { time } = world;
  const now = performance.now();
  const delta = now - time.then;
  time.delta = delta;
  time.elapsed += delta;
  time.then = now;
  return world;
};

const spriteSystem = (world: World) => {
  const ents = movementQuery(world);
  for (let i = 0; i < ents.length; i++) {
    const eid = ents[i];
    const sprite = spritesById.get(eid);
    if (sprite) {
      sprite.x = Position.x[eid];
      sprite.y = Position.y[eid];
      sprite.rotation = Rotation.angle[eid];
      sprite.scale.x = Scale.x[eid];
      sprite.scale.y = Scale.y[eid];
    }
  }
  return world;
};

const pipeline = pipe(movementSystem, timeSystem, spriteSystem);

const world = createWorld<World>();
world.time = { delta: 0, elapsed: 0, then: performance.now() };

const spritesById: Map<number, PIXI.Sprite> = new Map();
const eid = addEntity(world);
addComponent(world, Position, eid);
addComponent(world, Velocity, eid);
addComponent(world, Rotation, eid);
addComponent(world, Scale, eid);
Velocity.x[eid] = 1.23;
Velocity.y[eid] = 1.23;
Scale.x[eid] = 1;
Scale.y[eid] = 1;

const app = new PIXI.Application({
  background: "#1099bb",
  resizeTo: window,
  width: window.innerWidth,
  height: window.innerHeight,
});

document.body.appendChild(app.view as HTMLCanvasElement);

const bunny = PIXI.Sprite.from("https://pixijs.com/assets/bunny.png");

bunny.anchor.set(0.5);

bunny.x = app.screen.width / 2;
bunny.y = app.screen.height / 2;

app.stage.addChild(bunny);

spritesById.set(eid, bunny);

app.ticker.add((delta) => {
  world.time.delta = delta;
  pipeline(world);
});
