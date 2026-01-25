# muscleManagementApli

個人利用の筋力トレーニング管理アプリ

---

## 概要

5年以上筋力トレーニングを継続しているが、トレーニング内容のマンネリ化や、成長・継続状況が可視化されていないことによるモチベーション低下を解決するためのアプリ。

**トレーニングを「記録できる・振り返れる・トレーニング中も使える」状態を実現します。**

---

## 主な機能（MVP1）

- ✅ トレーニング記録（種目・重量・回数・セット数）
- ✅ 記録一覧・詳細表示
- ✅ 種目履歴可視化（直近5回、連続実施回数）
- ✅ 成長可視化（折れ線グラフ）
- ✅ 継続可視化（カレンダー・ストリーク）
- ✅ タイマー機能（インターバル管理）

---

## 技術スタック

### Frontend
- React
- TypeScript
- GraphQL
- Apollo Client
- Zod

### Backend
- Node.js
- TypeScript
- GraphQL API

### Database
- PostgreSQL
- Sequelize

### Infrastructure
- Docker
- docker-compose

### Test
- Vitest
- Testcontainers

---

## ドキュメント

- [AI協働ルール](./AI_COLLABORATION_RULES.md)
- [要件定義書](./docs/REQUIREMENTS.md)
- [アーキテクチャ設計書](./docs/ARCHITECTURE.md)

---

## セットアップ（開発予定）

```bash
# リポジトリクローン
git clone <repository-url>
cd muscleManagementApli

# 依存関係インストール
npm install

# Docker起動
docker-compose up -d

# マイグレーション実行
npm run migrate

# 開発サーバー起動
npm run dev
```

---

## 開発状況

- [x] プロジェクト初期設定
- [x] 要件定義
- [x] アーキテクチャ設計
- [ ] DB設計
- [ ] API設計
- [ ] バックエンド実装
- [ ] フロントエンド実装
- [ ] テスト実装

---

## ライセンス

個人利用プロジェクト

---

## 作成者

siro

---

## 更新履歴

- 2026-01-21：プロジェクト開始、基本ドキュメント作成
