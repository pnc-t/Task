import { IsString, IsOptional, IsDateString, IsIn, IsArray, IsNumber, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateTaskDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  projectId: string;

  @IsOptional()
  @IsString()
  assigneeId?: string;

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
    // 空文字列の場合はundefinedに変換
    if (value === '' || value === null) {
      return undefined;
    }
    return value;
  })
  dueDate?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dependsOn?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedHours?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  progress?: number;

  @IsOptional()
  @IsString()
  milestoneId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagIds?: string[];
}
