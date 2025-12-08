import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { WebSocketsModule} from "../websockets/websockets.module";

@Module({
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
  imports: [WebSocketsModule]
})
export class TasksModule {}