import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { IcalService } from './ical.service';
import { PrismaModule } from '../prisma/prisma.module';
import { WebSocketsModule } from '../websockets/websockets.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    PrismaModule,
    WebSocketsModule,
    NotificationsModule,
    MulterModule.register({
      dest: './uploads', // アップロード先ディレクトリ
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  ],
  controllers: [TasksController],
  providers: [TasksService, IcalService],
  exports: [TasksService],
})
export class TasksModule {}