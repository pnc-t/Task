import { IsString, IsOptional, IsDateString, IsIn, IsArray } from 'class-validator';
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
}
