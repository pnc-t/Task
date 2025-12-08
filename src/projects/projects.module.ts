import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { WebSocketsModule} from "../websockets/websockets.module";

@Module({
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
  imports: [WebSocketsModule]
})
export class ProjectsModule {}
