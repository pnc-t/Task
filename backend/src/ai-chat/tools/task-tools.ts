import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ToolDefinition, ToolCall } from '../providers/ai-provider.interface';

export interface ToolExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
}

@Injectable()
export class TaskToolsService {
  private readonly logger = new Logger(TaskToolsService.name);

  constructor(private prisma: PrismaService) {}

  getToolDefinitions(): ToolDefinition[] {
    return [
      {
        name: 'create_task',
        description:
          'タスクを新規作成します。タイトルは必須です。プロジェクトIDが指定されていない場合は、自動的にプロジェクトが作成されます。オプションで説明、優先度、期限などを設定できます。',
        parameters: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'タスクのタイトル',
            },
            projectId: {
              type: 'string',
              description: 'タスクを作成するプロジェクトのID（オプション。省略された場合は自動作成されます）',
            },
            description: {
              type: 'string',
              description: 'タスクの説明（オプション）',
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              description: 'タスクの優先度（low: 低, medium: 中, high: 高）',
            },
            dueDate: {
              type: 'string',
              description: '期限（ISO8601形式、例: 2024-12-31）',
            },
            assigneeId: {
              type: 'string',
              description: '担当者のユーザーID（オプション）',
            },
          },
          required: ['title'],
        },
      },
      {
        name: 'search_tasks',
        description:
          'タスクを検索します。キーワード、ステータス、優先度、プロジェクトIDで絞り込みができます。',
        parameters: {
          type: 'object',
          properties: {
            keyword: {
              type: 'string',
              description: '検索キーワード（タイトル・説明に含まれる文字列）',
            },
            projectId: {
              type: 'string',
              description: 'プロジェクトIDで絞り込み',
            },
            status: {
              type: 'string',
              enum: ['todo', 'in_progress', 'done'],
              description: 'ステータスで絞り込み',
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              description: '優先度で絞り込み',
            },
            assigneeId: {
              type: 'string',
              description: '担当者IDで絞り込み',
            },
            limit: {
              type: 'number',
              description: '取得件数の上限（デフォルト: 10）',
            },
          },
        },
      },
      {
        name: 'update_task',
        description:
          'タスクを更新します。タスクIDは必須です。更新可能な項目: タイトル、説明、ステータス、優先度、期限、担当者。',
        parameters: {
          type: 'object',
          properties: {
            taskId: {
              type: 'string',
              description: '更新するタスクのID',
            },
            title: {
              type: 'string',
              description: '新しいタイトル',
            },
            description: {
              type: 'string',
              description: '新しい説明',
            },
            status: {
              type: 'string',
              enum: ['todo', 'in_progress', 'done'],
              description: '新しいステータス',
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              description: '新しい優先度',
            },
            dueDate: {
              type: 'string',
              description: '新しい期限（ISO8601形式）',
            },
            assigneeId: {
              type: 'string',
              description: '新しい担当者のユーザーID',
            },
            progress: {
              type: 'number',
              description: '進捗率（0-100）',
            },
          },
          required: ['taskId'],
        },
      },
      {
        name: 'get_task_details',
        description: 'タスクの詳細情報を取得します。サブタスク、コメント、担当者なども含みます。',
        parameters: {
          type: 'object',
          properties: {
            taskId: {
              type: 'string',
              description: '取得するタスクのID',
            },
          },
          required: ['taskId'],
        },
      },
      {
        name: 'add_comment',
        description: 'タスクにコメントを追加します。',
        parameters: {
          type: 'object',
          properties: {
            taskId: {
              type: 'string',
              description: 'コメントを追加するタスクのID',
            },
            content: {
              type: 'string',
              description: 'コメントの内容',
            },
          },
          required: ['taskId', 'content'],
        },
      },
      {
        name: 'list_projects',
        description: 'ユーザーがアクセス可能なプロジェクト一覧を取得します。',
        parameters: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_project_members',
        description: 'プロジェクトのメンバー一覧を取得します。担当者を指定する際に使用できます。',
        parameters: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'プロジェクトのID',
            },
          },
          required: ['projectId'],
        },
      },
    ];
  }

  async executeTool(
    toolCall: ToolCall,
    userId: string,
    contextProjectId?: string,
  ): Promise<ToolExecutionResult> {
    this.logger.log(`Executing tool: ${toolCall.name} with args:`, toolCall.arguments);

    try {
      const args = toolCall.arguments;
      switch (toolCall.name) {
        case 'create_task':
          return await this.createTask(args as any, userId, contextProjectId);
        case 'search_tasks':
          return await this.searchTasks(args as any, userId, contextProjectId);
        case 'update_task':
          return await this.updateTask(args as any, userId);
        case 'get_task_details':
          return await this.getTaskDetails(args as any, userId);
        case 'add_comment':
          return await this.addComment(args as any, userId);
        case 'list_projects':
          return await this.listProjects(userId);
        case 'get_project_members':
          return await this.getProjectMembers(args as any, userId);
        default:
          return { success: false, error: `Unknown tool: ${toolCall.name}` };
      }
    } catch (error: any) {
      this.logger.error(`Tool execution error: ${toolCall.name}`, error);
      return { success: false, error: error.message || 'ツールの実行中にエラーが発生しました' };
    }
  }

  private async createTask(
    args: { title: string; projectId: string; description?: string; priority?: string; dueDate?: string; assigneeId?: string },
    userId: string,
    contextProjectId?: string,
  ): Promise<ToolExecutionResult> {
    let projectId = args.projectId || contextProjectId;

    // プロジェクトIDが指定されていない場合は自動作成
    if (!projectId) {
      try {
        const newProject = await this.prisma.project.create({
          data: {
            name: `${args.title}のプロジェクト`,
            description: `${args.title}用に自動作成されたプロジェクト`,
            members: {
              create: {
                userId,
                role: 'owner',
              },
            },
          },
        });
        projectId = newProject.id;
        this.logger.log(`プロジェクトを自動作成しました: ${newProject.id}`);
      } catch (error) {
        return { success: false, error: 'プロジェクトの自動作成に失敗しました' };
      }
    } else {
      // プロジェクトへのアクセス権をチェック
      const member = await this.prisma.projectMember.findFirst({
        where: { projectId, userId },
      });

      if (!member) {
        return { success: false, error: 'このプロジェクトへのアクセス権限がありません' };
      }
    }

    const task = await this.prisma.task.create({
      data: {
        title: args.title,
        description: args.description,
        priority: args.priority || 'medium',
        dueDate: args.dueDate ? new Date(args.dueDate) : undefined,
        assigneeId: args.assigneeId,
        projectId,
        createdById: userId,
      },
      include: {
        project: { select: { name: true } },
        assignee: { select: { id: true, name: true } },
      },
    });

    return {
      success: true,
      data: {
        message: `タスク「${task.title}」を作成しました`,
        task: {
          id: task.id,
          title: task.title,
          status: task.status,
          priority: task.priority,
          project: task.project.name,
          assignee: task.assignee?.name,
        },
      },
    };
  }

  private async searchTasks(
    args: { keyword?: string; projectId?: string; status?: string; priority?: string; assigneeId?: string; limit?: number },
    userId: string,
    contextProjectId?: string,
  ): Promise<ToolExecutionResult> {
    const where: any = {
      project: {
        members: {
          some: { userId },
        },
      },
    };

    if (args.projectId || contextProjectId) {
      where.projectId = args.projectId || contextProjectId;
    }

    if (args.keyword) {
      where.OR = [
        { title: { contains: args.keyword, mode: 'insensitive' } },
        { description: { contains: args.keyword, mode: 'insensitive' } },
      ];
    }

    if (args.status) {
      where.status = args.status;
    }

    if (args.priority) {
      where.priority = args.priority;
    }

    if (args.assigneeId) {
      where.assigneeId = args.assigneeId;
    }

    const tasks = await this.prisma.task.findMany({
      where,
      take: args.limit || 10,
      orderBy: { updatedAt: 'desc' },
      include: {
        project: { select: { name: true } },
        assignee: { select: { name: true } },
      },
    });

    return {
      success: true,
      data: {
        count: tasks.length,
        tasks: tasks.map((t) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          priority: t.priority,
          dueDate: t.dueDate?.toISOString().split('T')[0],
          project: t.project.name,
          assignee: t.assignee?.name,
        })),
      },
    };
  }

  private async updateTask(
    args: { taskId: string; title?: string; description?: string; status?: string; priority?: string; dueDate?: string; assigneeId?: string; progress?: number },
    userId: string,
  ): Promise<ToolExecutionResult> {
    // タスクの存在とアクセス権をチェック
    const task = await this.prisma.task.findUnique({
      where: { id: args.taskId },
      include: { project: { include: { members: true } } },
    });

    if (!task) {
      return { success: false, error: 'タスクが見つかりません' };
    }

    const isMember = task.project.members.some((m) => m.userId === userId);
    if (!isMember) {
      return { success: false, error: 'このタスクへのアクセス権限がありません' };
    }

    const updateData: any = {};
    if (args.title) updateData.title = args.title;
    if (args.description !== undefined) updateData.description = args.description;
    if (args.status) updateData.status = args.status;
    if (args.priority) updateData.priority = args.priority;
    if (args.dueDate) updateData.dueDate = new Date(args.dueDate);
    if (args.assigneeId !== undefined) updateData.assigneeId = args.assigneeId || null;
    if (args.progress !== undefined) updateData.progress = args.progress;

    const updatedTask = await this.prisma.task.update({
      where: { id: args.taskId },
      data: updateData,
      include: {
        assignee: { select: { name: true } },
      },
    });

    return {
      success: true,
      data: {
        message: `タスク「${updatedTask.title}」を更新しました`,
        task: {
          id: updatedTask.id,
          title: updatedTask.title,
          status: updatedTask.status,
          priority: updatedTask.priority,
          assignee: updatedTask.assignee?.name,
        },
      },
    };
  }

  private async getTaskDetails(
    args: { taskId: string },
    userId: string,
  ): Promise<ToolExecutionResult> {
    const task = await this.prisma.task.findUnique({
      where: { id: args.taskId },
      include: {
        project: { include: { members: { select: { userId: true } } } },
        assignee: { select: { id: true, name: true } },
        assignees: { include: { user: { select: { id: true, name: true } } } },
        subtasks: { orderBy: { order: 'asc' } },
        comments: {
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        tags: { include: { tag: true } },
        milestone: { select: { name: true, dueDate: true } },
      },
    });

    if (!task) {
      return { success: false, error: 'タスクが見つかりません' };
    }

    const isMember = task.project.members.some((m) => m.userId === userId);
    if (!isMember) {
      return { success: false, error: 'このタスクへのアクセス権限がありません' };
    }

    return {
      success: true,
      data: {
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        progress: task.progress,
        dueDate: task.dueDate?.toISOString().split('T')[0],
        estimatedHours: task.estimatedHours,
        actualHours: task.actualHours,
        assignee: task.assignee?.name,
        additionalAssignees: task.assignees.map((a) => a.user.name),
        milestone: task.milestone?.name,
        tags: task.tags.map((t) => t.tag.name),
        subtasks: task.subtasks.map((s) => ({
          title: s.title,
          completed: s.completed,
        })),
        recentComments: task.comments.map((c) => ({
          author: c.user.name,
          content: c.content.substring(0, 100),
          createdAt: c.createdAt.toISOString(),
        })),
      },
    };
  }

  private async addComment(
    args: { taskId: string; content: string },
    userId: string,
  ): Promise<ToolExecutionResult> {
    const task = await this.prisma.task.findUnique({
      where: { id: args.taskId },
      include: { project: { include: { members: true } } },
    });

    if (!task) {
      return { success: false, error: 'タスクが見つかりません' };
    }

    const isMember = task.project.members.some((m) => m.userId === userId);
    if (!isMember) {
      return { success: false, error: 'このタスクへのアクセス権限がありません' };
    }

    const comment = await this.prisma.taskComment.create({
      data: {
        taskId: args.taskId,
        userId,
        content: args.content,
      },
      include: {
        user: { select: { name: true } },
      },
    });

    return {
      success: true,
      data: {
        message: `タスク「${task.title}」にコメントを追加しました`,
        comment: {
          id: comment.id,
          content: comment.content,
          author: comment.user.name,
        },
      },
    };
  }

  private async listProjects(userId: string): Promise<ToolExecutionResult> {
    const projects = await this.prisma.project.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: {
        _count: { select: { tasks: true } },
        members: { select: { role: true, userId: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return {
      success: true,
      data: {
        projects: projects.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          taskCount: p._count.tasks,
          myRole: p.members.find((m) => m.userId === userId)?.role,
        })),
      },
    };
  }

  private async getProjectMembers(
    args: { projectId: string },
    userId: string,
  ): Promise<ToolExecutionResult> {
    const project = await this.prisma.project.findUnique({
      where: { id: args.projectId },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!project) {
      return { success: false, error: 'プロジェクトが見つかりません' };
    }

    const isMember = project.members.some((m) => m.userId === userId);
    if (!isMember) {
      return { success: false, error: 'このプロジェクトへのアクセス権限がありません' };
    }

    return {
      success: true,
      data: {
        projectName: project.name,
        members: project.members.map((m) => ({
          id: m.user.id,
          name: m.user.name,
          email: m.user.email,
          role: m.role,
        })),
      },
    };
  }
}
