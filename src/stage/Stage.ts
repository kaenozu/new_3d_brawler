import {
  Color3,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Vector3,
} from "@babylonjs/core";

export class Stage {
  public readonly id = "grassland-ruins";
  public readonly displayName = "Grassland Ruins";

  public constructor(private readonly scene: Scene) {}

  public create(): void {
    const ground = MeshBuilder.CreateBox(
      "ground",
      { width: 44, height: 0.5, depth: 7 },
      this.scene,
    );
    ground.position.y = -0.25;
    const mat = new StandardMaterial("groundMat", this.scene);
    mat.diffuseColor = new Color3(0.32, 0.52, 0.24);
    ground.material = mat;

    // 奥の地面 (見た目用)
    const back = MeshBuilder.CreateBox(
      "groundBack",
      { width: 60, height: 0.4, depth: 10 },
      this.scene,
    );
    back.position = new Vector3(0, -0.3, 8);
    const backMat = new StandardMaterial("groundBackMat", this.scene);
    backMat.diffuseColor = new Color3(0.26, 0.44, 0.2);
    back.material = backMat;

    // 遺跡柱 (Y修正済み: height/2)
    for (let i = -10; i <= 10; i += 2) {
      const h = 2 + (Math.abs(i) % 3) * 0.35;
      const pillar = MeshBuilder.CreateBox(
        `ruin-${i}`,
        { width: 0.8, height: h, depth: 0.8 },
        this.scene,
      );
      pillar.position = new Vector3(i * 1.6, h / 2, 3.4);
      const ruinMat = new StandardMaterial(`ruinMat-${i}`, this.scene);
      ruinMat.diffuseColor = new Color3(0.45, 0.44, 0.4);
      pillar.material = ruinMat;
    }

    // 木 (幹+葉の簡易)
    const trunkMat = new StandardMaterial("trunkMat", this.scene);
    trunkMat.diffuseColor = new Color3(0.35, 0.24, 0.14);
    const leafMat = new StandardMaterial("leafMat", this.scene);
    leafMat.diffuseColor = new Color3(0.22, 0.45, 0.2);
    for (const [x, z, s] of [
      [-12, 4.5, 1.2],
      [-4, 5.0, 1.0],
      [6, 4.6, 1.3],
      [14, 5.0, 1.1],
    ] as const) {
      const trunk = MeshBuilder.CreateCylinder(
        `trunk-${x}`,
        { height: 1.6 * s, diameter: 0.35 * s },
        this.scene,
      );
      trunk.position = new Vector3(x, 0.8 * s, z);
      trunk.material = trunkMat;
      const leaves = MeshBuilder.CreateSphere(
        `leaves-${x}`,
        { diameter: 2.2 * s },
        this.scene,
      );
      leaves.position = new Vector3(x, 2.2 * s, z);
      leaves.material = leafMat;
    }

    // 岩
    const rockMat = new StandardMaterial("rockMat", this.scene);
    rockMat.diffuseColor = new Color3(0.5, 0.5, 0.48);
    for (const [x, z] of [
      [-8, -3.2],
      [2, -3.4],
      [10, -3.1],
    ] as const) {
      const rock = MeshBuilder.CreateSphere(`rock-${x}`, { diameter: 1.1 }, this.scene);
      rock.position = new Vector3(x, 0.3, z);
      rock.scaling.y = 0.7;
      rock.material = rockMat;
    }
  }
}
