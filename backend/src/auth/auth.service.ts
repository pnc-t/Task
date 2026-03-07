import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseEntity } from './entities/auth-response.entity';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * ユーザー登録
   */
  async register(registerDto: RegisterDto): Promise<AuthResponseEntity> {
    const { email, password, name } = registerDto;

    // メールアドレスの重複チェック
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('このメールアドレスは既に登録されています');
    }

    // パスワードのハッシュ化
    const hashedPassword = await this.hashPassword(password);

    // ユーザーの作成
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        createdAt: true,
      },
    });

    this.logger.log(`New user registered: ${user.email}`);

    // JWTトークンの生成
    const accessToken = this.generateAccessToken(user.id, user.email);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
    };
  }

  /**
   * ログイン
   */
  async login(loginDto: LoginDto): Promise<AuthResponseEntity> {
    const { email, password } = loginDto;

    // ユーザーの検索
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('メールアドレスまたはパスワードが正しくありません');
    }

    // パスワードの検証
    const isPasswordValid = await this.verifyPassword(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('メールアドレスまたはパスワードが正しくありません');
    }

    this.logger.log(`User logged in: ${user.email}`);

    // JWTトークンの生成
    const accessToken = this.generateAccessToken(user.id, user.email);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
    };
  }

  /**
   * トークンの検証とユーザー情報の取得
   */
  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('ユーザーが見つかりません');
    }

    return user;
  }

  /**
   * 現在のユーザー情報を取得
   */
  async getCurrentUser(userId: string) {
    return this.validateUser(userId);
  }

  /**
   * パスワードのハッシュ化
   */
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * パスワードの検証
   */
  private async verifyPassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  /**
   * アクセストークンの生成
   */
  private generateAccessToken(userId: string, email: string): string {
    const payload = { sub: userId, email };
    return this.jwtService.sign(payload);
  }

  /**
   * パスワードリセットリクエスト
   */
  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      // セキュリティ: ユーザーが存在しなくても同じレスポンスを返す
      this.logger.log(`Password reset requested for non-existent email: ${email}`);
      return { message: 'パスワードリセットメールを送信しました' };
    }

    // 既存の未使用トークンを無効化
    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    // 新しいトークン生成
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(rawToken, 10);

    await this.prisma.passwordResetToken.create({
      data: {
        token: hashedToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 3600000), // 1時間
      },
    });

    await this.emailService.sendPasswordResetEmail(email, rawToken, user.name);

    this.logger.log(`Password reset email sent to: ${email}`);
    return { message: 'パスワードリセットメールを送信しました' };
  }

  /**
   * パスワードリセット実行
   */
  async resetPassword(token: string, newPassword: string) {
    // 全ての有効なトークンを取得して照合
    const tokens = await this.prisma.passwordResetToken.findMany({
      where: {
        used: false,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    let validToken: (typeof tokens)[0] | null = null;
    for (const t of tokens) {
      if (await bcrypt.compare(token, t.token)) {
        validToken = t;
        break;
      }
    }

    if (!validToken) {
      throw new BadRequestException('無効または期限切れのトークンです');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: validToken.userId },
        data: { password: hashedPassword },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: validToken.id },
        data: { used: true },
      }),
    ]);

    this.logger.log(`Password reset completed for user: ${validToken.user.email}`);
    return { message: 'パスワードを更新しました' };
  }
}
