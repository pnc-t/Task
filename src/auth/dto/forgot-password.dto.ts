import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail({}, { message: '有効なメールアドレスを入力してください' })
  email: string;
}
