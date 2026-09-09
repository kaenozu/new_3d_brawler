# New 3D Brawler v0.1

完全新規のブラウザ向け 2.5D / 3D ベルトスクロール剣戟アクション用スターターです。

## 現在の状態

このZIPは **実装開始用の仕様固定版 + コンパイル可能な最小スキャフォールド** です。

まだ製品版の戦闘は未実装です。まず以下の順序で作る前提です。

1. 空ステージ
2. Capsule主人公移動
3. 固定追従カメラ
4. ジャンプ
5. Dummy敵
6. Hitbox / Hurtbox
7. JJJ 3段コンボ
8. K 強攻撃
9. 被弾 / ノックバック / ダウン
10. L 回避
11. 敵AI
12. ヒットストップ / カメラシェイク
13. Encounter進行
14. UI
15. GLB差し替え
16. Boss / 拘束 / 敗北演出

## 技術

- TypeScript
- Vite
- Babylon.js
- WebGL2
- HTML/CSS UI
- Reactなし
- 物理エンジンなし
- ECSなし

## 起動

```bash
npm install
npm run dev
```

## ビルド

```bash
npm run build
```

## 仕様

`SPEC_v0.1.md` を参照してください。
