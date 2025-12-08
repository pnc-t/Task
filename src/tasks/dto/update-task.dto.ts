import { IsString, IsOptional, IsDateString, IsIn } from 'class-validator';
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
  @IsDateString({}, { message: 'dueDate must be a valid ISO 8601 date string' })
  @Transform(({ value }) => {
    if (value === '' || value === null) {
      return undefined;
    }
    return value;
  })
  dueDate?: string;
}