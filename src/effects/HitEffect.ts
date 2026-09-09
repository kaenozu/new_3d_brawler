import {
  Color3,
  Mesh,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Vector3,
} from "@babylonjs/core";

type Spark = {
  mesh: Mesh;
  mat: StandardMaterial;
  life: number;
  maxLife: number;
  velocity: Vector3;
};

/** ヒットスパークの簡易プール */
export class HitEffect {
  private readonly sparks: Spark[] = [];

  public constructor(private readonly scene: Scene) {}

  public spawn(pos: Vector3, big = false): void {
    const count = big ? 8 : 4;
    for (let i = 0; i < count; i++) {
      const mesh = MeshBuilder.CreateSphere(
        `spark-${performance.now()}-${i}`,
        { diameter: big ? 0.16 : 0.11 },
        this.scene,
      );
      mesh.position.copyFrom(pos);
      mesh.position.x += (Math.random() - 0.5) * 0.4;
      mesh.position.y += (Math.random() - 0.5) * 0.6;
      mesh.position.z += (Math.random() - 0.5) * 0.4;
      const mat = new StandardMaterial(`sparkMat-${mesh.id}`, this.scene);
      const col = big
        ? new Color3(1, 0.55, 0.15)
        : new Color3(1, 0.9, 0.4);
      mat.diffuseColor = col;
      mat.emissiveColor = col;
      mesh.material = mat;
      const v = new Vector3(
        (Math.random() - 0.5) * 6,
        Math.random() * 4 + 1,
        (Math.random() - 0.5) * 4,
      );
      const maxLife = 0.25 + Math.random() * 0.15;
      this.sparks.push({ mesh, mat, life: maxLife, maxLife, velocity: v });
    }
  }

  public update(dt: number): void {
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.life -= dt;
      if (s.life <= 0) {
        s.mesh.dispose();
        s.mat.dispose();
        this.sparks.splice(i, 1);
        continue;
      }
      s.velocity.y -= 12 * dt;
      s.mesh.position.addInPlace(s.velocity.scale(dt));
      const k = s.life / s.maxLife;
      s.mesh.scaling.setAll(Math.max(0.01, k));
    }
  }
}
