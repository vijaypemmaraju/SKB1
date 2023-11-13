import Phaser from "phaser";

type ShaderData = {
  key: string;
  fragmentShader: string;
  uniforms: Record<string, any>;
};

const shaderData: Map<number, ShaderData> = new Map();

export default shaderData;
