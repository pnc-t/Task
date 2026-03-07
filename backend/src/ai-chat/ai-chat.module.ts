import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AiChatController } from './ai-chat.controller';
import { AiChatService } from './ai-chat.service';
import { AiChatGateway } from './ai-chat.gateway';
import { AiProviderFactory } from './providers/ai-provider.factory';
import { OpenAiProvider } from './providers/openai.provider';
import { AnthropicProvider } from './providers/anthropic.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { TaskToolsService } from './tools/task-tools';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
    }),
  ],
  controllers: [AiChatController],
  providers: [
    AiChatService,
    AiChatGateway,
    AiProviderFactory,
    OpenAiProvider,
    AnthropicProvider,
    GeminiProvider,
    TaskToolsService,
  ],
  exports: [AiChatService],
})
export class AiChatModule {}
