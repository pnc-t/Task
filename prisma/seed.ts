import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

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
  ]);

  const [tanaka, sato, suzuki, yamada] = users;
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
        ],
      },
    },
  });

  // マイルストーン作成（今日=1/28基準）
  const milestone1_1 = await prisma.milestone.create({
    data: {
      name: 'フェーズ1: MVP完成',
      description: '基本機能の実装完了',
      dueDate: new Date('2026-01-25'),
      status: 'completed',
      projectId: project1.id,
    },
  });

  const milestone1_2 = await prisma.milestone.create({
    data: {
      name: 'フェーズ2: 機能拡張',
      description: 'ガントチャート・通知機能の追加',
      dueDate: new Date('2026-02-10'),
      status: 'pending',
      projectId: project1.id,
    },
  });

  const milestone1_3 = await prisma.milestone.create({
    data: {
      name: 'フェーズ3: リリース',
      description: '本番環境へのデプロイとドキュメント整備',
      dueDate: new Date('2026-02-28'),
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
  ]);

  // タスク作成 - プロジェクト1
  // 完了タスク1: ユーザー認証（1/10-1/18完了）
  const task1_1 = await prisma.task.create({
    data: {
      title: 'ユーザー認証機能の実装',
      description: 'JWT認証を使用したログイン・登録機能を実装する',
      status: 'done',
      priority: 'high',
      startDate: new Date('2026-01-10'),
      dueDate: new Date('2026-01-18'),
      actualStartDate: new Date('2026-01-10'),
      actualEndDate: new Date('2026-01-17'),
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

  // 完了タスク2: ダッシュボード（1/15-1/24完了）
  const task1_2 = await prisma.task.create({
    data: {
      title: 'ダッシュボード画面の作成',
      description: 'タスクの統計情報やプロジェクト一覧を表示するダッシュボード',
      status: 'done',
      priority: 'high',
      startDate: new Date('2026-01-15'),
      dueDate: new Date('2026-01-24'),
      actualStartDate: new Date('2026-01-15'),
      actualEndDate: new Date('2026-01-23'),
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

  // 完了タスク3: タスクボード（1/18-1/26完了）
  const task1_2b = await prisma.task.create({
    data: {
      title: 'カンバンボードの実装',
      description: 'ドラッグ＆ドロップでタスクのステータスを変更できるカンバンボード',
      status: 'done',
      priority: 'high',
      startDate: new Date('2026-01-18'),
      dueDate: new Date('2026-01-26'),
      actualStartDate: new Date('2026-01-18'),
      actualEndDate: new Date('2026-01-25'),
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
          { title: 'ステータス変更機能', completed: true, order: 2 },
        ],
      },
      tags: { create: [{ tagId: tags1[0].id }] },
    },
  });

  // 進行中タスク1: ガントチャート（1/22開始、期限2/5）
  const task1_3 = await prisma.task.create({
    data: {
      title: 'ガントチャート機能の実装',
      description: 'タスクのスケジュールを視覚的に表示するガントチャートを実装',
      status: 'in_progress',
      priority: 'high',
      startDate: new Date('2026-01-22'),
      dueDate: new Date('2026-02-05'),
      actualStartDate: new Date('2026-01-22'),
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

  // 進行中タスク2: WebSocket通知（1/25開始、期限2/3）
  const task1_4 = await prisma.task.create({
    data: {
      title: 'WebSocket通知機能',
      description: 'リアルタイムでタスクの更新を通知する機能',
      status: 'in_progress',
      priority: 'high',
      startDate: new Date('2026-01-25'),
      dueDate: new Date('2026-02-03'),
      actualStartDate: new Date('2026-01-25'),
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

  // 進行中タスク3: メンバー管理（1/27開始、期限1/31）- 期限間近
  const task1_4b = await prisma.task.create({
    data: {
      title: 'プロジェクトメンバー管理機能',
      description: 'メンバーの招待・削除・権限管理機能',
      status: 'in_progress',
      priority: 'medium',
      startDate: new Date('2026-01-27'),
      dueDate: new Date('2026-01-31'),
      actualStartDate: new Date('2026-01-27'),
      estimatedHours: 16,
      actualHours: 4,
      progress: 30,
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

  // 未着手タスク1: APIドキュメント（2/1開始予定、期限2/10）
  const task1_5 = await prisma.task.create({
    data: {
      title: 'API ドキュメントの作成',
      description: 'Swagger/OpenAPIを使用したAPIドキュメントの整備',
      status: 'todo',
      priority: 'medium',
      startDate: new Date('2026-02-01'),
      dueDate: new Date('2026-02-10'),
      estimatedHours: 16,
      progress: 0,
      projectId: project1.id,
      createdById: tanaka.id,
      milestoneId: milestone1_3.id,
      assignees: { create: [{ userId: suzuki.id }] },
      tags: { create: [{ tagId: tags1[4].id }] },
    },
  });

  // 未着手タスク2: ユーザーマニュアル（2/5開始予定、期限2/15）
  const task1_6 = await prisma.task.create({
    data: {
      title: 'ユーザーマニュアルの作成',
      description: 'エンドユーザー向けの操作マニュアルを作成',
      status: 'todo',
      priority: 'low',
      startDate: new Date('2026-02-05'),
      dueDate: new Date('2026-02-15'),
      estimatedHours: 12,
      progress: 0,
      projectId: project1.id,
      createdById: tanaka.id,
      milestoneId: milestone1_3.id,
      assignees: { create: [{ userId: yamada.id }] },
      tags: { create: [{ tagId: tags1[4].id }] },
    },
  });

  // 未着手タスク3: パフォーマンス最適化（2/10開始予定、期限2/20）
  const task1_7 = await prisma.task.create({
    data: {
      title: 'パフォーマンス最適化',
      description: '大量タスク時のレンダリング性能を改善',
      status: 'todo',
      priority: 'medium',
      startDate: new Date('2026-02-10'),
      dueDate: new Date('2026-02-20'),
      estimatedHours: 20,
      progress: 0,
      projectId: project1.id,
      createdById: tanaka.id,
      milestoneId: milestone1_3.id,
      assignees: { create: [{ userId: sato.id }, { userId: suzuki.id }] },
      tags: { create: [{ tagId: tags1[0].id }, { tagId: tags1[1].id }] },
    },
  });

  // 未着手タスク4: モバイル対応（期限のみ設定）
  const task1_8 = await prisma.task.create({
    data: {
      title: 'モバイルレスポンシブ対応の強化',
      description: 'スマートフォン・タブレットでの表示最適化',
      status: 'todo',
      priority: 'low',
      dueDate: new Date('2026-02-25'),
      estimatedHours: 16,
      progress: 0,
      projectId: project1.id,
      createdById: tanaka.id,
      milestoneId: milestone1_3.id,
      assignees: { create: [{ userId: yamada.id }, { userId: sato.id }] },
      tags: { create: [{ tagId: tags1[0].id }, { tagId: tags1[2].id }] },
    },
  });

  // 依存関係を追加
  await prisma.taskDependency.create({
    data: { taskId: task1_3.id, dependsOnId: task1_2.id },
  });
  await prisma.taskDependency.create({
    data: { taskId: task1_5.id, dependsOnId: task1_4.id },
  });
  await prisma.taskDependency.create({
    data: { taskId: task1_7.id, dependsOnId: task1_3.id },
  });

  console.log('Created Project 1: NexWork開発プロジェクト');

  // ========== プロジェクト2: マーケティング ==========
  const project2 = await prisma.project.create({
    data: {
      name: '春の新製品キャンペーン',
      description: '2025年春の新製品ローンチに向けたマーケティング施策',
      members: {
        create: [
          { userId: tanaka.id, role: 'owner' },
          { userId: yamada.id, role: 'admin' },
          { userId: sato.id, role: 'member' },
        ],
      },
    },
  });

  const milestone2_1 = await prisma.milestone.create({
    data: {
      name: '企画フェーズ',
      description: 'キャンペーン企画と素材準備',
      dueDate: new Date('2026-02-07'),
      status: 'pending',
      projectId: project2.id,
    },
  });

  const milestone2_2 = await prisma.milestone.create({
    data: {
      name: '実施フェーズ',
      description: 'キャンペーン実施と効果測定',
      dueDate: new Date('2026-03-15'),
      status: 'pending',
      projectId: project2.id,
    },
  });

  const tags2 = await Promise.all([
    prisma.tag.create({ data: { name: 'SNS', color: '#ec4899', projectId: project2.id } }),
    prisma.tag.create({ data: { name: '広告', color: '#f97316', projectId: project2.id } }),
    prisma.tag.create({ data: { name: 'コンテンツ', color: '#06b6d4', projectId: project2.id } }),
    prisma.tag.create({ data: { name: '分析', color: '#84cc16', projectId: project2.id } }),
  ]);

  // 完了タスク
  await prisma.task.create({
    data: {
      title: 'ターゲット顧客分析',
      description: '新製品のターゲット層を分析し、ペルソナを作成',
      status: 'done',
      priority: 'high',
      startDate: new Date('2026-01-15'),
      dueDate: new Date('2026-01-22'),
      actualStartDate: new Date('2026-01-15'),
      actualEndDate: new Date('2026-01-21'),
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

  // 進行中タスク
  await prisma.task.create({
    data: {
      title: 'SNSキャンペーン企画',
      description: 'Instagram・X（Twitter）向けのキャンペーン企画書作成',
      status: 'in_progress',
      priority: 'high',
      startDate: new Date('2026-01-23'),
      dueDate: new Date('2026-02-03'),
      actualStartDate: new Date('2026-01-23'),
      estimatedHours: 20,
      actualHours: 12,
      progress: 60,
      projectId: project2.id,
      createdById: tanaka.id,
      milestoneId: milestone2_1.id,
      assignees: { create: [{ userId: yamada.id }, { userId: sato.id }] },
      subtasks: {
        create: [
          { title: 'コンセプト策定', completed: true, order: 0 },
          { title: 'ハッシュタグ選定', completed: true, order: 1 },
          { title: '投稿スケジュール作成', completed: true, order: 2 },
          { title: 'インフルエンサーリストアップ', completed: false, order: 3 },
          { title: '予算配分の決定', completed: false, order: 4 },
        ],
      },
      comments: {
        create: [
          { content: 'コンセプトは「春の新生活応援」で進めます。', userId: yamada.id },
          { content: 'いいですね！ターゲット層にマッチしています。', userId: tanaka.id },
        ],
      },
      tags: { create: [{ tagId: tags2[0].id }, { tagId: tags2[2].id }] },
    },
  });

  // 進行中タスク（期限間近）
  await prisma.task.create({
    data: {
      title: 'キービジュアルデザイン',
      description: 'キャンペーン用のメインビジュアルを作成',
      status: 'in_progress',
      priority: 'high',
      startDate: new Date('2026-01-25'),
      dueDate: new Date('2026-01-30'),
      actualStartDate: new Date('2026-01-25'),
      estimatedHours: 16,
      actualHours: 8,
      progress: 50,
      projectId: project2.id,
      createdById: tanaka.id,
      milestoneId: milestone2_1.id,
      assignees: { create: [{ userId: yamada.id }] },
      subtasks: {
        create: [
          { title: 'ラフ案作成', completed: true, order: 0 },
          { title: 'デザイン制作', completed: false, order: 1 },
          { title: 'レビュー・修正', completed: false, order: 2 },
        ],
      },
      tags: { create: [{ tagId: tags2[2].id }] },
    },
  });

  // 未着手タスク
  await prisma.task.create({
    data: {
      title: 'プロモーション動画制作',
      description: '30秒のプロモーション動画を制作',
      status: 'todo',
      priority: 'high',
      startDate: new Date('2026-02-01'),
      dueDate: new Date('2026-02-14'),
      estimatedHours: 40,
      progress: 0,
      projectId: project2.id,
      createdById: tanaka.id,
      milestoneId: milestone2_1.id,
      assignees: { create: [{ userId: yamada.id }] },
      tags: { create: [{ tagId: tags2[2].id }] },
    },
  });

  await prisma.task.create({
    data: {
      title: 'Web広告出稿準備',
      description: 'Google広告・Meta広告の設定と入稿',
      status: 'todo',
      priority: 'medium',
      startDate: new Date('2026-02-10'),
      dueDate: new Date('2026-02-20'),
      estimatedHours: 16,
      progress: 0,
      projectId: project2.id,
      createdById: tanaka.id,
      milestoneId: milestone2_2.id,
      assignees: { create: [{ userId: sato.id }] },
      tags: { create: [{ tagId: tags2[1].id }] },
    },
  });

  await prisma.task.create({
    data: {
      title: 'KPI設定と効果測定計画',
      description: 'キャンペーンの成果指標を設定し、測定方法を決定',
      status: 'todo',
      priority: 'medium',
      dueDate: new Date('2026-02-05'),
      estimatedHours: 8,
      progress: 0,
      projectId: project2.id,
      createdById: tanaka.id,
      milestoneId: milestone2_2.id,
      assignees: { create: [{ userId: tanaka.id }] },
      tags: { create: [{ tagId: tags2[3].id }] },
    },
  });

  console.log('Created Project 2: マーケティングキャンペーン');

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
