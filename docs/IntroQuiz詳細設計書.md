# 📘 詳細設計書 v5 (AWS WebSocket 構成対応)

---

## 1. プロジェクト概要

| 項目    | 内容                                         |
| ----- | ------------------------------------------ |
| 名稱    | YouTubeイントロ早投しクイズアプリ                       |
| 目的    | YouTube再生リストからイントロクイズを生成し、オンライン早投し対戦を可能にする |
| ターゲット | 友人間での非公開利用（URL共有ベース）                       |
| 実行環境  | 開発：WSL2 / 本番：AWS EC2 または AWS サーバーレス構成      |

---

## 2. システム構成（AWS WebSocket対応）

```
[React (Vite)] ↔ AWS API Gateway (WebSocket) ↔ Lambda関数群 ↔ DynamoDB
                                                         ↕
                                                  YouTube Data API v3
```

---

## 3. 技術スタック

| 領域     | 技術 (バージョン)                                           |
| ------ | ---------------------------------------------------- |
| 言語     | TypeScript / Python 3.13                             |
| クライアント | React 18.3.1 + Vite 5.x                              |
| サーバー   | AWS Lambda (Python 3.13)                             |
| 通信     | AWS API Gateway WebSocket                            |
| データベース | DynamoDB                                             |
| API連携  | YouTube Data API v3                                  |
| スタイル   | Tailwind CSS (任意)                                    |
| デプロイ   | AWS CDK (TypeScript), AWS Amplify (Frontend Hosting) |

---

## 4. 実行環境 (WSL2)

* `/home/` 配置、`CHOKIDAR_USEPOLLING=true`
* Node.js 18.x (`nvm` 管理)
* Viteは `--host` 指定で LAN内デバッグ可

---

## 5. 機能流れ & データ構造

### 流れ:

1. URL指定 → 動画取得
2. ルーム作成 → 参加者入室
3. 問題開始 → 早投し → 結果表示

### データ構造 (Room, Player)

* DynamoDB構成：

  * `Room` テーブル：roomId, startTimestamp, state
  * `Player` テーブル：roomId, playerId, elapsed, score, connectionId

---

## 6. YouTube API連携

* `playlistItems` で videoId 取得 (50件まで)
* `videos` で `embeddable`, `privacyStatus` を判定
* 有効動画みのフィルタリング
* 同一リストには一時キャッシュ (10分)

---

## 7. 音声再生とDOM制御

* `startQuestion` で動画を再生（iframe）
* `video.play()` 実行時に `videoStartAt = performance.now()` をローカル記録
* `iframe` は `visibility: hidden` または `opacity: 0` で非表示
* `setTimeout(..., 300)` などの延期処理で同期感を補強

---

## 8. 早押し公平性と再接続（AWS構成対応）

* 各クライアントは動画再生タイミング（video.play()）で `videoStartAt = performance.now()` を記録
* ボタン押下時に `elapsed = performance.now() - videoStartAt` を計算し、WebSocket経由でサーバーへ送信
* Lambdaは受信した `elapsed` を DynamoDB に記録し、最も小さい値を持つプレイヤーを先着とみなす
* 不正操作は想定せず、クライアント送信値を信頼（性善説）

---

## 9. WebSocket イベント (API Gateway)

| イベント          | トリガー            | 内容                         |   |
| ------------- | --------------- | -------------------------- | - |
| `$connect`    | 接続              | connectionId 登録など初期処理      |   |
| `$disconnect` | 切断              | 接続解除処理（DynamoDBクリーンアップ）    |   |
| `$default`    | 不明メッセージ         | fallback                   |   |
| `buzz`        | ボタン押下           | プレイヤーが送った `elapsed` を受信・保存 |   |
| `startQuiz`   | クイズ開始、`startT`登 | ホスト操作                      | 録 |

---

## 10. UIデザイン

* Top: リストURL入力, 設定
* Room: 再生/早投し/スコア表示
* Result: 順位表示

---

## 11. テスト箇条

* 単体/組み合わせ/UI/並列競合テスト
* Lambdaのタイムアウト・WebSocket接続切れ・イベント受信漏れ等のケース

---

## 12. 実装前提付証 & 補足指針

(前回と同様の前提一覧 + 新たに以下を追加)

| ID                         | タイトル      | 前提         | 補足                                | 対応     |
| -------------------------- | --------- | ---------- | --------------------------------- | ------ |
| elapsed\_buzz\_measurement | 早押し時間測定方式 | ローカルの差分を使用 | `video.play()` 時点のタイマーと押下タイミングの差分 | 実装反映済み |
| websocket\_broadcast       | 接続全体への通知  | 個別送信必要     | connectionId を用いた個別通知で代替          | 実装検討中  |

---

## 13. CDKデプロイ構成

* スタック名：InfraStack
* 配置ディレクトリ：poc-introquiz/infra/lib/
* Lambda言語：Python 3.13
* Lambda配置パス：lib/lambda/
* デプロイコマンド：cdk deploy

### 作成される主なリソース：

| リソース            | 名前                                                                |
| --------------- | ----------------------------------------------------------------- |
| WebSocket API   | IntroQuizWebSocketApi                                             |
| WebSocket Stage | dev                                                               |
| Lambda関数群       | onConnect, onDisconnect, buzzHandler, startQuizHandler, onDefault |
| DynamoDB        | RoomTable, PlayerTable                                            |

---

## 14. Amplify フロントホスティング構成

* フレームワーク：Vite + React + TypeScript
* デプロイ方法：Amplify Console にて GitHub連携 → 自動ビルド & デプロイ
* 出力ディレクトリ：dist/
* 環境変数：VITE\_WEBSOCKET\_ENDPOINT を Amplify 上で定義
* ホスティング：HTTPS対応 URL（例：\*.amplifyapp.com）
* ビルド設定：

  * Build command：npm run build
  * Output directory：dist
* 拡張性：Amplify Auth や独自ドメイン対応も可能

---

## 結論

* AWS WebSocket API により、サーバーレスでのリアルタイム性とスケーラビリティが両立
* 性善説を前提としたクライアントの `elapsed` 比較により、シンプルかつ実用的な早押しロジックを実現
* CDK を用いたデプロイにより、環境構築の再現性と保守性も確保
* Amplify によるフロントエンドホスティングで、CI/CD と HTTPS 公開が簡便化

今後：CDKテンプレート／Lambdaロジック設計／フロント接続処理の開発へ


## フォルダ構成
/frontend/                               # React + Vite フロントエンド
│
├─ public/                               # 静的ファイル（favicon、robots.txtなど）
├─ src/
│   ├─ pages/                            # 画面単位のコンポーネント
│   │   ├─ Top/                          # トップ画面: URL入力など
│   │   ├─ Room/                         # クイズ中画面: 再生・早押し等
│   │   └─ Result/                       # 結果表示画面
│   ├─ components/                       # 再利用可能なUI部品（Button, Modalなど）
│   ├─ hooks/                            # カスタムフック（useWebSocket等）
│   ├─ stores/                           # Zustand/Redux等による状態管理
│   ├─ types/                            # 型定義（Room, Playerなど）
│   ├─ lib/                              # APIラッパーやユーティリティ（YouTube APIなど）
│   ├─ App.tsx                           # アプリ全体のルーティング
│   ├─ main.tsx                          # アプリ起動エントリポイント
│   └─ index.css                         # グローバルスタイル（Tailwind含む）
├─ tailwind.config.ts                    # Tailwind設定
├─ postcss.config.cjs                    # PostCSS設定
├─ tsconfig.json                         # TypeScript設定
└─ vite.config.ts                        # Vite設定

/infra/                                  # CDKによるAWSリソース構成
│
├─ bin/
│   └─ infra.ts                          # CDKエントリポイント
├─ lib/
│   ├─ infra-stack.ts                    # スタック定義（API, Lambda, DynamoDBなど）
│   └─ lambda/                           # 各Lambda関数（Python 3.13）
│       ├─ onConnect.py
│       ├─ onDisconnect.py
│       ├─ onDefault.py
│       ├─ buzzHandler.py
│       └─ startQuizHandler.py
├─ test/                                 # CDKのユニットテスト
└─ cdk.json                              # CDK設定ファイル

/docs/                                   # 詳細設計書・API仕様・会議メモなど

/scripts/                                # 開発補助・ビルド・デプロイスクリプト等

/README.md                               # プロジェクト説明と導入手順
