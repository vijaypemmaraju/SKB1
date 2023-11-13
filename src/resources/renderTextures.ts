import Phaser from "phaser";

const renderTextures: Map<number, Phaser.GameObjects.RenderTexture> = new Map();
export const saveToTextures: Map<number, string> = new Map();

export default renderTextures;
