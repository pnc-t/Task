import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';
import { MilestonesModule } from './milestones/milestones.module';
import { TagsModule } from './tags/tags.module';
import { HealthController } from './health/health.controller';
import { WebSocketsModule } from './websockets/websockets.module';
import { EmailModule } from './email/email.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    EmailModule,
    AuthModule,
    UsersModule,
    ProjectsModule,
    TasksModule,
    MilestonesModule,
    TagsModule,
    WebSocketsModule,
    NotificationsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}