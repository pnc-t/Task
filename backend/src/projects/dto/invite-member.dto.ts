import { IsEmail, IsString, IsIn, IsOptional } from 'class-validator';

export class InviteMemberDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsIn(['member', 'admin'])
  @IsOptional()
  role?: string = 'member';
}
