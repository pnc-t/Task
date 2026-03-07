import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';

@Injectable()
export class MilestonesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, createMilestoneDto: CreateMilestoneDto) {
    const { projectId, ...milestoneData } = createMilestoneDto;

    await this.checkProjectAccess(projectId, userId);

    return this.prisma.milestone.create({
      data: {
        ...milestoneData,
        projectId,
      },
      include: this.getMilestoneInclude(),
    });
  }

  async findAll(userId: string, projectId: string) {
    await this.checkProjectAccess(projectId, userId);

    return this.prisma.milestone.findMany({
      where: { projectId },
      include: this.getMilestoneInclude(),
      orderBy: { dueDate: 'asc' },
    });
  }

  async findOne(milestoneId: string, userId: string) {
    const milestone = await this.prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: this.getMilestoneInclude(),
    });

    if (!milestone) {
      throw new NotFoundException('マイルストーンが見つかりません');
    }

    await this.checkProjectAccess(milestone.projectId, userId);

    return milestone;
  }

  async update(milestoneId: string, userId: string, updateMilestoneDto: UpdateMilestoneDto) {
    const milestone = await this.findOne(milestoneId, userId);

    return this.prisma.milestone.update({
      where: { id: milestoneId },
      data: updateMilestoneDto,
      include: this.getMilestoneInclude(),
    });
  }

  async remove(milestoneId: string, userId: string) {
    await this.findOne(milestoneId, userId);

    await this.prisma.milestone.delete({
      where: { id: milestoneId },
    });

    return { message: 'マイルストーンを削除しました' };
  }

  private async checkProjectAccess(projectId: string, userId: string) {
    const member = await this.prisma.projectMember.findFirst({
      where: { projectId, userId },
    });

    if (!member) {
      throw new ForbiddenException('このプロジェクトへのアクセス権限がありません');
    }
  }

  private getMilestoneInclude() {
    return {
      tasks: {
        select: {
          id: true,
          title: true,
          status: true,
          progress: true,
        },
      },
      _count: {
        select: {
          tasks: true,
        },
      },
    };
  }
}