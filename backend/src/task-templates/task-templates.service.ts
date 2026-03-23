import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskTemplateDto } from './dto/create-task-template.dto';

@Injectable()
export class TaskTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, projectId: string) {
    await this.checkAccess(projectId, userId);
    return this.prisma.taskTemplate.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      include: { createdBy: { select: { id: true, name: true } } },
    });
  }

  async create(userId: string, dto: CreateTaskTemplateDto) {
    await this.checkAccess(dto.projectId, userId);

    return this.prisma.taskTemplate.create({
      data: {
        name: dto.name,
        description: dto.description,
        priority: dto.priority || 'medium',
        estimatedHours: dto.estimatedHours,
        subtasks: dto.subtasks ? JSON.parse(JSON.stringify(dto.subtasks)) : undefined,
        tags: dto.tags ? JSON.parse(JSON.stringify(dto.tags)) : undefined,
        projectId: dto.projectId,
        createdById: userId,
      },
    });
  }

  async remove(userId: string, id: string) {
    const template = await this.prisma.taskTemplate.findUnique({ where: { id } });
    if (!template) throw new NotFoundException('テンプレートが見つかりません');
    await this.checkAccess(template.projectId, userId);

    await this.prisma.taskTemplate.delete({ where: { id } });
    return { message: 'テンプレートを削除しました' };
  }

  private async checkAccess(projectId: string, userId: string) {
    const member = await this.prisma.projectMember.findFirst({
      where: { projectId, userId },
    });
    if (!member) throw new ForbiddenException('プロジェクトへのアクセス権がありません');
  }
}
