import Phaser from "phaser";

function getCanvasPosition(
  gameObject: Phaser.GameObjects.GameObject,
  camera: Phaser.Cameras.Scene2D.Camera
) {
  return {
    x: gameObject.x - camera.scrollX,
    y: gameObject.y - camera.scrollY,
  };
}

export default getCanvasPosition;
