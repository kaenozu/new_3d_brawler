# 2.5D 3D Action Game Specification v0.1

## 1. コアコンセプト

- 完全新規タイトル
- 3D描画の2.5Dベルトスクロール剣戟アクション
- 世界観はシンプルなスタイライズド・ファンタジー
- 参考画像から借りるのは「画面密度」「少し見下ろした固定寄りカメラ」「背景の奥行き」「スタイライズド3D」のみ
- 主人公は成人女性の剣士
- 武器は片手剣1本
- 制作しやすさ最優先

## 2. アート

- Low Poly寄り Stylized 3D
- Toon寄りシェーディング
- 背景は草原 / 木 / 岩 / 石壁 / 柱 / 廃墟 / 山 / 空
- 背景はモジュール再利用
- 主人公だけ背景より一段高品質
- 長いマント、ロングスカート、複雑な布物理はMVPでは使わない

## 3. 座標系

- X = 左右
- Y = 高さ
- Z = 奥行き
- 奥行き移動範囲: Z = -2.0 ～ +2.0
- 1 unit ≒ 1m

## 4. 主人公

- 身長: 約1.70 units
- 当たり判定: Capsule
- 半径: 0.32
- 高さ: 1.55
- 見た目モデルと当たり判定は分離

## 5. 操作

| Input | Action |
|---|---|
| A / D | 左右移動 |
| W / S | 奥 / 手前移動 |
| Space | ジャンプ |
| J | 通常攻撃 |
| K | 強攻撃 |
| L | 回避 |
| Esc | Pause |

MVPでは特殊技・ジャンプ攻撃・パリィ・スキルツリーは入れない。

## 6. 移動パラメータ

- 横移動速度: 5.0 m/s
- 奥行き速度: 3.2 m/s
- ジャンプ初速: 7.0
- 重力: 20.0
- 回避距離: 2.4m
- 回避時間: 0.28秒
- 無敵時間: 0.16秒
- 回避後硬直: 0.10秒

## 7. カメラ

- Perspective Camera
- 自由回転なし
- 少し見下ろす
- FOV: 45°
- 高さ: 約4.5m
- プレイヤー距離: 約10～12m
- X方向を滑らかに追従
- 進行方向を少し広く見せる
- 通常戦闘中の自動ズームなし

## 8. Player State

- Idle
- Run
- Jump
- Fall
- Attack1
- Attack2
- Attack3
- StrongAttack
- Dodge
- HitLight
- HitHeavy
- Knockback
- Launch
- DownBack
- DownFront
- GetUp
- Grabbed
- Thrown
- Defeat

## 9. 通常攻撃

JJJの3段コンボ。

| Attack | Duration | Damage |
|---|---:|---:|
| Attack1 | 0.35s | 10 |
| Attack2 | 0.38s | 12 |
| Attack3 | 0.52s | 20 |

- Attack3は強ノックバック
- 入力バッファ: 0.18秒

## 10. 強攻撃

- K
- Duration: 0.70秒
- Damage: 30
- ヒット時ダウン
- 少し前進
- 通常攻撃からの派生はMVPではなし

## 11. 戦闘判定

- 物理エンジン不使用
- Player: Capsule Hurtbox
- Enemy: Capsule Hurtbox
- Attack: Box Hitbox
- 1攻撃につき同一敵へ1hit

## 12. ヒット演出

### 通常
- Hit Stop: 0.055s
- Camera Shake: 小
- Spark: 小
- Slash Trail: あり
- Knockback: 小

### Attack3
- Hit Stop: 0.09s
- Camera Shake: 中
- Knockback: 中

### Strong
- Hit Stop: 0.12s
- Camera Shake: 大
- Down: あり

## 13. 被弾・敗北表現

性的表現ではなく、被弾・拘束・ダウン・敗北リアクションを濃くする。

Player HP: 100

対応リアクション:
- HitLight
- HitHeavy
- Knockback
- Launch
- DownBack
- DownFront
- GetUp
- Grabbed
- Thrown
- Defeat

HP25以下:
- Injured Idleへ変更
- 移動速度・攻撃力は変えない

### 敗北フロー
最終被弾
→ Hit Stop
→ よろけ
→ 武器を落とす
→ 倒れる
→ 約1.5秒
→ 暗転
→ RETRY

## 14. 敵

### Enemy A: Blob
- 移動
- ジャンプ体当たり
- 被弾
- 死亡
- Skeletonなしでも成立

### Enemy B: Stone Golem
- 歩く
- パンチ
- 強パンチ
- 被弾
- ダウン
- 死亡

### Enemy C / Boss: Large Golem
- Stone Golem流用
- パンチ
- 振り下ろし
- 突進
- 掴み

## 15. Enemy AI

States:
- Idle
- Approach
- Attack
- Cooldown
- Hit
- Down
- Dead

最大同時敵数: 4

## 16. 第1ステージ

仮称: Grassland Ruins
プレイ時間: 約5～8分

進行:
START
→ 移動20秒
→ Blob x3
→ 景観区間
→ Blob x2 + Stone Golem x1
→ 遺跡区間
→ Stone Golem x2
→ Boss Arena
→ Large Golem
→ CLEAR

## 17. 背景アセット

- Grass ground x2
- Rock x3
- Tree x3
- Bush x2
- Stone wall x2
- Broken wall x2
- Pillar x2
- Stair x1
- Arch x1
- Crate x1

## 18. UI

左上:
- PLAYER
- HP BAR

右上:
- COMBO
- SCORE

Boss:
- 画面下部にBoss HP Bar

Pause / Retry以外はMVPでは不要。

## 19. サウンド

最低限:
- 通常斬撃
- 強斬撃
- ヒット
- 強ヒット
- 主人公被弾
- 敵被弾
- ジャンプ
- 回避
- 敵死亡
- BGM x1

## 20. 技術

- TypeScript
- Vite
- Babylon.js
- WebGL2
- GLB / glTF
- HTML/CSS UI
- Reactなし
- 物理エンジンなし
- ECSなし
- バックエンドなし
- MVPセーブなし
- Desktop Chrome優先
- 1920x1080 / 60fps目標

## 21. コード構造

src/
- core/
- player/
- combat/
- enemy/
- camera/
- stage/
- effects/
- ui/
- data/

## 22. 実装順序

1. Babylon.jsで空ステージ表示
2. Capsule主人公移動
3. カメラ
4. ジャンプ
5. Dummy敵
6. Hitbox / Hurtbox
7. 3段コンボ
8. Strong Attack
9. 被弾
10. Knockback / Down
11. Dodge
12. Enemy AI
13. 2～4体戦闘
14. Encounter進行
15. Hit Stop
16. Camera Shake
17. Effect
18. HP / Combo UI
19. Stage構築
20. Player GLB差し替え
21. Enemy GLB差し替え
22. Animation接続
23. Boss
24. Grab / Defeat演出
25. Sound
26. Tuning

## 23. Vertical Slice 合格条件

- 1080pで概ね60fps
- 移動が引っ掛からない
- カメラが酔いにくい
- JJJが自然につながる
- 攻撃命中感が明確
- Dodge反応が良い
- 2体以上でもAI破綻しない
- Knockback → Down → GetUp が安定
- Defeat → Retry が成立
- プリミティブでも画角が成立

## 24. 今は決めないもの

- タイトル
- 主人公名
- 詳細ストーリー
- 衣装最終デザイン
- ステージ2以降
- スキルツリー
- 装備
- ショップ
- セーブ
