import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { TaskTemplatesService } from './task-templates.service';
import { CreateTaskTemplateDto } from './dto/create-task-template.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('task-templates')
@UseGuards(JwtAuthGuard)
export class TaskTemplatesController {
  constructor(private readonly service: TaskTemplatesService) {}

  @Get()
  findAll(
    @CurrentUser('id') userId: string,
    @Query('projectId') projectId: string,
  ) {
    return this.service.findAll(userId, projectId);
  }

  @Post()
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateTaskTemplateDto,
  ) {
    return this.service.create(userId, dto);
  }

  @Delete(':id')
  remove(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.service.remove(userId, id);
  }
}
