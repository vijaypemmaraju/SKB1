import { defineQuery, enterQuery, exitQuery } from "bitecs";
import World from "../World";
import game from "../game";
import GameObject from "../components/GameObject";
import RenderTexture from "../components/RenderTexture";
import renderTextures, { saveToTextures } from "../resources/renderTextures";

const renderTextureQuery = defineQuery([GameObject, RenderTexture]);

const renderTextureSystem = (world: World) => {
  const enteringRenderTextures = enterQuery(renderTextureQuery)(world);
  const exitingRenderTextures = exitQuery(renderTextureQuery)(world);
  for (let i = 0; i < enteringRenderTextures.length; i++) {
    const eid = enteringRenderTextures[i];
    let renderTexture;
    renderTexture = game.scene.scenes[0].add.renderTexture(
      0,
      0,
      RenderTexture.width[eid],
      RenderTexture.height[eid],
    );
    renderTextures.set(eid, renderTexture);
    const saveToTex = saveToTextures.get(eid);
    if (saveToTex) {
      renderTexture.saveTexture(saveToTex);
    }
  }
  for (let i = 0; i < exitingRenderTextures.length; i++) {
    const eid = exitingRenderTextures[i];
    const renderTexture = renderTextures.get(eid);
    if (renderTexture) {
      renderTexture.destroy();
      renderTextures.delete(eid);
    }
  }

  const renderTextureEnts = renderTextureQuery(world);

  for (let i = 0; i < renderTextureEnts.length; i++) {
    const eid = renderTextureEnts[i];
    const renderTexture = renderTextures.get(
      eid,
    ) as Phaser.GameObjects.RenderTexture;
    if (renderTexture) {
      // renderTexture.clear();
      renderTexture.resize(game.scale.width, game.scale.height);
    }
  }

  return world;
};

export default renderTextureSystem;
