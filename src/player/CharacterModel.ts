import {
  Color3,
  Mesh,
  MeshBuilder,
  Scene,
  StandardMaterial,
  TransformNode,
} from "@babylonjs/core";
import type { PlayerState } from "./PlayerState";
import { ATTACKS } from "../data/attacks";

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.min(1, Math.max(0, t));
}

/**
 * プリミティブ組み立ての仮主人公モデル。
 * 低ポリの作りやすさは維持しつつ、角箱主体ではなく丸いシルエットの
 * 「ちび等身アニメ剣士」に寄せる。
 * +Zを正面として造形し、innerのY回転で±Xに向ける。
 */
export class CharacterModel {
  /** Playerがダウン回転・y位置に使う外殻 (旧capsule visualの代替) */
  public readonly outer: TransformNode;
  private readonly inner: TransformNode;

  private torso!: TransformNode;
  private head!: TransformNode;
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

    // 柔らかいピンク＋濃色で、遠目でも女の子らしい配色にする。
    const skin = this.makeMat("skin", new Color3(1.0, 0.82, 0.74));
    const hairM = this.makeMat("hair", new Color3(0.24, 0.10, 0.18));
    const topM = this.makeMat("top", new Color3(0.92, 0.34, 0.52));
    const topLightM = this.makeMat("topLight", new Color3(1.0, 0.62, 0.72));
    const skirtM = this.makeMat("skirt", new Color3(0.55, 0.15, 0.32));
    const stockingM = this.makeMat("stocking", new Color3(0.18, 0.17, 0.28));
    const bootsM = this.makeMat("boots", new Color3(0.46, 0.14, 0.27));
    const beltM = this.makeMat("belt", new Color3(0.34, 0.16, 0.22));
    const goldM = this.makeMat("gold", new Color3(0.94, 0.73, 0.34));
    const blushM = this.makeMat("blush", new Color3(1.0, 0.50, 0.58));
    const darkM = this.makeMat("dark", new Color3(0.10, 0.05, 0.10));
    const eyeHighlightM = this.makeMat(
      "eyeHighlight",
      new Color3(1.0, 0.96, 0.98),
      new Color3(0.06, 0.05, 0.06),
    );
    const steelM = this.makeMat(
      "steel",
      new Color3(0.88, 0.90, 0.96),
      new Color3(0.16, 0.17, 0.22),
    );

    // ---- 脚 ----
    // 箱ではなく縦長の楕円体で構成し、膝まわりを人形っぽく丸める。
    this.hipR = this.node("hipR", this.inner, 0.11, 0.96, 0);
    this.hipL = this.node("hipL", this.inner, -0.11, 0.96, 0);
    for (const hip of [this.hipR, this.hipL]) {
      this.ellipsoid("thigh", 0.16, 0.43, 0.17, skin, hip, 0, -0.215, 0);
    }

    this.kneeR = this.node("kneeR", this.hipR, 0, -0.43, 0);
    this.kneeL = this.node("kneeL", this.hipL, 0, -0.43, 0);
    for (const knee of [this.kneeR, this.kneeL]) {
      this.ellipsoid("stocking", 0.135, 0.31, 0.145, stockingM, knee, 0, -0.155, 0);
      this.ellipsoid("boot", 0.16, 0.22, 0.25, bootsM, knee, 0, -0.385, 0.045);
      this.ellipsoid("bootCuff", 0.17, 0.08, 0.17, topLightM, knee, 0, -0.285, 0);
    }

    // ---- 腰・短いスカート ----
    this.ellipsoid("hips", 0.34, 0.20, 0.25, stockingM, this.inner, 0, 0.99, 0);
    const skirt = MeshBuilder.CreateCylinder(
      "chara-skirt",
      {
        height: 0.25,
        diameterTop: 0.34,
        diameterBottom: 0.54,
        tessellation: 16,
      },
      scene,
    );
    skirt.material = skirtM;
    skirt.parent = this.inner;
    skirt.position.set(0, 1.00, 0);

    const skirtTrim = MeshBuilder.CreateCylinder(
      "chara-skirtTrim",
      {
        height: 0.045,
        diameterTop: 0.54,
        diameterBottom: 0.56,
        tessellation: 16,
      },
      scene,
    );
    skirtTrim.material = topLightM;
    skirtTrim.parent = this.inner;
    skirtTrim.position.set(0, 0.89, 0);

    this.ellipsoid("waist", 0.35, 0.10, 0.24, beltM, this.inner, 0, 1.10, 0);
    this.ellipsoid("waistGem", 0.075, 0.075, 0.035, goldM, this.inner, 0, 1.10, 0.135);

    // ---- 胴 ----
    // torsoをピボットにして、飾りも攻撃モーションに追従させる。
    this.torso = this.node("torsoPivot", this.inner, 0, 1.30, 0);
    this.ellipsoid("torso", 0.38, 0.40, 0.25, topM, this.torso, 0, 0, 0);
    this.ellipsoid("neck", 0.12, 0.12, 0.12, skin, this.torso, 0, 0.235, 0);

    // 胸元の小さなリボン。鎧板を撤去してロボット感を減らす。
    const bowL = this.ellipsoid("bowL", 0.13, 0.08, 0.045, topLightM, this.torso, -0.06, 0.08, 0.135);
    bowL.rotation.z = 0.45;
    const bowR = this.ellipsoid("bowR", 0.13, 0.08, 0.045, topLightM, this.torso, 0.06, 0.08, 0.135);
    bowR.rotation.z = -0.45;
    this.ellipsoid("bowGem", 0.07, 0.07, 0.04, goldM, this.torso, 0, 0.08, 0.155);

    // ---- 腕 ----
    this.shoulderR = this.node("shoulderR", this.inner, 0.255, 1.44, 0);
    this.shoulderL = this.node("shoulderL", this.inner, -0.255, 1.44, 0);
    for (const sh of [this.shoulderR, this.shoulderL]) {
      this.ellipsoid("puffSleeve", 0.17, 0.15, 0.17, topLightM, sh, 0, -0.035, 0);
      this.ellipsoid("upperArm", 0.11, 0.29, 0.12, skin, sh, 0, -0.17, 0);
    }

    this.elbowR = this.node("elbowR", this.shoulderR, 0, -0.30, 0);
    this.elbowL = this.node("elbowL", this.shoulderL, 0, -0.30, 0);
    this.ellipsoid("foreArmR", 0.105, 0.25, 0.115, skin, this.elbowR, 0, -0.125, 0);
    this.ellipsoid("foreArmL", 0.105, 0.25, 0.115, skin, this.elbowL, 0, -0.125, 0);
    this.ellipsoid("handR", 0.12, 0.12, 0.12, skin, this.elbowR, 0, -0.30, 0);
    this.ellipsoid("handL", 0.12, 0.12, 0.12, skin, this.elbowL, 0, -0.30, 0);

    // ---- 剣 (右手) ----
    const swordGrip = new TransformNode("swordGrip", scene);
    swordGrip.parent = this.elbowR;
    swordGrip.position.set(0, -0.32, 0.06);
    swordGrip.rotation.x = Math.PI / 2 - 0.25;
    this.box("grip", 0.05, 0.22, 0.05, beltM, swordGrip, 0, 0, 0);
    this.box("guard", 0.20, 0.045, 0.07, goldM, swordGrip, 0, 0.13, 0);
    this.box("blade", 0.085, 0.95, 0.024, steelM, swordGrip, 0, 0.62, 0);

    // ---- 頭・顔・髪 ----
    // 頭を大きくして約5頭身。顔パーツと髪をheadピボットにまとめることで、
    // 攻撃時のhead.rotationにも表情全体が追従する。
    this.head = this.node("headPivot", this.inner, 0, 1.67, 0);
    this.ellipsoid("face", 0.38, 0.38, 0.37, skin, this.head, 0, 0, 0);

    // 後頭部と頭頂の髪。
    this.ellipsoid("backHair", 0.43, 0.42, 0.38, hairM, this.head, 0, 0.015, -0.055);
    this.ellipsoid("hairCap", 0.39, 0.20, 0.35, hairM, this.head, 0, 0.13, -0.015);

    // 前髪は3束に分けて、角張ったヘルメット感を避ける。
    const bangL = this.ellipsoid("bangL", 0.12, 0.15, 0.075, hairM, this.head, -0.08, 0.10, 0.145);
    bangL.rotation.z = 0.30;
    const bangR = this.ellipsoid("bangR", 0.12, 0.15, 0.075, hairM, this.head, 0.08, 0.10, 0.145);
    bangR.rotation.z = -0.30;
    this.ellipsoid("bangCenter", 0.09, 0.16, 0.07, hairM, this.head, 0, 0.105, 0.158);
    this.ellipsoid("sideLockR", 0.085, 0.24, 0.09, hairM, this.head, 0.165, -0.055, 0.015);
    this.ellipsoid("sideLockL", 0.085, 0.24, 0.09, hairM, this.head, -0.165, -0.055, 0.015);

    // 大きめのアニメ目＋ハイライト。
    for (const sx of [0.072, -0.072]) {
      this.ellipsoid("eye", 0.055, 0.078, 0.025, darkM, this.head, sx, 0.005, 0.184);
      this.ellipsoid("eyeHighlight", 0.017, 0.021, 0.010, eyeHighlightM, this.head, sx - 0.012, 0.025, 0.199);
      this.ellipsoid("blush", 0.050, 0.022, 0.010, blushM, this.head, sx > 0 ? 0.115 : -0.115, -0.055, 0.179);
    }
    this.box("mouth", 0.045, 0.010, 0.010, darkM, this.head, 0, -0.078, 0.188);

    // リボン付きポニーテール。短めのまま、丸いボリュームで可愛さを足す。
    this.ellipsoid("ponytailBase", 0.16, 0.14, 0.14, hairM, this.head, 0, -0.015, -0.185);
    const ribbonL = this.ellipsoid("ribbonL", 0.11, 0.065, 0.035, topLightM, this.head, -0.055, -0.015, -0.215);
    ribbonL.rotation.z = 0.55;
    const ribbonR = this.ellipsoid("ribbonR", 0.11, 0.065, 0.035, topLightM, this.head, 0.055, -0.015, -0.215);
    ribbonR.rotation.z = -0.55;
    this.ponytail = this.ellipsoid("ponytail", 0.15, 0.34, 0.15, hairM, this.head, 0, -0.10, -0.245);
    this.ponytail.rotation.x = 0.55;

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
    this.torso.position.set(0, 1.3, 0);
    this.torso.rotation.set(0, 0, 0);
    this.head.rotation.set(0, 0, 0);
    this.ponytail.rotation.set(0.55, 0, 0);
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
        this.ponytail.rotation.x = 0.55 + Math.sin(t * 2.2 + 0.6) * 0.06;
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
        this.ponytail.rotation.x = 0.72 + Math.abs(Math.sin(p)) * 0.16;
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
    // flash()がdiffuseを書き換えるため、emissive持ち素材は対象外にする。
    if (emissive) this.mats.pop();
    return m;
  }

  private node(name: string, parent: TransformNode, x: number, y: number, z: number): TransformNode {
    const n = new TransformNode(`chara-${name}`, this.scene);
    n.parent = parent;
    n.position.set(x, y, z);
    return n;
  }

  /** 最終的な幅・高さ・奥行きを指定する丸い楕円体。 */
  private ellipsoid(
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
    const mesh = MeshBuilder.CreateSphere(
      `chara-${name}`,
      { diameter: 1, segments: 12 },
      this.scene,
    );
    mesh.material = mat;
    mesh.parent = parent;
    mesh.position.set(x, y, z);
    mesh.scaling.set(w, h, d);
    return mesh;
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
