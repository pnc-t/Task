import { IsArray, IsEnum, IsOptional, IsString, IsBoolean } from 'class-validator';

export class BulkUpdateTaskDto {
  @IsArray()
  @IsString({ each: true })
  taskIds: string[];

  @IsOptional()
  @IsEnum(['todo', 'in_progress', 'done'])
  status?: 'todo' | 'in_progress' | 'done';

  @IsOptional()
  @IsEnum(['low', 'medium', 'high'])
  priority?: 'low' | 'medium' | 'high';

  @IsOptional()
  @IsString()
  assigneeId?: string;

  @IsOptional()
  @IsBoolean()
  delete?: boolean;
}
