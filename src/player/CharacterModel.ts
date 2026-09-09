import {
  Color3,
  Mesh,
  MeshBuilder,
  Scene,
  StandardMaterial,
  TransformNode,
  Vector3,
} from "@babylonjs/core";
import type { PlayerState } from "./PlayerState";
import { ATTACKS } from "../data/attacks";

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.min(1, Math.max(0, t));
}

/**
 * プリミティブ組み立ての仮主人公モデル (成人女性の剣士)。
 * +Zを正面として造形し、innerのY回転で±Xに向ける。
 * マント/ロングスカート不使用 (SPEC)。ポニーテールは短め・物理なし。
 */
export class CharacterModel {
  /** Playerがダウン回転・y位置に使う外殻 (旧capsule visualの代替) */
  public readonly outer: TransformNode;
  private readonly inner: TransformNode;

  private torso!: Mesh;
  private head!: Mesh;
  private ponytail!: Mesh;

  private shoulderR!: TransformNode;
  private shoulderL!: TransformNode;
  private elbowR!: TransformNode;
  private elbowL!: TransformNode;
  private hipR!: TransformNode;
  private hipL!: TransformNode;
  private kneeR!: TransformNode;
  private kneeL!: TransformNode;

  private idleTime = 0;
  private runPhase = 0;

  private readonly mats: { m: StandardMaterial; base: Color3 }[] = [];

  public constructor(
    private readonly scene: Scene,
    parent: TransformNode,
  ) {
    this.outer = new TransformNode("charaOuter", scene);
    this.outer.parent = parent;
    this.inner = new TransformNode("charaInner", scene);
    this.inner.parent = this.outer;

    const skin = this.makeMat("skin", new Color3(0.96, 0.77, 0.63));
    const hairM = this.makeMat("hair", new Color3(0.24, 0.15, 0.11));
    const topM = this.makeMat("top", new Color3(0.82, 0.28, 0.34));
    const pantsM = this.makeMat("pants", new Color3(0.2, 0.22, 0.3));
    const bootsM = this.makeMat("boots", new Color3(0.4, 0.28, 0.18));
    const beltM = this.makeMat("belt", new Color3(0.3, 0.2, 0.12));
    const goldM = this.makeMat("gold", new Color3(0.85, 0.68, 0.3));
    const steelM = this.makeMat(
      "steel",
      new Color3(0.85, 0.87, 0.92),
      new Color3(0.18, 0.19, 0.22),
    );
    const darkM = this.makeMat("dark", new Color3(0.08, 0.08, 0.1));

    // ---- 脚 (股関節ピボット y=0.95) ----
    this.hipR = this.node("hipR", this.inner, 0.13, 0.95, 0);
    this.hipL = this.node("hipL", this.inner, -0.13, 0.95, 0);
    for (const [hip, side] of [
      [this.hipR, 1],
      [this.hipL, -1],
    ] as const) {
      void side;
      const thigh = this.box("thigh", 0.15, 0.45, 0.17, pantsM, hip, 0, -0.22, 0);
      void thigh;
    }
    this.kneeR = this.node("kneeR", this.hipR, 0, -0.45, 0);
    this.kneeL = this.node("kneeL", this.hipL, 0, -0.45, 0);
    for (const knee of [this.kneeR, this.kneeL]) {
      this.box("shin", 0.12, 0.32, 0.13, skin, knee, 0, -0.16, 0);
      this.box("boot", 0.14, 0.2, 0.24, bootsM, knee, 0, -0.36, 0.04);
    }

    // ---- 腰・スカート(短)・胴 ----
    this.box("hips", 0.4, 0.22, 0.26, pantsM, this.inner, 0, 0.98, 0);
    const skirt = MeshBuilder.CreateCylinder(
      "skirt",
      { height: 0.2, diameterTop: 0.42, diameterBottom: 0.52, tessellation: 8 },
      scene,
    );
    skirt.material = topM;
    skirt.parent = this.inner;
    skirt.position.set(0, 0.86, 0);
    this.box("belt", 0.42, 0.09, 0.28, beltM, this.inner, 0, 1.06, 0);
    this.box("beltBuckle", 0.1, 0.07, 0.03, goldM, this.inner, 0, 1.06, 0.15);

    this.torso = this.box("torso", 0.44, 0.42, 0.26, topM, this.inner, 0, 1.3, 0);
    this.box("chestGuard", 0.3, 0.2, 0.04, beltM, this.inner, 0, 1.32, 0.14);
    this.box("pauldronR", 0.16, 0.1, 0.18, goldM, this.inner, 0.3, 1.5, 0);
    this.box("pauldronL", 0.16, 0.1, 0.18, goldM, this.inner, -0.3, 1.5, 0);

    // ---- 腕 (肩ピボット y=1.44) ----
    this.shoulderR = this.node("shoulderR", this.inner, 0.29, 1.44, 0);
    this.shoulderL = this.node("shoulderL", this.inner, -0.29, 1.44, 0);
    for (const [sh, isR] of [
      [this.shoulderR, true],
      [this.shoulderL, false],
    ] as const) {
      this.box("upperArm", 0.11, 0.3, 0.12, isR ? topM : skin, sh, 0, -0.15, 0);
    }
    this.elbowR = this.node("elbowR", this.shoulderR, 0, -0.3, 0);
    this.elbowL = this.node("elbowL", this.shoulderL, 0, -0.3, 0);
    this.box("foreArmR", 0.1, 0.26, 0.11, skin, this.elbowR, 0, -0.13, 0);
    this.box("foreArmL", 0.1, 0.26, 0.11, skin, this.elbowL, 0, -0.13, 0);
    this.box("handR", 0.09, 0.1, 0.1, skin, this.elbowR, 0, -0.3, 0);
    this.box("handL", 0.09, 0.1, 0.1, skin, this.elbowL, 0, -0.3, 0);

    // ---- 剣 (右手) ----
    const swordGrip = new TransformNode("swordGrip", scene);
    swordGrip.parent = this.elbowR;
    swordGrip.position.set(0, -0.32, 0.06);
    swordGrip.rotation.x = Math.PI / 2 - 0.25;
    this.box("grip", 0.05, 0.22, 0.05, beltM, swordGrip, 0, 0, 0);
    this.box("guard", 0.22, 0.045, 0.07, goldM, swordGrip, 0, 0.13, 0);
    const blade = this.box("blade", 0.09, 0.95, 0.025, steelM, swordGrip, 0, 0.62, 0);
    void blade;

    // ---- 頭・髪 ----
    this.head = MeshBuilder.CreateSphere("head", { diameter: 0.26 }, scene);
    this.head.material = skin;
    this.head.parent = this.inner;
    this.head.position.set(0, 1.62, 0);
    // 目 (正面+Z)
    for (const sx of [0.06, -0.06]) {
      this.box("eye", 0.035, 0.045, 0.02, darkM, this.inner, sx, 1.63, 0.125);
    }
    // 鉢巻
    const band = MeshBuilder.CreateCylinder(
      "headband",
      { height: 0.06, diameter: 0.285, tessellation: 12 },
      scene,
    );
    band.material = topM;
    band.parent = this.inner;
    band.position.set(0, 1.7, 0);
    // 後髪
    const backHair = MeshBuilder.CreateSphere("backHair", { diameter: 0.29 }, scene);
    backHair.material = hairM;
    backHair.parent = this.inner;
    backHair.position.set(0, 1.64, -0.05);
    backHair.scaling.set(1, 1.05, 0.9);
    // ポニーテール (短め)
    this.ponytail = this.box("ponytail", 0.11, 0.34, 0.12, hairM, this.inner, 0, 1.52, -0.22);
    this.ponytail.rotation.x = 0.5;

    this.setFacing(1);
    this.resetPose();
  }

  public setFacing(f: 1 | -1): void {
    this.inner.rotation.y = f === 1 ? Math.PI / 2 : -Math.PI / 2;
  }

  public flash(on: boolean): void {
    for (const e of this.mats) {
      if (on) e.m.diffuseColor = new Color3(1, 0.45, 0.45);
      else e.m.diffuseColor.copyFrom(e.base);
    }
  }

  public resetPose(): void {
    this.inner.position.y = 0;
    this.torso.rotation.set(0, 0, 0);
    this.head.rotation.set(0, 0, 0);
    this.ponytail.rotation.set(0.5, 0, 0);
    for (const n of [this.shoulderR, this.shoulderL]) n.rotation.set(0, 0, 0);
    for (const n of [this.elbowR, this.elbowL]) n.rotation.set(-0.25, 0, 0);
    for (const n of [this.hipR, this.hipL]) n.rotation.set(0, 0, 0);
    for (const n of [this.kneeR, this.kneeL]) n.rotation.set(0, 0, 0);
  }

  public animate(state: PlayerState, stateTime: number, dt: number): void {
    this.idleTime += dt;
    this.resetPose();
    const t = this.idleTime;

    switch (state) {
      case "Idle": {
        const b = Math.sin(t * 2.2) * 0.012;
        this.torso.position.y = 1.3 + b;
        this.shoulderR.rotation.x = Math.sin(t * 2.2) * 0.05;
        this.shoulderL.rotation.x = -Math.sin(t * 2.2) * 0.05;
        this.ponytail.rotation.x = 0.5 + Math.sin(t * 2.2 + 0.6) * 0.06;
        break;
      }
      case "Run": {
        this.runPhase += dt * 11;
        const p = this.runPhase;
        const s = Math.sin(p);
        this.hipR.rotation.x = s * 0.7;
        this.hipL.rotation.x = -s * 0.7;
        this.kneeR.rotation.x = Math.max(0, -s) * 0.9 + 0.08;
        this.kneeL.rotation.x = Math.max(0, s) * 0.9 + 0.08;
        this.shoulderR.rotation.x = -s * 0.55;
        this.shoulderL.rotation.x = s * 0.55;
        this.elbowR.rotation.x = -0.5 - Math.max(0, s) * 0.3;
        this.torso.rotation.x = 0.1;
        this.inner.position.y = Math.abs(Math.cos(p)) * 0.05;
        this.ponytail.rotation.x = 0.7 + Math.abs(Math.sin(p)) * 0.15;
        break;
      }
      case "Jump": {
        this.hipR.rotation.x = -0.7;
        this.kneeR.rotation.x = 1.1;
        this.hipL.rotation.x = 0.35;
        this.kneeL.rotation.x = 0.15;
        this.shoulderR.rotation.x = -2.4;
        this.shoulderL.rotation.z = 0.9;
        this.torso.rotation.x = -0.08;
        break;
      }
      case "Fall": {
        this.hipR.rotation.x = -0.35;
        this.hipL.rotation.x = 0.3;
        this.shoulderR.rotation.z = 0.8;
        this.shoulderL.rotation.z = -0.8;
        this.shoulderR.rotation.x = -1.2;
        this.shoulderL.rotation.x = -1.2;
        break;
      }
      case "Attack1": {
        const k = stateTime / ATTACKS.attack1.duration;
        this.torso.rotation.y = lerp(0.55, -0.55, k);
        this.shoulderR.rotation.x = -1.25;
        this.shoulderR.rotation.y = lerp(0.7, -0.9, k);
        this.elbowR.rotation.x = -0.35;
        this.hipR.rotation.x = -0.25;
        this.head.rotation.y = lerp(0.3, -0.3, k);
        break;
      }
      case "Attack2": {
        const k = stateTime / ATTACKS.attack2.duration;
        this.torso.rotation.y = lerp(-0.55, 0.55, k);
        this.shoulderR.rotation.x = -1.1;
        this.shoulderR.rotation.y = lerp(-0.8, 0.8, k);
        this.elbowR.rotation.x = -0.5;
        this.hipL.rotation.x = -0.25;
        this.head.rotation.y = lerp(-0.3, 0.3, k);
        break;
      }
      case "Attack3": {
        const k = stateTime / ATTACKS.attack3.duration;
        this.shoulderR.rotation.x = lerp(-2.7, -0.2, k);
        this.elbowR.rotation.x = -0.2;
        this.torso.rotation.x = lerp(-0.12, 0.3, k);
        this.inner.position.y = -0.07 * Math.sin(k * Math.PI);
        this.hipR.rotation.x = -0.4;
        this.kneeR.rotation.x = 0.5;
        this.head.rotation.x = lerp(-0.25, 0.15, k);
        break;
      }
      case "StrongAttack": {
        const d = ATTACKS.strong.duration;
        const k = stateTime / d;
        if (k < 0.38) {
          const c = k / 0.38;
          this.inner.position.y = -0.16 * c;
          this.shoulderR.rotation.x = lerp(-1.0, -2.9, c);
          this.torso.rotation.y = 0.6 * c;
          this.torso.rotation.x = -0.15 * c;
          this.kneeR.rotation.x = 0.7 * c;
          this.kneeL.rotation.x = 0.7 * c;
        } else {
          const c = (k - 0.38) / 0.62;
          this.shoulderR.rotation.x = lerp(-2.9, -0.1, c);
          this.torso.rotation.x = lerp(-0.15, 0.38, c);
          this.torso.rotation.y = lerp(0.6, -0.2, c);
          this.inner.position.y = lerp(-0.16, -0.08, c);
        }
        break;
      }
      case "Dodge": {
        this.inner.position.y = -0.22;
        this.torso.rotation.x = 0.55;
        this.head.rotation.x = -0.3;
        this.hipR.rotation.x = -0.9;
        this.hipL.rotation.x = 0.6;
        this.kneeR.rotation.x = 1.2;
        this.kneeL.rotation.x = 0.9;
        this.shoulderR.rotation.x = -0.5;
        this.elbowR.rotation.x = -1.4;
        this.elbowL.rotation.x = -1.4;
        break;
      }
      case "HitLight":
      case "HitHeavy": {
        const big = state === "HitHeavy" ? 1.4 : 1;
        this.torso.rotation.x = -0.32 * big;
        this.head.rotation.x = -0.3 * big;
        this.shoulderR.rotation.x = 0.6;
        this.shoulderL.rotation.x = 0.6;
        this.shoulderR.rotation.z = 0.5;
        this.shoulderL.rotation.z = -0.5;
        this.inner.position.y = -0.04;
        break;
      }
      case "DownBack":
      case "DownFront":
      case "Defeat": {
        // outerが横倒しにするので手足はだらんと広げるだけ
        this.shoulderR.rotation.z = 1.1;
        this.shoulderL.rotation.z = -1.1;
        this.hipR.rotation.x = -0.15;
        this.hipL.rotation.x = 0.12;
        break;
      }
      case "GetUp":
        break;
      default:
        break;
    }
  }

  // ---- 内部ヘルパー ----
  private makeMat(name: string, color: Color3, emissive?: Color3): StandardMaterial {
    const m = new StandardMaterial(`chara-${name}`, this.scene);
    m.diffuseColor = color.clone();
    m.specularColor = new Color3(0.05, 0.05, 0.05);
    m.emissiveColor = emissive ? emissive.clone() : new Color3(0, 0, 0);
    this.mats.push({ m, base: color.clone() });
    // flash()がdiffuseを書き換えるため、emissive持ち鋼は対象外にする
    if (emissive) this.mats.pop();
    return m;
  }

  private node(name: string, parent: TransformNode, x: number, y: number, z: number): TransformNode {
    const n = new TransformNode(`chara-${name}`, this.scene);
    n.parent = parent;
    n.position.set(x, y, z);
    return n;
  }

  private box(
    name: string,
    w: number,
    h: number,
    d: number,
    mat: StandardMaterial,
    parent: TransformNode,
    x: number,
    y: number,
    z: number,
  ): Mesh {
    const mesh = MeshBuilder.CreateBox(
      `chara-${name}`,
      { width: w, height: h, depth: d },
      this.scene,
    );
    mesh.material = mat;
    mesh.parent = parent;
    mesh.position.set(x, y, z);
    return mesh;
  }
}
