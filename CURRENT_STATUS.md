# Current Status

## PASS (2026-09-09 更新)
- 仕様 v0.1 固定 / 技術スタック固定 / ディレクトリ構成固定
- Vite / TypeScript / Babylon.js で `vite build` 成功 (`tsc --noEmit` 成功)
- 空ステージ → Stageクラスに移譲 (地面/遺跡柱Y修正/木/岩)
- 仮主人公モデル (プリミティブ組み立て女性剣士 CharacterModel + 状態別プロシージャルモーション)
- 敵モデル (Blob: 潰れ・ホップ / Golem: 歩行・パンチ、EnemyModel + Wave別編成)
- 1ライン戦闘 (Z移動撤廃。A/Dのみ、敵AI・カメラ・判定すべてX軸。SPEC §3のZ範囲は不使用)
- 固定寄り追従カメラ (activeCamera明示化 + シェイク対応 + Z追従0.35)
- A/D/W/S移動 + Spaceジャンプ (立ち上がり検出、長押し暴発なし)
- 攻撃データ定義一本化 (`combat/AttackDefinition` が正本)
- Player State Machine: Idle/Run/Jump/Fall/Attack1-3/Strong/Dodge/HitLight/HitHeavy/DownBack/GetUp/Defeat
- JJJ 3段コンボ (入力バッファ0.18s、後半キャンセルで回避可)
- K 強攻撃 (前進 + ダウン + 大ヒットストップ/シェイク)
- L 回避 (2.4m/0.28s/無敵0.16s/後硬直0.10s、空中可)
- Hitbox(Box) / Hurtbox(Capsule近似AABB) 実運用 + 1攻撃1hit
- 被弾 / ノックバック / ダウン / 起き上がり無敵 / 敗北
- 敵AI: Idle/Approach/Attack/Cooldown/Hit/Down/Dead + 死亡沈み破棄 (Blob HP50/8dmg, Golem HP100/12dmg)
- Encounter: Blob→Blob+Golem→Blob+Golem+Golem→CLEAR
- HitStop (0.055/0.09/0.12) / CameraShake (小中大)
- VFX: HitEffectスパーク + SlashTrailフラッシュ
- UI: HPバー/Combo/Score/PAUSED/RETRY/CLEAR + R/Enterリトライ + Escポーズ
- Player HP100 / Enemy HP60 / Score加算

## NOT IMPLEMENTED YET (残り)
- Stone Golem / Large Golem / Boss掴み拘束演出
- 本格ステージ進行 (20秒移動/景観区間/遺跡区間/Boss Arena)
- 背景アセット全種 (SPEC §17 の草/茂み/石壁/壊壁/階段/アーチ/木箱など)
- GLB差し替え + アニメーション接続 (現状はCharacterModelの仮見た目+仮モーション)
- サウンド (斬撃/ヒット/被弾/回避/死亡/BGM)
- Boss HPバー / Injured Idle (HP25以下モーション差し替え)
- セーブ (MVP対象外のため不要)

## 操作
A/D 移動 / Space ジャンプ / J 通常攻撃3連 / K 強攻撃 / L 回避 / Esc ポーズ / R リトライ

## 次の実装単位
「Stone Golem (歩行/パンチ/強パンチ/ダウン) + ステージ区間進行 + サウンド」。
