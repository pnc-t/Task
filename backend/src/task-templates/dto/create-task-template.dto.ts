import { IsString, IsOptional, IsNumber, IsArray } from 'class-validator';

export class CreateTaskTemplateDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsNumber()
  estimatedHours?: number;

  @IsOptional()
  @IsArray()
  subtasks?: { title: string }[];

  @IsOptional()
  @IsArray()
  tags?: { name: string; color: string }[];

  @IsString()
  projectId: string;
}
