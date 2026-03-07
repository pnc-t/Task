import { IsNumber, IsOptional, IsString, IsDateString, Min } from 'class-validator';

export class UpdateTimeEntryDto {
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  hours?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;
}
