import { IsString, IsOptional, IsDateString, IsIn, IsNumber, Min, Max, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  assigneeId?: string;

  @IsOptional()
  @IsIn(['todo', 'in_progress', 'done'])
  status?: string;

  @IsOptional()
  @IsIn(['low', 'medium', 'high'])
  priority?: string;

  @IsOptional()
  @IsDateString({}, { message: 'startDate must be a valid ISO 8601 date string' })
  @Transform(({ value }) => {
    if (value === '' || value === null) {
      return undefined;
    }
    return value;
  })
  startDate?: string;

  @IsOptional()
  @IsDateString({}, { message: 'dueDate must be a valid ISO 8601 date string' })
  @Transform(({ value }) => {
    if (value === '' || value === null) {
      return undefined;
    }
    return value;
  })
  dueDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedHours?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  actualHours?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  progress?: number;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => {
    if (value === '' || value === null) {
      return null;
    }
    return value;
  })
  milestoneId?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagIds?: string[];

  @IsOptional()
  @IsDateString({}, { message: 'actualStartDate must be a valid ISO 8601 date string' })
  @Transform(({ value }) => {
    if (value === '' || value === null) {
      return null;
    }
    return value;
  })
  actualStartDate?: string | null;

  @IsOptional()
  @IsDateString({}, { message: 'actualEndDate must be a valid ISO 8601 date string' })
  @Transform(({ value }) => {
    if (value === '' || value === null) {
      return null;
    }
    return value;
  })
  actualEndDate?: string | null;
}