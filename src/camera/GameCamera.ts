import { ArcRotateCamera, Scene, TransformNode, Vector3 } from "@babylonjs/core";

export class GameCamera {
  private readonly camera: ArcRotateCamera;
  private readonly desired = new Vector3(0, 1.2, 0);
  private readonly shaken = new Vector3(0, 1.2, 0);
  private trauma = 0;

  public constructor(
    scene: Scene,
    private readonly target: TransformNode,
  ) {
    this.camera = new ArcRotateCamera(
      "gameCamera",
      -Math.PI / 2,
      1.14,
      11.5,
      new Vector3(target.position.x + 1.8, 1.2, 0),
      scene,
    );
    this.camera.fov = Math.PI / 4;
    this.camera.inputs.clear();
    scene.activeCamera = this.camera;
  }

  public addShake(amount: number): void {
    this.trauma = Math.min(1, this.trauma + amount);
  }

  public update(dt: number): void {
    this.desired.set(this.target.position.x + 1.8, 1.2, 0); // 1ライン: Z固定
    const factor = Math.min(1, dt * 4);
    this.camera.target = Vector3.Lerp(this.camera.target, this.desired, factor);

    // シェイク: trauma^2 で減衰オフセット
    if (this.trauma > 0) {
      this.trauma = Math.max(0, this.trauma - dt * 2.2);
      const s = this.trauma * this.trauma * 0.55;
      this.shaken.set(
        this.camera.target.x + (Math.random() * 2 - 1) * s,
        this.camera.target.y + (Math.random() * 2 - 1) * s,
        this.camera.target.z + (Math.random() * 2 - 1) * s,
      );
      this.camera.target = this.shaken.clone();
    }
  }
}
