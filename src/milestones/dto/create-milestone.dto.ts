import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateMilestoneDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  dueDate: string;

  @IsString()
  projectId: string;
}