import { IsString, IsOptional, IsDateString, IsIn } from 'class-validator';

export class UpdateMilestoneDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsIn(['pending', 'completed'])
  status?: string;
}