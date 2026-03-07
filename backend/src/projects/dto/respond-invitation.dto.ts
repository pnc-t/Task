import { IsString, IsIn } from 'class-validator';

export class RespondInvitationDto {
  @IsString()
  @IsIn(['accept', 'decline'])
  action: 'accept' | 'decline';
}
