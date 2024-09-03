import { Scene } from "phaser";
import useStore from "../useStore";
import IslandGenerator from "../utils/IslandGenerator";
import grass from "../resources/shaders/grass";
import getCanvasPosition from "../utils/getCanvasPosition";

export default class Main3 extends Scene {
  renderTexture: Phaser.GameObjects.RenderTexture;
  grassShader: Phaser.GameObjects.Shader;
  islandPolygon: Phaser.GameObjects.Polygon;
  constructor() {
    super({ key: "Main3" });
  }

  preload() {
    this.load.image("grass", "grass2.png");
    this.load.audio("music", "skb1_1_v0.2.mp3");
    this.load.image("auto", "wangbl.png");
    this.load.image("gradient", "gradient.png");
    this.load.image("noise", "noise.png");
    this.load.image("clouds", "clouds.png");
  }

  async create() {
    const entities: Phaser.GameObjects.GameObject[] = [];

    this.setupCameraHelpers();
    this.cameras.main.setZoom(0.079);
    let initial = true;
    let polygon: Phaser.GameObjects.Polygon = this.add.polygon(
      0,
      0,
      [0, 0, 0, 0],
      0xff0000
    );
    console.log(this.cameras.main.width / this.cameras.main.zoom);
    console.log(this.cameras.main.height / this.cameras.main.zoom);
    this.renderTexture = this.add
      .renderTexture(
        0,
        0,
        this.cameras.main.width / this.cameras.main.zoom,
        this.cameras.main.height / this.cameras.main.zoom
      )
      .setOrigin(0, 0)
      .setScrollFactor(0, 0);
    this.renderTexture.saveTexture("renderTex");
    this.renderTexture.visible = false;
    await new Promise((resolve) => setTimeout(resolve, 10));
    const generator = new IslandGenerator(
      0.175,
      useStore.getState().forceGraphInstance!
    );
    useStore.subscribe((state) => {
      generator.setForceGraphInstance(state.forceGraphInstance!);
      const generated = generator.generateIslands();

      if (initial) {
        initial = false;
        const midpoint = generator.getMidpoint();

        this.cameras.main.centerOn(midpoint.x - 4000, midpoint.y - 4000);
      }

      polygon.setTo(generated);
      this.islandPolygon = polygon;
      const bounds = polygon.getBounds();
      // this.renderTexture.resize(bounds.width, bounds.height);

      let grassShader = new Phaser.Display.BaseShader(
        "grassy",
        grass,
        undefined,
        {
          resolution: {
            type: "2f",
            value: {
              x: this.cameras.main.width,
              y: this.cameras.main.height,
            },
          },
          wind_speed: { type: "1f", value: 0.01 },
          gradient: { type: "sampler2D", value: "gradient" },
          tex: { type: "sampler2D", value: "renderTex" },
          noise_tex: { type: "sampler2D", value: "noise" },
          cloud_tex: { type: "sampler2D", value: "clouds" },
          grass_tex: { type: "sampler2D", value: "grass" },
          grass_tex2: { type: "sampler2D", value: "grass2" },
          wind_direction: { type: "2f", value: { x: 1.0, y: -1.0 } },
          tip_color: {
            type: "4f",
            // value: { x: 0.996078, y: 0.976471, z: 0.517647, w: 1.0 },
            value: { x: 127 / 255, y: 180 / 255, z: 100 / 255, w: 1.0 },
          },
          wind_color: {
            type: "4f",
            // value: { x: 1.0, y: 0.984314, z: 0.639216, w: 1.0 },
            value: { x: 129 / 255, y: 178 / 255, z: 100 / 255, w: 1.0 },
          },
          noise_tex_size: { type: "2f", value: { x: 50.0, y: 1.0 } },
          camera_position: {
            type: "2f",
            value: { x: 0, y: 0 },
          },
          camera_zoom: {
            type: "1f",
            value: 1.0,
          },
        }
      );
      const shader = this.make
        .shader({
          key: grassShader,
          x: 0,
          y: 0,
          width: this.cameras.main.width,
          height: this.cameras.main.height,
          add: true,
        })
        .setOrigin(0, 0)
        .setScrollFactor(0, 0);

      this.grassShader = shader;
      this.grassShader.visible = false;
      shader.setSampler2D("gradient", "gradient", 0);
      shader.setSampler2D("tex", "renderTex", 1);
      shader.setSampler2D("noise_tex", "noise", 2);
      shader.setSampler2D("cloud_tex", "clouds", 3);
      shader.setSampler2D("grass_tex", "grass", 4);
      shader.setSampler2D("grass_tex2", "grass", 5);
    });
  }

  private setupCameraHelpers() {
    this.input.on(
      "wheel",
      (
        _pointer: any,
        _gameObjects: any,
        deltaX: any,
        deltaY: any,
        deltaZ: any
      ) => {
        const zoom = this.cameras.main.zoom;
        this.cameras.main.zoom = Phaser.Math.Clamp(
          zoom - deltaY * 0.001,
          0.05,
          2
        );
      }
    );

    let lastX = 0;
    let lastY = 0;
    let dragging = false;

    this.input.on("pointerdown", (pointer: any) => {
      lastX = pointer.x;
      lastY = pointer.y;
      dragging = true;
    });

    this.input.on("pointerup", () => {
      dragging = false;
    });

    this.input.on("pointermove", (pointer: any) => {
      if (dragging) {
        const dx = pointer.x - lastX;
        const dy = pointer.y - lastY;
        lastX = pointer.x;
        lastY = pointer.y;
        this.cameras.main.scrollX -= dx / this.cameras.main.zoom;
        this.cameras.main.scrollY -= dy / this.cameras.main.zoom;
      }
    });
  }

  update(time: number, delta: number) {
    if (!this.islandPolygon) return;
    const canvasPosition = getCanvasPosition(
      this.islandPolygon,
      this.cameras.main
    );

    this.renderTexture.clear();
    this.renderTexture.resize(
      this.cameras.main.width / this.cameras.main.zoom,
      this.cameras.main.height / this.cameras.main.zoom
    );
    this.renderTexture.beginDraw();
    this.renderTexture.draw(
      this.islandPolygon,
      canvasPosition.x,
      canvasPosition.y
    );
    this.renderTexture.endDraw();

    const cameraPosition = {
      x: this.cameras.main.scrollX,
      y: this.cameras.main.scrollY,
    };
    this.grassShader?.setUniform("camera_position.value.x", cameraPosition.x);
    this.grassShader?.setUniform("camera_position.value.y", cameraPosition.y);
    this.grassShader?.setUniform("camera_zoom", this.cameras.main.zoom);
    this.grassShader?.setUniform(
      "res.value.x",
      this.cameras.main.width / this.cameras.main.zoom
    );
    this.grassShader?.setUniform(
      "res.value.y",
      this.cameras.main.height / this.cameras.main.zoom
    );

    this.grassShader.displayWidth =
      this.cameras.main.width / this.cameras.main.zoom;
    this.grassShader.displayHeight =
      this.cameras.main.height / this.cameras.main.zoom;
    // position the shader based on camera position and zoom
    // this.grassShader.x = -this.cameras.main.width / 2 / this.cameras.main.zoom;
    // this.grassShader.y = -this.cameras.main.height / 2 / this.cameras.main.zoom;
  }
}
