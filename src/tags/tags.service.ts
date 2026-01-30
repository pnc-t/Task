import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, createTagDto: CreateTagDto) {
    const { projectId, ...tagData } = createTagDto;

    await this.checkProjectAccess(projectId, userId);

    // 同じ名前のタグがないかチェック
    const existingTag = await this.prisma.tag.findFirst({
      where: { projectId, name: tagData.name },
    });

    if (existingTag) {
      throw new BadRequestException('同じ名前のタグが既に存在します');
    }

    return this.prisma.tag.create({
      data: {
        ...tagData,
        projectId,
      },
    });
  }

  async findAll(userId: string, projectId: string) {
    await this.checkProjectAccess(projectId, userId);

    return this.prisma.tag.findMany({
      where: { projectId },
      include: {
        _count: {
          select: { tasks: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(tagId: string, userId: string) {
    const tag = await this.prisma.tag.findUnique({
      where: { id: tagId },
      include: {
        tasks: {
          include: {
            task: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!tag) {
      throw new NotFoundException('タグが見つかりません');
    }

    await this.checkProjectAccess(tag.projectId, userId);

    return tag;
  }

  async update(tagId: string, userId: string, updateTagDto: UpdateTagDto) {
    const tag = await this.findOne(tagId, userId);

    // 名前の重複チェック
    if (updateTagDto.name && updateTagDto.name !== tag.name) {
      const existingTag = await this.prisma.tag.findFirst({
        where: {
          projectId: tag.projectId,
          name: updateTagDto.name,
          id: { not: tagId },
        },
      });

      if (existingTag) {
        throw new BadRequestException('同じ名前のタグが既に存在します');
      }
    }

    return this.prisma.tag.update({
      where: { id: tagId },
      data: updateTagDto,
    });
  }

  async remove(tagId: string, userId: string) {
    await this.findOne(tagId, userId);

    await this.prisma.tag.delete({
      where: { id: tagId },
    });

    return { message: 'タグを削除しました' };
  }

  // タスクへのタグ付け
  async addTagToTask(taskId: string, tagId: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('タスクが見つかりません');
    }

    await this.checkProjectAccess(task.projectId, userId);

    const tag = await this.prisma.tag.findUnique({
      where: { id: tagId },
    });

    if (!tag || tag.projectId !== task.projectId) {
      throw new BadRequestException('無効なタグです');
    }

    const existingTaskTag = await this.prisma.taskTag.findFirst({
      where: { taskId, tagId },
    });

    if (existingTaskTag) {
      throw new BadRequestException('このタグは既に付与されています');
    }

    return this.prisma.taskTag.create({
      data: { taskId, tagId },
      include: {
        tag: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });
  }

  async removeTagFromTask(taskId: string, tagId: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('タスクが見つかりません');
    }

    await this.checkProjectAccess(task.projectId, userId);

    const taskTag = await this.prisma.taskTag.findFirst({
      where: { taskId, tagId },
    });

    if (!taskTag) {
      throw new NotFoundException('タグが見つかりません');
    }

    await this.prisma.taskTag.delete({
      where: { id: taskTag.id },
    });

    return { message: 'タグを削除しました' };
  }

  private async checkProjectAccess(projectId: string, userId: string) {
    const member = await this.prisma.projectMember.findFirst({
      where: { projectId, userId },
    });

    if (!member) {
      throw new ForbiddenException('このプロジェクトへのアクセス権限がありません');
    }
  }
}