import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 現在日付を基準とした日付ヘルパー（実行日を0とする）
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = (offsetDays: number): Date => {
    const date = new Date(today);
    date.setDate(date.getDate() + offsetDays);
    return date;
  };

  // パスワードをハッシュ化
  const hashedPassword = await bcrypt.hash('demo1234', 10);

  // ========== ユーザー作成 ==========
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'demo@nexwork.com' },
      update: {},
      create: {
        email: 'demo@nexwork.com',
        password: hashedPassword,
        name: '田中 太郎',
        bio: 'プロジェクトマネージャー。NexWorkの開発リーダーです。',
      },
    }),
    prisma.user.upsert({
      where: { email: 'sato@nexwork.com' },
      update: {},
      create: {
        email: 'sato@nexwork.com',
        password: hashedPassword,
        name: '佐藤 花子',
        bio: 'フロントエンドエンジニア。UIデザインが得意です。',
      },
    }),
    prisma.user.upsert({
      where: { email: 'suzuki@nexwork.com' },
      update: {},
      create: {
        email: 'suzuki@nexwork.com',
        password: hashedPassword,
        name: '鈴木 一郎',
        bio: 'バックエンドエンジニア。API設計を担当しています。',
      },
    }),
    prisma.user.upsert({
      where: { email: 'yamada@nexwork.com' },
      update: {},
      create: {
        email: 'yamada@nexwork.com',
        password: hashedPassword,
        name: '山田 美咲',
        bio: 'デザイナー。ユーザー体験の向上に取り組んでいます。',
      },
    }),
    prisma.user.upsert({
      where: { email: 'kimura@nexwork.com' },
      update: {},
      create: {
        email: 'kimura@nexwork.com',
        password: hashedPassword,
        name: '木村 健太',
        bio: 'QAエンジニア。品質保証とテスト自動化を推進しています。',
      },
    }),
    prisma.user.upsert({
      where: { email: 'watanabe@nexwork.com' },
      update: {},
      create: {
        email: 'watanabe@nexwork.com',
        password: hashedPassword,
        name: '渡辺 優子',
        bio: 'インフラエンジニア。CI/CDとクラウド運用を担当しています。',
      },
    }),
  ]);

  const [tanaka, sato, suzuki, yamada, kimura, watanabe] = users;
  console.log(`Created ${users.length} users`);

  // ========== プロジェクト1: NexWork開発 ==========
  const project1 = await prisma.project.create({
    data: {
      name: 'NexWork 開発プロジェクト',
      description: 'チームのタスク管理を効率化するWebアプリケーションの開発プロジェクト',
      members: {
        create: [
          { userId: tanaka.id, role: 'owner' },
          { userId: sato.id, role: 'admin' },
          { userId: suzuki.id, role: 'member' },
          { userId: yamada.id, role: 'member' },
          { userId: kimura.id, role: 'member' },
          { userId: watanabe.id, role: 'member' },
        ],
      },
    },
  });

  // マイルストーン作成（今日=実行日基準）
  const milestone1_1 = await prisma.milestone.create({
    data: {
      name: 'フェーズ1: MVP完成',
      description: '基本機能の実装完了',
      dueDate: d(-5),
      status: 'completed',
      projectId: project1.id,
    },
  });

  const milestone1_2 = await prisma.milestone.create({
    data: {
      name: 'フェーズ2: 機能拡張',
      description: 'ガントチャート・通知機能の追加',
      dueDate: d(12),
      status: 'pending',
      projectId: project1.id,
    },
  });

  const milestone1_3 = await prisma.milestone.create({
    data: {
      name: 'フェーズ3: リリース準備',
      description: '本番環境へのデプロイとドキュメント整備',
      dueDate: d(30),
      status: 'pending',
      projectId: project1.id,
    },
  });

  // タグ作成
  const tags1 = await Promise.all([
    prisma.tag.create({ data: { name: 'フロントエンド', color: '#3b82f6', projectId: project1.id } }),
    prisma.tag.create({ data: { name: 'バックエンド', color: '#10b981', projectId: project1.id } }),
    prisma.tag.create({ data: { name: 'デザイン', color: '#f59e0b', projectId: project1.id } }),
    prisma.tag.create({ data: { name: 'バグ修正', color: '#ef4444', projectId: project1.id } }),
    prisma.tag.create({ data: { name: 'ドキュメント', color: '#8b5cf6', projectId: project1.id } }),
    prisma.tag.create({ data: { name: 'インフラ', color: '#64748b', projectId: project1.id } }),
    prisma.tag.create({ data: { name: 'テスト', color: '#14b8a6', projectId: project1.id } }),
  ]);

  // ========== タスク作成 - プロジェクト1 ==========

  // 完了タスク1: ユーザー認証（1/25-2/02完了）
  const task1_1 = await prisma.task.create({
    data: {
      title: 'ユーザー認証機能の実装',
      description: 'JWT認証を使用したログイン・登録機能を実装する',
      status: 'done',
      priority: 'high',
      startDate: d(-19),
      dueDate: d(-11),
      actualStartDate: d(-19),
      actualEndDate: d(-12),
      estimatedHours: 24,
      actualHours: 20,
      progress: 100,
      projectId: project1.id,
      createdById: tanaka.id,
      milestoneId: milestone1_1.id,
      assignees: { create: [{ userId: suzuki.id }] },
      subtasks: {
        create: [
          { title: 'JWTトークン生成の実装', completed: true, order: 0 },
          { title: 'ログインAPIの作成', completed: true, order: 1 },
          { title: '登録APIの作成', completed: true, order: 2 },
          { title: 'パスワードリセット機能', completed: true, order: 3 },
        ],
      },
      comments: {
        create: [
          { content: '認証フローの設計が完了しました。JWTを使用します。', userId: suzuki.id },
          { content: 'レビュー完了。実装問題なしです！', userId: tanaka.id },
        ],
      },
      tags: { create: [{ tagId: tags1[1].id }] },
    },
  });

  // 完了タスク2: ダッシュボード（1/30-2/08完了）
  const task1_2 = await prisma.task.create({
    data: {
      title: 'ダッシュボード画面の作成',
      description: 'タスクの統計情報やプロジェクト一覧を表示するダッシュボード',
      status: 'done',
      priority: 'high',
      startDate: d(-14),
      dueDate: d(-5),
      actualStartDate: d(-14),
      actualEndDate: d(-6),
      estimatedHours: 16,
      actualHours: 18,
      progress: 100,
      projectId: project1.id,
      createdById: tanaka.id,
      milestoneId: milestone1_1.id,
      assignees: { create: [{ userId: sato.id }, { userId: yamada.id }] },
      subtasks: {
        create: [
          { title: '統計カードのコンポーネント作成', completed: true, order: 0 },
          { title: 'チャートの実装', completed: true, order: 1 },
          { title: 'レスポンシブ対応', completed: true, order: 2 },
        ],
      },
      tags: { create: [{ tagId: tags1[0].id }, { tagId: tags1[2].id }] },
    },
  });

  // 完了タスク3: カンバンボード（2/02-2/10完了）
  const task1_2b = await prisma.task.create({
    data: {
      title: 'カンバンボードの実装',
      description: 'ドラッグ＆ドロップでタスクのステータスを変更できるカンバンボード',
      status: 'done',
      priority: 'high',
      startDate: d(-11),
      dueDate: d(-3),
      actualStartDate: d(-11),
      actualEndDate: d(-4),
      estimatedHours: 20,
      actualHours: 22,
      progress: 100,
      projectId: project1.id,
      createdById: tanaka.id,
      milestoneId: milestone1_1.id,
      assignees: { create: [{ userId: sato.id }] },
      subtasks: {
        create: [
          { title: 'ボードレイアウトの作成', completed: true, order: 0 },
          { title: 'カード表示の実装', completed: true, order: 1 },
          { title: 'ドラッグ＆ドロップ機能', completed: true, order: 2 },
          { title: 'ステータス変更API連携', completed: true, order: 3 },
        ],
      },
      tags: { create: [{ tagId: tags1[0].id }] },
    },
  });

  // 完了タスク4: DB設計とマイグレーション（1/20-1/28完了）
  const task1_2c = await prisma.task.create({
    data: {
      title: 'データベース設計とマイグレーション',
      description: 'Prismaスキーマの設計とマイグレーションファイルの作成',
      status: 'done',
      priority: 'high',
      startDate: d(-24),
      dueDate: d(-16),
      actualStartDate: d(-24),
      actualEndDate: d(-17),
      estimatedHours: 16,
      actualHours: 14,
      progress: 100,
      projectId: project1.id,
      createdById: tanaka.id,
      milestoneId: milestone1_1.id,
      assignees: { create: [{ userId: suzuki.id }] },
      subtasks: {
        create: [
          { title: 'ER図の作成', completed: true, order: 0 },
          { title: 'Prismaスキーマ定義', completed: true, order: 1 },
          { title: 'マイグレーション実行', completed: true, order: 2 },
          { title: 'シードデータ作成', completed: true, order: 3 },
        ],
      },
      comments: {
        create: [
          { content: 'ER図を確認しました。問題なさそうです。', userId: tanaka.id },
          { content: 'マイグレーション完了しました。開発環境で確認できます。', userId: suzuki.id },
        ],
      },
      tags: { create: [{ tagId: tags1[1].id }] },
    },
  });

  // 完了タスク5: CI/CDパイプライン構築（1/22-2/03完了）
  const task1_2d = await prisma.task.create({
    data: {
      title: 'CI/CDパイプラインの構築',
      description: 'GitHub ActionsでのCI/CD環境の構築。テスト自動化とデプロイ自動化',
      status: 'done',
      priority: 'medium',
      startDate: d(-22),
      dueDate: d(-10),
      actualStartDate: d(-22),
      actualEndDate: d(-11),
      estimatedHours: 20,
      actualHours: 18,
      progress: 100,
      projectId: project1.id,
      createdById: tanaka.id,
      milestoneId: milestone1_1.id,
      assignees: { create: [{ userId: watanabe.id }] },
      subtasks: {
        create: [
          { title: 'GitHub Actions設定', completed: true, order: 0 },
          { title: 'テスト自動実行の設定', completed: true, order: 1 },
          { title: 'ステージング環境へのデプロイ', completed: true, order: 2 },
          { title: 'Docker化', completed: true, order: 3 },
        ],
      },
      comments: {
        create: [
          { content: 'mainブランチへのpush時に自動デプロイされるようになりました。', userId: watanabe.id },
        ],
      },
      tags: { create: [{ tagId: tags1[5].id }] },
    },
  });

  // 進行中タスク1: ガントチャート（2/05開始、期限2/20）
  const task1_3 = await prisma.task.create({
    data: {
      title: 'ガントチャート機能の実装',
      description: 'タスクのスケジュールを視覚的に表示するガントチャートを実装',
      status: 'in_progress',
      priority: 'high',
      startDate: d(-8),
      dueDate: d(7),
      actualStartDate: d(-8),
      estimatedHours: 32,
      actualHours: 20,
      progress: 65,
      projectId: project1.id,
      createdById: tanaka.id,
      milestoneId: milestone1_2.id,
      assignees: { create: [{ userId: sato.id }] },
      subtasks: {
        create: [
          { title: 'ガントチャートUIの設計', completed: true, order: 0 },
          { title: 'タイムライン表示の実装', completed: true, order: 1 },
          { title: 'タスクバーの表示', completed: true, order: 2 },
          { title: '依存関係の線表示', completed: false, order: 3 },
          { title: 'ズーム機能', completed: false, order: 4 },
        ],
      },
      comments: {
        create: [
          { content: 'デザインカンプをFigmaにアップしました。確認お願いします。', userId: yamada.id },
          { content: '確認しました！この方向で進めましょう。', userId: tanaka.id },
          { content: '基本的な表示ができました。依存関係の線を今作業中です。', userId: sato.id },
        ],
      },
      tags: { create: [{ tagId: tags1[0].id }] },
    },
  });

  // 進行中タスク2: WebSocket通知（2/08開始、期限2/18）
  const task1_4 = await prisma.task.create({
    data: {
      title: 'WebSocket通知機能',
      description: 'リアルタイムでタスクの更新を通知する機能',
      status: 'in_progress',
      priority: 'high',
      startDate: d(-5),
      dueDate: d(5),
      actualStartDate: d(-5),
      estimatedHours: 24,
      actualHours: 12,
      progress: 50,
      projectId: project1.id,
      createdById: tanaka.id,
      milestoneId: milestone1_2.id,
      assignees: { create: [{ userId: suzuki.id }] },
      subtasks: {
        create: [
          { title: 'Socket.io サーバー設定', completed: true, order: 0 },
          { title: 'クライアント接続の実装', completed: true, order: 1 },
          { title: 'イベントハンドラーの作成', completed: false, order: 2 },
          { title: '通知UIの実装', completed: false, order: 3 },
        ],
      },
      comments: {
        create: [
          { content: 'サーバー側の設定完了しました。クライアント側の接続テスト中です。', userId: suzuki.id },
        ],
      },
      tags: { create: [{ tagId: tags1[1].id }] },
    },
  });

  // 進行中タスク3: メンバー管理（2/10開始、期限2/15）- 期限間近
  const task1_4b = await prisma.task.create({
    data: {
      title: 'プロジェクトメンバー管理機能',
      description: 'メンバーの招待・削除・権限管理機能',
      status: 'in_progress',
      priority: 'medium',
      startDate: d(-3),
      dueDate: d(2),
      actualStartDate: d(-3),
      estimatedHours: 16,
      actualHours: 6,
      progress: 35,
      projectId: project1.id,
      createdById: tanaka.id,
      milestoneId: milestone1_2.id,
      assignees: { create: [{ userId: suzuki.id }, { userId: sato.id }] },
      subtasks: {
        create: [
          { title: 'メンバー一覧表示', completed: true, order: 0 },
          { title: '招待機能の実装', completed: false, order: 1 },
          { title: '権限設定UI', completed: false, order: 2 },
        ],
      },
      tags: { create: [{ tagId: tags1[0].id }, { tagId: tags1[1].id }] },
    },
  });

  // 進行中タスク4: E2Eテスト作成（2/07開始、期限2/18）
  const task1_4c = await prisma.task.create({
    data: {
      title: 'E2Eテストの作成',
      description: 'PlaywrightによるE2Eテストの作成。主要フローをカバーする',
      status: 'in_progress',
      priority: 'medium',
      startDate: d(-6),
      dueDate: d(5),
      actualStartDate: d(-6),
      estimatedHours: 24,
      actualHours: 10,
      progress: 40,
      projectId: project1.id,
      createdById: tanaka.id,
      milestoneId: milestone1_2.id,
      assignees: { create: [{ userId: kimura.id }] },
      subtasks: {
        create: [
          { title: 'Playwright環境セットアップ', completed: true, order: 0 },
          { title: 'ログインフローのテスト', completed: true, order: 1 },
          { title: 'タスクCRUDのテスト', completed: false, order: 2 },
          { title: 'プロジェクト管理のテスト', completed: false, order: 3 },
          { title: 'ガントチャートのテスト', completed: false, order: 4 },
        ],
      },
      comments: {
        create: [
          { content: 'ログイン周りのテストが通るようになりました。次はタスクCRUDを書きます。', userId: kimura.id },
          { content: 'テストカバレッジの目標は80%以上でお願いします。', userId: tanaka.id },
        ],
      },
      tags: { create: [{ tagId: tags1[6].id }] },
    },
  });

  // 進行中タスク5: ダークモード対応（2/11開始、期限2/17）
  const task1_4d = await prisma.task.create({
    data: {
      title: 'ダークモード対応',
      description: 'アプリ全体のダークモードテーマを実装する',
      status: 'in_progress',
      priority: 'low',
      startDate: d(-2),
      dueDate: d(4),
      actualStartDate: d(-2),
      estimatedHours: 12,
      actualHours: 4,
      progress: 25,
      projectId: project1.id,
      createdById: yamada.id,
      milestoneId: milestone1_2.id,
      assignees: { create: [{ userId: yamada.id }, { userId: sato.id }] },
      subtasks: {
        create: [
          { title: 'カラートークン定義', completed: true, order: 0 },
          { title: 'テーマ切替コンポーネント', completed: false, order: 1 },
          { title: '各画面のダークモード対応', completed: false, order: 2 },
        ],
      },
      tags: { create: [{ tagId: tags1[0].id }, { tagId: tags1[2].id }] },
    },
  });

  // 未着手タスク1: APIドキュメント（2/16開始予定、期限2/25）
  const task1_5 = await prisma.task.create({
    data: {
      title: 'API ドキュメントの作成',
      description: 'Swagger/OpenAPIを使用したAPIドキュメントの整備',
      status: 'todo',
      priority: 'medium',
      startDate: d(3),
      dueDate: d(12),
      estimatedHours: 16,
      progress: 0,
      projectId: project1.id,
      createdById: tanaka.id,
      milestoneId: milestone1_3.id,
      assignees: { create: [{ userId: suzuki.id }] },
      tags: { create: [{ tagId: tags1[4].id }] },
    },
  });

  // 未着手タスク2: ユーザーマニュアル（2/20開始予定、期限3/01）
  const task1_6 = await prisma.task.create({
    data: {
      title: 'ユーザーマニュアルの作成',
      description: 'エンドユーザー向けの操作マニュアルを作成',
      status: 'todo',
      priority: 'low',
      startDate: d(7),
      dueDate: d(16),
      estimatedHours: 12,
      progress: 0,
      projectId: project1.id,
      createdById: tanaka.id,
      milestoneId: milestone1_3.id,
      assignees: { create: [{ userId: yamada.id }] },
      tags: { create: [{ tagId: tags1[4].id }] },
    },
  });

  // 未着手タスク3: パフォーマンス最適化（2/24開始予定、期限3/06）
  const task1_7 = await prisma.task.create({
    data: {
      title: 'パフォーマンス最適化',
      description: '大量タスク時のレンダリング性能を改善。仮想スクロールの導入を検討',
      status: 'todo',
      priority: 'medium',
      startDate: d(11),
      dueDate: d(21),
      estimatedHours: 20,
      progress: 0,
      projectId: project1.id,
      createdById: tanaka.id,
      milestoneId: milestone1_3.id,
      assignees: { create: [{ userId: sato.id }, { userId: suzuki.id }] },
      tags: { create: [{ tagId: tags1[0].id }, { tagId: tags1[1].id }] },
    },
  });

  // 未着手タスク4: モバイル対応
  const task1_8 = await prisma.task.create({
    data: {
      title: 'モバイルレスポンシブ対応の強化',
      description: 'スマートフォン・タブレットでの表示最適化',
      status: 'todo',
      priority: 'low',
      dueDate: d(25),
      estimatedHours: 16,
      progress: 0,
      projectId: project1.id,
      createdById: tanaka.id,
      milestoneId: milestone1_3.id,
      assignees: { create: [{ userId: yamada.id }, { userId: sato.id }] },
      tags: { create: [{ tagId: tags1[0].id }, { tagId: tags1[2].id }] },
    },
  });

  // 未着手タスク5: セキュリティ監査（2/18開始予定、期限2/28）
  const task1_9 = await prisma.task.create({
    data: {
      title: 'セキュリティ監査と脆弱性対応',
      description: 'OWASP Top 10に基づくセキュリティチェックと脆弱性の修正',
      status: 'todo',
      priority: 'high',
      startDate: d(5),
      dueDate: d(15),
      estimatedHours: 24,
      progress: 0,
      projectId: project1.id,
      createdById: tanaka.id,
      milestoneId: milestone1_3.id,
      assignees: { create: [{ userId: kimura.id }, { userId: suzuki.id }] },
      tags: { create: [{ tagId: tags1[1].id }, { tagId: tags1[6].id }] },
    },
  });

  // 未着手タスク6: ログ監視（3/01開始予定、期限3/10）
  const task1_10 = await prisma.task.create({
    data: {
      title: 'ログ監視とアラート設定',
      description: 'エラーログの監視体制を構築し、Slackへのアラート通知を設定',
      status: 'todo',
      priority: 'medium',
      startDate: d(16),
      dueDate: d(25),
      estimatedHours: 16,
      progress: 0,
      projectId: project1.id,
      createdById: tanaka.id,
      milestoneId: milestone1_3.id,
      assignees: { create: [{ userId: watanabe.id }] },
      tags: { create: [{ tagId: tags1[5].id }] },
    },
  });

  // 未着手タスク7: ファイルアップロード機能（2/17開始予定、期限2/24）
  const task1_11 = await prisma.task.create({
    data: {
      title: 'ファイルアップロード機能',
      description: 'タスクへの添付ファイルアップロード機能。S3連携を使用',
      status: 'todo',
      priority: 'medium',
      startDate: d(4),
      dueDate: d(11),
      estimatedHours: 20,
      progress: 0,
      projectId: project1.id,
      createdById: tanaka.id,
      milestoneId: milestone1_2.id,
      assignees: { create: [{ userId: suzuki.id }, { userId: watanabe.id }] },
      tags: { create: [{ tagId: tags1[1].id }, { tagId: tags1[5].id }] },
    },
  });

  // 依存関係を追加
  await Promise.all([
    prisma.taskDependency.create({
      data: { taskId: task1_3.id, dependsOnId: task1_2.id },
    }),
    prisma.taskDependency.create({
      data: { taskId: task1_5.id, dependsOnId: task1_4.id },
    }),
    prisma.taskDependency.create({
      data: { taskId: task1_7.id, dependsOnId: task1_3.id },
    }),
    prisma.taskDependency.create({
      data: { taskId: task1_9.id, dependsOnId: task1_4c.id },
    }),
    prisma.taskDependency.create({
      data: { taskId: task1_10.id, dependsOnId: task1_2d.id },
    }),
  ]);

  // アクティビティログを追加（プロジェクト1）
  await Promise.all([
    prisma.activityLog.create({
      data: {
        action: 'status_changed',
        fieldName: 'status',
        oldValue: 'in_progress',
        newValue: 'done',
        description: 'タスクを完了にしました',
        taskId: task1_1.id,
        userId: suzuki.id,
      },
    }),
    prisma.activityLog.create({
      data: {
        action: 'status_changed',
        fieldName: 'status',
        oldValue: 'in_progress',
        newValue: 'done',
        description: 'タスクを完了にしました',
        taskId: task1_2.id,
        userId: sato.id,
      },
    }),
    prisma.activityLog.create({
      data: {
        action: 'status_changed',
        fieldName: 'status',
        oldValue: 'todo',
        newValue: 'in_progress',
        description: 'タスクを開始しました',
        taskId: task1_3.id,
        userId: sato.id,
      },
    }),
    prisma.activityLog.create({
      data: {
        action: 'progress_updated',
        fieldName: 'progress',
        oldValue: '50',
        newValue: '65',
        description: '進捗を更新しました',
        taskId: task1_3.id,
        userId: sato.id,
      },
    }),
    prisma.activityLog.create({
      data: {
        action: 'assignee_added',
        description: '木村 健太をアサインしました',
        taskId: task1_4c.id,
        userId: tanaka.id,
      },
    }),
  ]);

  console.log('Created Project 1: NexWork開発プロジェクト');

  // ========== プロジェクト2: マーケティング ==========
  const project2 = await prisma.project.create({
    data: {
      name: '春の新製品キャンペーン',
      description: '2026年春の新製品ローンチに向けたマーケティング施策',
      members: {
        create: [
          { userId: tanaka.id, role: 'owner' },
          { userId: yamada.id, role: 'admin' },
          { userId: sato.id, role: 'member' },
          { userId: kimura.id, role: 'member' },
        ],
      },
    },
  });

  const milestone2_1 = await prisma.milestone.create({
    data: {
      name: '企画フェーズ',
      description: 'キャンペーン企画と素材準備',
      dueDate: d(7),
      status: 'pending',
      projectId: project2.id,
    },
  });

  const milestone2_2 = await prisma.milestone.create({
    data: {
      name: '実施フェーズ',
      description: 'キャンペーン実施と効果測定',
      dueDate: d(40),
      status: 'pending',
      projectId: project2.id,
    },
  });

  const tags2 = await Promise.all([
    prisma.tag.create({ data: { name: 'SNS', color: '#ec4899', projectId: project2.id } }),
    prisma.tag.create({ data: { name: '広告', color: '#f97316', projectId: project2.id } }),
    prisma.tag.create({ data: { name: 'コンテンツ', color: '#06b6d4', projectId: project2.id } }),
    prisma.tag.create({ data: { name: '分析', color: '#84cc16', projectId: project2.id } }),
    prisma.tag.create({ data: { name: '動画', color: '#a855f7', projectId: project2.id } }),
  ]);

  // 完了タスク: ターゲット顧客分析
  await prisma.task.create({
    data: {
      title: 'ターゲット顧客分析',
      description: '新製品のターゲット層を分析し、ペルソナを作成',
      status: 'done',
      priority: 'high',
      startDate: d(-16),
      dueDate: d(-9),
      actualStartDate: d(-16),
      actualEndDate: d(-10),
      estimatedHours: 16,
      actualHours: 14,
      progress: 100,
      projectId: project2.id,
      createdById: tanaka.id,
      milestoneId: milestone2_1.id,
      assignees: { create: [{ userId: yamada.id }] },
      comments: {
        create: [
          { content: 'ペルソナ3パターンを作成しました。資料を共有します。', userId: yamada.id },
        ],
      },
      tags: { create: [{ tagId: tags2[3].id }] },
    },
  });

  // 完了タスク: 競合調査
  await prisma.task.create({
    data: {
      title: '競合他社キャンペーン調査',
      description: '競合3社の直近キャンペーンを分析し、差別化ポイントを明確にする',
      status: 'done',
      priority: 'medium',
      startDate: d(-14),
      dueDate: d(-7),
      actualStartDate: d(-14),
      actualEndDate: d(-8),
      estimatedHours: 12,
      actualHours: 10,
      progress: 100,
      projectId: project2.id,
      createdById: tanaka.id,
      milestoneId: milestone2_1.id,
      assignees: { create: [{ userId: kimura.id }] },
      subtasks: {
        create: [
          { title: 'A社分析レポート', completed: true, order: 0 },
          { title: 'B社分析レポート', completed: true, order: 1 },
          { title: 'C社分析レポート', completed: true, order: 2 },
          { title: '比較まとめ資料作成', completed: true, order: 3 },
        ],
      },
      comments: {
        create: [
          { content: '3社分の分析レポートを共有しました。A社はSNS中心、B社はインフルエンサー重視でした。', userId: kimura.id },
          { content: '参考になりました！我々はUGCを軸にしましょう。', userId: tanaka.id },
        ],
      },
      tags: { create: [{ tagId: tags2[3].id }] },
    },
  });

  // 進行中タスク: SNSキャンペーン企画
  await prisma.task.create({
    data: {
      title: 'SNSキャンペーン企画',
      description: 'Instagram・X（Twitter）向けのキャンペーン企画書作成',
      status: 'in_progress',
      priority: 'high',
      startDate: d(-8),
      dueDate: d(4),
      actualStartDate: d(-8),
      estimatedHours: 20,
      actualHours: 14,
      progress: 70,
      projectId: project2.id,
      createdById: tanaka.id,
      milestoneId: milestone2_1.id,
      assignees: { create: [{ userId: yamada.id }, { userId: sato.id }] },
      subtasks: {
        create: [
          { title: 'コンセプト策定', completed: true, order: 0 },
          { title: 'ハッシュタグ選定', completed: true, order: 1 },
          { title: '投稿スケジュール作成', completed: true, order: 2 },
          { title: 'インフルエンサーリストアップ', completed: true, order: 3 },
          { title: '予算配分の決定', completed: false, order: 4 },
          { title: '上長承認', completed: false, order: 5 },
        ],
      },
      comments: {
        create: [
          { content: 'コンセプトは「春の新生活応援」で進めます。', userId: yamada.id },
          { content: 'いいですね！ターゲット層にマッチしています。', userId: tanaka.id },
          { content: 'インフルエンサー候補を10名リストアップしました。', userId: sato.id },
        ],
      },
      tags: { create: [{ tagId: tags2[0].id }, { tagId: tags2[2].id }] },
    },
  });

  // 進行中タスク: キービジュアルデザイン（期限間近）
  await prisma.task.create({
    data: {
      title: 'キービジュアルデザイン',
      description: 'キャンペーン用のメインビジュアルを作成',
      status: 'in_progress',
      priority: 'high',
      startDate: d(-5),
      dueDate: d(1),
      actualStartDate: d(-5),
      estimatedHours: 16,
      actualHours: 10,
      progress: 60,
      projectId: project2.id,
      createdById: tanaka.id,
      milestoneId: milestone2_1.id,
      assignees: { create: [{ userId: yamada.id }] },
      subtasks: {
        create: [
          { title: 'ラフ案作成', completed: true, order: 0 },
          { title: 'メインビジュアル制作', completed: true, order: 1 },
          { title: 'バナー各サイズ展開', completed: false, order: 2 },
          { title: 'レビュー・修正', completed: false, order: 3 },
        ],
      },
      comments: {
        create: [
          { content: 'ラフ案を3パターン用意しました。Figmaで確認お願いします。', userId: yamada.id },
          { content: 'パターンBがいいと思います！色味をもう少し明るくできますか？', userId: tanaka.id },
        ],
      },
      tags: { create: [{ tagId: tags2[2].id }] },
    },
  });

  // 進行中タスク: LP制作
  await prisma.task.create({
    data: {
      title: 'キャンペーンLP制作',
      description: 'キャンペーン専用のランディングページを制作する',
      status: 'in_progress',
      priority: 'high',
      startDate: d(-3),
      dueDate: d(7),
      actualStartDate: d(-3),
      estimatedHours: 24,
      actualHours: 8,
      progress: 30,
      projectId: project2.id,
      createdById: tanaka.id,
      milestoneId: milestone2_1.id,
      assignees: { create: [{ userId: sato.id }] },
      subtasks: {
        create: [
          { title: 'ワイヤーフレーム作成', completed: true, order: 0 },
          { title: 'デザインカンプ', completed: false, order: 1 },
          { title: 'コーディング', completed: false, order: 2 },
          { title: 'フォーム連携', completed: false, order: 3 },
          { title: '表示速度チューニング', completed: false, order: 4 },
        ],
      },
      tags: { create: [{ tagId: tags2[2].id }] },
    },
  });

  // 未着手タスク: プロモーション動画
  await prisma.task.create({
    data: {
      title: 'プロモーション動画制作',
      description: '30秒のプロモーション動画を制作。SNS広告とLP用',
      status: 'todo',
      priority: 'high',
      startDate: d(2),
      dueDate: d(15),
      estimatedHours: 40,
      progress: 0,
      projectId: project2.id,
      createdById: tanaka.id,
      milestoneId: milestone2_1.id,
      assignees: { create: [{ userId: yamada.id }] },
      tags: { create: [{ tagId: tags2[2].id }, { tagId: tags2[4].id }] },
    },
  });

  // 未着手タスク: Web広告
  await prisma.task.create({
    data: {
      title: 'Web広告出稿準備',
      description: 'Google広告・Meta広告の設定と入稿',
      status: 'todo',
      priority: 'medium',
      startDate: d(9),
      dueDate: d(20),
      estimatedHours: 16,
      progress: 0,
      projectId: project2.id,
      createdById: tanaka.id,
      milestoneId: milestone2_2.id,
      assignees: { create: [{ userId: sato.id }] },
      tags: { create: [{ tagId: tags2[1].id }] },
    },
  });

  // 未着手タスク: KPI設定
  await prisma.task.create({
    data: {
      title: 'KPI設定と効果測定計画',
      description: 'キャンペーンの成果指標を設定し、測定方法を決定',
      status: 'todo',
      priority: 'medium',
      startDate: d(1),
      dueDate: d(6),
      estimatedHours: 8,
      progress: 0,
      projectId: project2.id,
      createdById: tanaka.id,
      milestoneId: milestone2_2.id,
      assignees: { create: [{ userId: tanaka.id }] },
      tags: { create: [{ tagId: tags2[3].id }] },
    },
  });

  // 未着手タスク: メールマガジン
  await prisma.task.create({
    data: {
      title: 'メールマガジン配信準備',
      description: '既存顧客向けのキャンペーン告知メールの作成と配信設定',
      status: 'todo',
      priority: 'medium',
      startDate: d(12),
      dueDate: d(18),
      estimatedHours: 10,
      progress: 0,
      projectId: project2.id,
      createdById: tanaka.id,
      milestoneId: milestone2_2.id,
      assignees: { create: [{ userId: yamada.id }, { userId: kimura.id }] },
      tags: { create: [{ tagId: tags2[2].id }] },
    },
  });

  // 未着手タスク: プレスリリース
  await prisma.task.create({
    data: {
      title: 'プレスリリース作成・配信',
      description: '新製品ローンチに合わせたプレスリリースの作成と配信',
      status: 'todo',
      priority: 'low',
      startDate: d(16),
      dueDate: d(25),
      estimatedHours: 12,
      progress: 0,
      projectId: project2.id,
      createdById: tanaka.id,
      milestoneId: milestone2_2.id,
      assignees: { create: [{ userId: tanaka.id }] },
      tags: { create: [{ tagId: tags2[2].id }] },
    },
  });

  console.log('Created Project 2: マーケティングキャンペーン');

  // ========== プロジェクト3: 社内システムリニューアル ==========
  const project3 = await prisma.project.create({
    data: {
      name: '社内システムリニューアル',
      description: '老朽化した社内業務システムのモダン化プロジェクト。レガシーPHPからReact+Node.jsへ移行',
      members: {
        create: [
          { userId: suzuki.id, role: 'owner' },
          { userId: tanaka.id, role: 'admin' },
          { userId: watanabe.id, role: 'admin' },
          { userId: sato.id, role: 'member' },
          { userId: kimura.id, role: 'member' },
        ],
      },
    },
  });

  const milestone3_1 = await prisma.milestone.create({
    data: {
      name: '要件定義・設計',
      description: '現行システムの分析と新システムの要件定義・設計',
      dueDate: d(8),
      status: 'pending',
      projectId: project3.id,
    },
  });

  const milestone3_2 = await prisma.milestone.create({
    data: {
      name: '開発フェーズ1',
      description: 'コア機能の実装（勤怠管理・経費精算）',
      dueDate: d(35),
      status: 'pending',
      projectId: project3.id,
    },
  });

  const milestone3_3 = await prisma.milestone.create({
    data: {
      name: '開発フェーズ2',
      description: '拡張機能の実装（ワークフロー・レポート）',
      dueDate: d(61),
      status: 'pending',
      projectId: project3.id,
    },
  });

  const tags3 = await Promise.all([
    prisma.tag.create({ data: { name: '要件定義', color: '#6366f1', projectId: project3.id } }),
    prisma.tag.create({ data: { name: '設計', color: '#8b5cf6', projectId: project3.id } }),
    prisma.tag.create({ data: { name: '開発', color: '#3b82f6', projectId: project3.id } }),
    prisma.tag.create({ data: { name: 'マイグレーション', color: '#f59e0b', projectId: project3.id } }),
    prisma.tag.create({ data: { name: 'レビュー', color: '#10b981', projectId: project3.id } }),
  ]);

  // 完了タスク: 現行システム分析
  const task3_1 = await prisma.task.create({
    data: {
      title: '現行システム機能棚卸し',
      description: '既存PHPシステムの全機能を洗い出し、移行優先度を決定する',
      status: 'done',
      priority: 'high',
      startDate: d(-17),
      dueDate: d(-8),
      actualStartDate: d(-17),
      actualEndDate: d(-9),
      estimatedHours: 24,
      actualHours: 28,
      progress: 100,
      projectId: project3.id,
      createdById: suzuki.id,
      milestoneId: milestone3_1.id,
      assignees: { create: [{ userId: suzuki.id }, { userId: watanabe.id }] },
      subtasks: {
        create: [
          { title: '画面一覧の作成', completed: true, order: 0 },
          { title: 'API一覧の作成', completed: true, order: 1 },
          { title: 'DB テーブル一覧の作成', completed: true, order: 2 },
          { title: 'バッチ処理一覧の作成', completed: true, order: 3 },
          { title: '移行優先度の決定', completed: true, order: 4 },
        ],
      },
      comments: {
        create: [
          { content: '想定以上に機能が多く、棚卸しに時間がかかりました。全部で87画面ありました。', userId: suzuki.id },
          { content: '87画面は多いですね。フェーズ分けして段階的に移行しましょう。', userId: tanaka.id },
        ],
      },
      tags: { create: [{ tagId: tags3[0].id }] },
    },
  });

  // 完了タスク: 技術選定
  await prisma.task.create({
    data: {
      title: '技術スタック選定',
      description: '新システムで使用する技術スタックの選定と検証（PoC）',
      status: 'done',
      priority: 'high',
      startDate: d(-12),
      dueDate: d(-5),
      actualStartDate: d(-12),
      actualEndDate: d(-6),
      estimatedHours: 16,
      actualHours: 15,
      progress: 100,
      projectId: project3.id,
      createdById: suzuki.id,
      milestoneId: milestone3_1.id,
      assignees: { create: [{ userId: suzuki.id }, { userId: sato.id }] },
      subtasks: {
        create: [
          { title: 'フロントエンド: React vs Vue 比較', completed: true, order: 0 },
          { title: 'バックエンド: NestJS vs Express 比較', completed: true, order: 1 },
          { title: 'DB: PostgreSQL vs MySQL 比較', completed: true, order: 2 },
          { title: 'PoC実装', completed: true, order: 3 },
          { title: '技術選定報告書作成', completed: true, order: 4 },
        ],
      },
      comments: {
        create: [
          { content: 'React + NestJS + PostgreSQL の組み合わせを推奨します。PoCの結果良好でした。', userId: suzuki.id },
          { content: 'NexWorkと同じ技術スタックで統一するのが良さそうですね。', userId: tanaka.id },
        ],
      },
      tags: { create: [{ tagId: tags3[1].id }] },
    },
  });

  // 進行中タスク: DB設計
  const task3_3 = await prisma.task.create({
    data: {
      title: '新システムDB設計',
      description: '新システムのデータベース設計。正規化とパフォーマンスのバランスを考慮',
      status: 'in_progress',
      priority: 'high',
      startDate: d(-5),
      dueDate: d(5),
      actualStartDate: d(-5),
      estimatedHours: 24,
      actualHours: 14,
      progress: 55,
      projectId: project3.id,
      createdById: suzuki.id,
      milestoneId: milestone3_1.id,
      assignees: { create: [{ userId: suzuki.id }] },
      subtasks: {
        create: [
          { title: 'ER図作成（勤怠管理）', completed: true, order: 0 },
          { title: 'ER図作成（経費精算）', completed: true, order: 1 },
          { title: 'ER図作成（ワークフロー）', completed: false, order: 2 },
          { title: 'インデックス設計', completed: false, order: 3 },
          { title: 'データ移行マッピング', completed: false, order: 4 },
        ],
      },
      comments: {
        create: [
          { content: '勤怠管理と経費精算のER図が完了しました。レビューお願いします。', userId: suzuki.id },
          { content: '経費精算のカテゴリテーブルにもう一つ階層を追加した方がいいかもしれません。', userId: watanabe.id },
        ],
      },
      tags: { create: [{ tagId: tags3[1].id }] },
    },
  });

  // 進行中タスク: API設計
  await prisma.task.create({
    data: {
      title: 'REST API設計書の作成',
      description: '新システムのREST API設計。OpenAPI 3.0形式で作成',
      status: 'in_progress',
      priority: 'high',
      startDate: d(-3),
      dueDate: d(7),
      actualStartDate: d(-3),
      estimatedHours: 20,
      actualHours: 8,
      progress: 35,
      projectId: project3.id,
      createdById: suzuki.id,
      milestoneId: milestone3_1.id,
      assignees: { create: [{ userId: suzuki.id }, { userId: kimura.id }] },
      subtasks: {
        create: [
          { title: '認証API設計', completed: true, order: 0 },
          { title: '勤怠管理API設計', completed: true, order: 1 },
          { title: '経費精算API設計', completed: false, order: 2 },
          { title: 'ワークフローAPI設計', completed: false, order: 3 },
          { title: 'レポートAPI設計', completed: false, order: 4 },
        ],
      },
      tags: { create: [{ tagId: tags3[1].id }, { tagId: tags3[0].id }] },
    },
  });

  // 進行中タスク: UI/UXデザイン
  await prisma.task.create({
    data: {
      title: 'UI/UXデザイン（勤怠管理）',
      description: '勤怠管理画面のUI/UXデザイン。Figmaでプロトタイプ作成',
      status: 'in_progress',
      priority: 'medium',
      startDate: d(-3),
      dueDate: d(6),
      actualStartDate: d(-2),
      estimatedHours: 16,
      actualHours: 6,
      progress: 40,
      projectId: project3.id,
      createdById: suzuki.id,
      milestoneId: milestone3_1.id,
      assignees: { create: [{ userId: sato.id }] },
      subtasks: {
        create: [
          { title: '打刻画面デザイン', completed: true, order: 0 },
          { title: '勤務表画面デザイン', completed: true, order: 1 },
          { title: '申請画面デザイン', completed: false, order: 2 },
          { title: '管理者画面デザイン', completed: false, order: 3 },
        ],
      },
      tags: { create: [{ tagId: tags3[1].id }] },
    },
  });

  // 未着手タスク: データ移行ツール作成
  const task3_6 = await prisma.task.create({
    data: {
      title: 'データ移行ツール開発',
      description: '旧MySQL DBから新PostgreSQL DBへのデータ移行スクリプトの開発',
      status: 'todo',
      priority: 'high',
      startDate: d(6),
      dueDate: d(20),
      estimatedHours: 32,
      progress: 0,
      projectId: project3.id,
      createdById: suzuki.id,
      milestoneId: milestone3_2.id,
      assignees: { create: [{ userId: watanabe.id }, { userId: suzuki.id }] },
      tags: { create: [{ tagId: tags3[3].id }, { tagId: tags3[2].id }] },
    },
  });

  // 未着手タスク: 勤怠管理機能実装
  await prisma.task.create({
    data: {
      title: '勤怠管理機能の実装',
      description: '打刻、勤務表表示、残業申請等の勤怠管理コア機能の実装',
      status: 'todo',
      priority: 'high',
      startDate: d(8),
      dueDate: d(25),
      estimatedHours: 48,
      progress: 0,
      projectId: project3.id,
      createdById: suzuki.id,
      milestoneId: milestone3_2.id,
      assignees: { create: [{ userId: suzuki.id }, { userId: sato.id }] },
      tags: { create: [{ tagId: tags3[2].id }] },
    },
  });

  // 未着手タスク: 経費精算機能実装
  await prisma.task.create({
    data: {
      title: '経費精算機能の実装',
      description: '経費申請、承認ワークフロー、レシートOCR連携機能の実装',
      status: 'todo',
      priority: 'high',
      startDate: d(16),
      dueDate: d(33),
      estimatedHours: 40,
      progress: 0,
      projectId: project3.id,
      createdById: suzuki.id,
      milestoneId: milestone3_2.id,
      assignees: { create: [{ userId: suzuki.id }, { userId: kimura.id }] },
      tags: { create: [{ tagId: tags3[2].id }] },
    },
  });

  // 未着手タスク: インフラ環境構築
  await prisma.task.create({
    data: {
      title: '本番/ステージング環境構築',
      description: 'AWS上に本番・ステージング環境を構築。Terraform + ECS Fargate',
      status: 'todo',
      priority: 'medium',
      startDate: d(4),
      dueDate: d(15),
      estimatedHours: 28,
      progress: 0,
      projectId: project3.id,
      createdById: suzuki.id,
      milestoneId: milestone3_2.id,
      assignees: { create: [{ userId: watanabe.id }] },
      tags: { create: [{ tagId: tags3[2].id }] },
    },
  });

  // 未着手タスク: テスト計画
  await prisma.task.create({
    data: {
      title: 'テスト計画書の作成',
      description: '総合テスト・受入テストの計画書作成。テストケース一覧を含む',
      status: 'todo',
      priority: 'medium',
      startDate: d(5),
      dueDate: d(12),
      estimatedHours: 16,
      progress: 0,
      projectId: project3.id,
      createdById: suzuki.id,
      milestoneId: milestone3_2.id,
      assignees: { create: [{ userId: kimura.id }] },
      tags: { create: [{ tagId: tags3[4].id }] },
    },
  });

  // 依存関係（プロジェクト3）
  await Promise.all([
    prisma.taskDependency.create({
      data: { taskId: task3_3.id, dependsOnId: task3_1.id },
    }),
    prisma.taskDependency.create({
      data: { taskId: task3_6.id, dependsOnId: task3_3.id },
    }),
  ]);

  console.log('Created Project 3: 社内システムリニューアル');

  // ========== 通知を作成 ==========
  await Promise.all([
    // 田中への通知
    prisma.notification.create({
      data: {
        type: 'task_due_soon',
        title: '期限が近いタスクがあります',
        message: '「プロジェクトメンバー管理機能」の期限が2/15です。',
        data: { taskId: task1_4b.id, projectId: project1.id },
        isRead: false,
        userId: tanaka.id,
      },
    }),
    prisma.notification.create({
      data: {
        type: 'comment_added',
        title: '新しいコメント',
        message: '佐藤 花子が「ガントチャート機能の実装」にコメントしました',
        data: { taskId: task1_3.id, projectId: project1.id },
        isRead: false,
        userId: tanaka.id,
      },
    }),
    prisma.notification.create({
      data: {
        type: 'status_changed',
        title: 'ステータス変更',
        message: '「カンバンボードの実装」が完了しました',
        data: { taskId: task1_2b.id, projectId: project1.id },
        isRead: true,
        userId: tanaka.id,
      },
    }),
    prisma.notification.create({
      data: {
        type: 'status_changed',
        title: 'ステータス変更',
        message: '「CI/CDパイプラインの構築」が完了しました',
        data: { taskId: task1_2d.id, projectId: project1.id },
        isRead: true,
        userId: tanaka.id,
      },
    }),
    // 佐藤への通知
    prisma.notification.create({
      data: {
        type: 'task_assigned',
        title: 'タスクがアサインされました',
        message: '「ダークモード対応」があなたにアサインされました',
        data: { taskId: task1_4d.id, projectId: project1.id },
        isRead: false,
        userId: sato.id,
      },
    }),
    prisma.notification.create({
      data: {
        type: 'task_due_soon',
        title: '期限が近いタスクがあります',
        message: '「プロジェクトメンバー管理機能」の期限が2/15です。',
        data: { taskId: task1_4b.id, projectId: project1.id },
        isRead: false,
        userId: sato.id,
      },
    }),
    // 鈴木への通知
    prisma.notification.create({
      data: {
        type: 'task_due_soon',
        title: '期限が近いタスクがあります',
        message: '「WebSocket通知機能」の期限が2/18です。',
        data: { taskId: task1_4.id, projectId: project1.id },
        isRead: false,
        userId: suzuki.id,
      },
    }),
    prisma.notification.create({
      data: {
        type: 'comment_added',
        title: '新しいコメント',
        message: '渡辺 優子が「新システムDB設計」にコメントしました',
        data: { taskId: task3_3.id, projectId: project3.id },
        isRead: false,
        userId: suzuki.id,
      },
    }),
    // 木村への通知
    prisma.notification.create({
      data: {
        type: 'task_assigned',
        title: 'タスクがアサインされました',
        message: '「E2Eテストの作成」があなたにアサインされました',
        data: { taskId: task1_4c.id, projectId: project1.id },
        isRead: true,
        userId: kimura.id,
      },
    }),
    // 渡辺への通知
    prisma.notification.create({
      data: {
        type: 'task_assigned',
        title: 'タスクがアサインされました',
        message: '「ファイルアップロード機能」があなたにアサインされました',
        data: { taskId: task1_11.id, projectId: project1.id },
        isRead: false,
        userId: watanabe.id,
      },
    }),
  ]);

  console.log('Created notifications');

  console.log('');
  console.log('========================================');
  console.log('Seeding completed!');
  console.log('========================================');
  console.log('');
  console.log('Demo accounts:');
  console.log('----------------------------------------');
  console.log('Email: demo@nexwork.com');
  console.log('Password: demo1234');
  console.log('');
  console.log('Other accounts (same password):');
  console.log('- sato@nexwork.com (佐藤 花子)');
  console.log('- suzuki@nexwork.com (鈴木 一郎)');
  console.log('- yamada@nexwork.com (山田 美咲)');
  console.log('- kimura@nexwork.com (木村 健太)');
  console.log('- watanabe@nexwork.com (渡辺 優子)');
  console.log('========================================');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
