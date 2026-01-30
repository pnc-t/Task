import { IsArray, IsString } from 'class-validator';

export class ReorderSubtasksDto {
  @IsArray()
  @IsString({ each: true })
  subtaskIds: string[];
}