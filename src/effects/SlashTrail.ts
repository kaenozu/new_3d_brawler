import {
  Color3,
  Mesh,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Vector3,
} from "@babylonjs/core";

/** 剣軌の簡易フラッシュ。攻撃開始で表示→フェード */
export class SlashTrail {
  private readonly mesh: Mesh;
  private readonly mat: StandardMaterial;
  private life = 0;
  private maxLife = 0.15;

  public constructor(scene: Scene) {
    this.mesh = MeshBuilder.CreateBox(
      "slashTrail",
      { width: 1.6, height: 0.28, depth: 0.06 },
      scene,
    );
    this.mesh.isVisible = false;
    this.mat = new StandardMaterial("slashTrailMat", scene);
    this.mat.diffuseColor = new Color3(0.7, 0.9, 1);
    this.mat.emissiveColor = new Color3(0.6, 0.85, 1);
    this.mat.alpha = 0.85;
    this.mesh.material = this.mat;
  }

  public show(pos: Vector3, facing: number, big = false): void {
    this.mesh.isVisible = true;
    this.mesh.position.set(pos.x + facing * 1.0, pos.y + 1.1, pos.z);
    this.mesh.rotation.z = facing === 1 ? -0.5 : Math.PI + 0.5;
    this.mesh.scaling.set(big ? 1.4 : 1, big ? 1.4 : 1, 1);
    this.maxLife = big ? 0.2 : 0.14;
    this.life = this.maxLife;
    this.mat.alpha = 0.9;
  }

  public update(dt: number): void {
    if (!this.mesh.isVisible) return;
    this.life -= dt;
    if (this.life <= 0) {
      this.mesh.isVisible = false;
      return;
    }
    this.mat.alpha = 0.9 * (this.life / this.maxLife);
    this.mesh.scaling.x += dt * 2;
  }
}
