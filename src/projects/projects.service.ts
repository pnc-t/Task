import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
    ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { WebSocketsGateway } from '../websockets/websockets.gateway';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { randomBytes } from 'crypto';

@Injectable()
export class ProjectsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly websockets: WebSocketsGateway,
        private readonly emailService: EmailService,
        private readonly notificationsService: NotificationsService,
    ) {}


    async create(userId: string, createProjectDto:CreateProjectDto) {
        const project = await this.prisma.project.create({
            data:{
                ...createProjectDto,
                members:{
                    create:{
                        userId:userId,
                        role:'owner',
                    },
                },
            },
            include:{
                members:{
                    include:{
                        user:{
                            select:{
                                id:true,
                                name:true,
                                email:true,
                                avatar:true,
                            },
                        },
                    },
                },
                _count:{
                    select:{
                        tasks:true,
                    },
                },
            },
        });

        this.websockets.notifyProjectCreated(project.id, project);
        return project;
    }

    async findAll(userId:string) {
        return this.prisma.project.findMany({
            where:{
                members:{
                    some:{
                        userId,
                    },
                },
            },
            include:{
                members:{
                    include:{
                        user:{
                            select:{
                                id:true,
                                name:true,
                                email:true,
                                avatar:true,
                            },
                        },
                    },
                },
                _count:{
                    select:{
                        tasks:true,
                    },
                },
            },
            orderBy:{
                createdAt:'desc'
            },
        });
    }

    async findOne(projectId: string, userId: string) {
        const project = await this.prisma.project.findUnique({
            where:{ id:projectId },
            include:{
                members:{
                    include:{
                        user:{
                            select:{
                                id:true,
                                name:true,
                                email:true,
                                avatar:true,
                            },
                        },
                    },
                },
                tasks:{
                    include:{
                        assignee:{
                            select:{
                                id:true,
                                name:true,
                                email:true,
                                avatar:true,
                            },
                        },
                    },
                    orderBy:{
                        createdAt:'desc',
                    },
                },
            },
        });

        if (!project) {
            throw new NotFoundException('Not Found Project');
        }

        const isMember = project.members.some(
            (member) => member.userId === userId,
        );

        if (!isMember) {
            throw new ForbiddenException('Not AccessPermission for This Project');
        }
        return project;
    }

    async update(projectId:string, userId:string, updateProjectDto:UpdateProjectDto) {
        await this.checkPermission(projectId, userId,['owner','admin']);

        const project = await this.prisma.project.update({
            where:{ id:projectId },
            data: updateProjectDto,
            include:{
                members:{
                    include:{
                        user:{
                            select:{
                                id:true,
                                name:true,
                                email:true,
                                avatar:true,
                            },
                        },
                    },
                },
            },
        });

        this.websockets.notifyProjectUpdated(projectId, project);
        return project;
    }

    async remove(projectId: string, userId: string) {
        await this.checkPermission(projectId, userId,['owner']);

        return this.prisma.project.delete({
            where:{ id: projectId },
        });
    }

    async addMember(projectId: string, userId: string, addMemberDto: AddMemberDto) {
        await this.checkPermission(projectId, userId,['owner','admin']);

        return this.prisma.projectMember.create({
            data:{
                projectId,
                userId:addMemberDto.userId,
                role:addMemberDto.role,
            },
            include:{
                user:{
                    select:{
                        id:true,
                        name:true,
                        email:true,
                    },
                },
            },
        });
    }

    async removeMember(projectId: string, userId: string, memberId: string) {
        await this.checkPermission(projectId, userId,['owner','admin']);

        return this.prisma.projectMember.delete({
            where:{ id: memberId },
        })
    }

    async checkPermission(
        projectId: string,
        userId: string,
        allowedRoles: string[],
    ){
        const member = await this.prisma.projectMember.findFirst({
            where:{
                projectId,
                userId,
            },
        });
        if (!member || !allowedRoles.includes(member.role)) {
            throw new ForbiddenException('Not AccessPermission for Control ');
        }

        return member;
    }

    // ================ 招待機能 ================

    async inviteMember(projectId: string, userId: string, inviteMemberDto: InviteMemberDto) {
        await this.checkPermission(projectId, userId, ['owner', 'admin']);

        const project = await this.prisma.project.findUnique({
            where: { id: projectId },
        });

        if (!project) {
            throw new NotFoundException('プロジェクトが見つかりません');
        }

        const inviter = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!inviter) {
            throw new NotFoundException('ユーザーが見つかりません');
        }

        // 既存ユーザーかチェック
        const existingUser = await this.prisma.user.findUnique({
            where: { email: inviteMemberDto.email },
        });

        // 既にメンバーの場合
        if (existingUser) {
            const existingMember = await this.prisma.projectMember.findFirst({
                where: {
                    projectId,
                    userId: existingUser.id,
                },
            });
            if (existingMember) {
                throw new ConflictException('このユーザーは既にプロジェクトのメンバーです');
            }
        }

        // 既存の有効な招待をチェック
        const existingInvitation = await this.prisma.projectInvitation.findFirst({
            where: {
                projectId,
                email: inviteMemberDto.email,
                status: 'pending',
                expiresAt: { gt: new Date() },
            },
        });

        if (existingInvitation) {
            throw new ConflictException('このメールアドレスには既に招待を送信しています');
        }

        // トークン生成
        const token = randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7日間有効

        // 招待を作成
        const invitation = await this.prisma.projectInvitation.create({
            data: {
                email: inviteMemberDto.email,
                token,
                role: inviteMemberDto.role || 'member',
                expiresAt,
                projectId,
                inviterId: userId,
                inviteeId: existingUser?.id,
            },
            include: {
                project: { select: { name: true } },
                inviter: { select: { name: true } },
            },
        });

        // メール送信
        await this.emailService.sendProjectInvitationEmail(
            inviteMemberDto.email,
            project.name,
            inviter.name,
            token,
            !existingUser,
        );

        // 既存ユーザーには通知も送信
        if (existingUser) {
            await this.notificationsService.notifyProjectInvitation(
                existingUser.id,
                projectId,
                project.name,
                inviter.name,
                invitation.id,
            );
        }

        return invitation;
    }

    async getProjectInvitations(projectId: string, userId: string) {
        await this.checkPermission(projectId, userId, ['owner', 'admin']);

        return this.prisma.projectInvitation.findMany({
            where: { projectId },
            include: {
                inviter: { select: { id: true, name: true, email: true } },
                invitee: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getMyInvitations(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('ユーザーが見つかりません');
        }

        return this.prisma.projectInvitation.findMany({
            where: {
                OR: [
                    { inviteeId: userId },
                    { email: user.email },
                ],
                status: 'pending',
                expiresAt: { gt: new Date() },
            },
            include: {
                project: { select: { id: true, name: true, description: true } },
                inviter: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async respondToInvitation(invitationId: string, userId: string, action: 'accept' | 'decline') {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('ユーザーが見つかりません');
        }

        const invitation = await this.prisma.projectInvitation.findFirst({
            where: {
                id: invitationId,
                OR: [
                    { inviteeId: userId },
                    { email: user.email },
                ],
                status: 'pending',
            },
            include: {
                project: { select: { id: true, name: true } },
            },
        });

        if (!invitation) {
            throw new NotFoundException('招待が見つからないか、既に処理されています');
        }

        if (invitation.expiresAt < new Date()) {
            await this.prisma.projectInvitation.update({
                where: { id: invitationId },
                data: { status: 'expired' },
            });
            throw new BadRequestException('この招待は期限切れです');
        }

        if (action === 'accept') {
            // 既にメンバーかチェック
            const existingMember = await this.prisma.projectMember.findFirst({
                where: {
                    projectId: invitation.projectId,
                    userId,
                },
            });

            if (existingMember) {
                await this.prisma.projectInvitation.update({
                    where: { id: invitationId },
                    data: { status: 'accepted' },
                });
                throw new ConflictException('既にこのプロジェクトのメンバーです');
            }

            // メンバーとして追加
            await this.prisma.$transaction([
                this.prisma.projectInvitation.update({
                    where: { id: invitationId },
                    data: { status: 'accepted', inviteeId: userId },
                }),
                this.prisma.projectMember.create({
                    data: {
                        projectId: invitation.projectId,
                        userId,
                        role: invitation.role,
                    },
                }),
            ]);

            // WebSocketで通知
            this.websockets.notifyMemberAdded(invitation.projectId, {
                userId,
                userName: user.name,
                role: invitation.role,
            });

            return {
                success: true,
                message: `プロジェクト「${invitation.project.name}」に参加しました`,
                projectId: invitation.projectId,
            };
        } else {
            // 拒否
            await this.prisma.projectInvitation.update({
                where: { id: invitationId },
                data: { status: 'declined' },
            });

            return {
                success: true,
                message: '招待を辞退しました',
            };
        }
    }

    async cancelInvitation(projectId: string, invitationId: string, userId: string) {
        await this.checkPermission(projectId, userId, ['owner', 'admin']);

        const invitation = await this.prisma.projectInvitation.findFirst({
            where: {
                id: invitationId,
                projectId,
                status: 'pending',
            },
        });

        if (!invitation) {
            throw new NotFoundException('招待が見つからないか、既に処理されています');
        }

        await this.prisma.projectInvitation.delete({
            where: { id: invitationId },
        });

        return { success: true, message: '招待をキャンセルしました' };
    }

    async resendInvitation(projectId: string, invitationId: string, userId: string) {
        await this.checkPermission(projectId, userId, ['owner', 'admin']);

        const invitation = await this.prisma.projectInvitation.findFirst({
            where: {
                id: invitationId,
                projectId,
                status: 'pending',
            },
            include: {
                project: true,
                inviter: true,
            },
        });

        if (!invitation) {
            throw new NotFoundException('招待が見つからないか、既に処理されています');
        }

        // トークンと有効期限を更新
        const token = randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await this.prisma.projectInvitation.update({
            where: { id: invitationId },
            data: { token, expiresAt },
        });

        // メール再送信
        const existingUser = await this.prisma.user.findUnique({
            where: { email: invitation.email },
        });

        await this.emailService.sendProjectInvitationEmail(
            invitation.email,
            invitation.project.name,
            invitation.inviter.name,
            token,
            !existingUser,
        );

        return { success: true, message: '招待を再送信しました' };
    }
}
