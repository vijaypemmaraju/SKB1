import { defineQuery, enterQuery, exitQuery } from "bitecs";
import World from "../World";
import gameObjects from "../resources/gameObjects";
import GameObject from "../components/GameObject";
import game from "../game";
import Anchor from "../components/Anchor";
import Shader from "../components/Shader";
import shaderData from "../resources/shaderData";
import Position from "../components/Position";
import ScrollFactor from "../components/ScrollFactor";

const shaderQuery = defineQuery([
  Anchor,
  GameObject,
  Shader,
  Position,
  ScrollFactor,
]);

const shaderSystem = (world: World) => {
  const enteringShaders = enterQuery(shaderQuery)(world);
  const exitingShaders = exitQuery(shaderQuery)(world);
  for (let i = 0; i < enteringShaders.length; i++) {
    const eid = enteringShaders[i];
    const shaderDatum = shaderData.get(eid);
    if (!shaderDatum) {
      continue;
    }
    const base = new Phaser.Display.BaseShader(
      shaderDatum.key,
      shaderDatum.fragmentShader,
      undefined,
      shaderDatum.uniforms,
    );
    const shader = game.scene.scenes[0].add.shader(
      base,
      Position.x[eid],
      Position.y[eid],
      Shader.width[eid],
      Shader.height[eid],
      [],
    );
    shader.setOrigin(Anchor.x[eid], Anchor.y[eid]);
    shader.setScrollFactor(ScrollFactor.x[eid], ScrollFactor.y[eid]);
    const sampler2DData = Object.entries(shaderDatum.uniforms).filter(
      ([, uniform]) => uniform.type === "sampler2D",
    );
    console.log(sampler2DData);
    for (let i = 0; i < sampler2DData.length; i++) {
      const [key, uniform] = sampler2DData[i];
      shader.setSampler2D(key, uniform.value, i);
    }
    gameObjects.set(eid, shader);
  }
  for (let i = 0; i < exitingShaders.length; i++) {
    const eid = exitingShaders[i];
    const shader = gameObjects.get(eid);
    if (shader) {
      shader.destroy();
      gameObjects.delete(eid);
    }
  }

  const ents = shaderQuery(world);
  for (let i = 0; i < ents.length; i++) {
    const eid = ents[i];
    const shader = gameObjects.get(eid) as Phaser.GameObjects.Shader;
    shader.setUniform("camera_position.value.x", world.currentCamera.scrollX);
    shader.setUniform("camera_position.value.y", world.currentCamera.scrollY);
    shader.setUniform("camera_zoom.value", world.currentCamera.zoom);
    if (shader) {
      shader.setOrigin(Anchor.x[eid], Anchor.y[eid]);
    }
  }

  return world;
};

export default shaderSystem;
