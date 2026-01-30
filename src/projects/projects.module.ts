import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { WebSocketsModule } from '../websockets/websockets.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
  imports: [WebSocketsModule, NotificationsModule],
})
export class ProjectsModule {}
