import { Scene } from "phaser";
import useStore from "../useStore";
import IslandGenerator from "../utils/IslandGenerator";

export default class Main3 extends Scene {
  fps: Phaser.GameObjects.Text;
  constructor() {
    super({ key: "Main3" });
  }

  async create() {
    const entities: Phaser.GameObjects.GameObject[] = [];
    this.fps = this.add
      .text(10, 10, "0", { color: "white", fontSize: "48px" })
      .setScrollFactor(0);

    this.setupCameraHelpers();
    this.cameras.main.setZoom(0.05);
    let initial = true;
    let polygon: Phaser.GameObjects.Polygon = this.add.polygon(
      0,
      0,
      [0, 0, 0, 0],
      0xff0000
    );
    await new Promise((resolve) => setTimeout(resolve, 10));
    const generator = new IslandGenerator(
      0.125,
      useStore.getState().forceGraphInstance!
    );
    useStore.subscribe((state) => {
      generator.setForceGraphInstance(state.forceGraphInstance!);
      const generated = generator.generateIslands();

      if (initial) {
        initial = false;
        const midpoint = generator.getMidpoint();

        this.cameras.main.centerOn(midpoint.x - 3500, midpoint.y - 3500);
      }

      polygon.setTo(generated);
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
    this.fps.setText(this.physics.world.fps.toString());
    console.log(this.physics.world.fps);
  }
}
