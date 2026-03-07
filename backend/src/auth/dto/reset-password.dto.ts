import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(8, { message: 'パスワードは8文字以上である必要があります' })
  @MaxLength(50, { message: 'パスワードは50文字以下である必要があります' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[\d\W])/, {
    message: 'パスワードは大文字、小文字、数字または特殊文字を含む必要があります',
  })
  newPassword: string;
}
