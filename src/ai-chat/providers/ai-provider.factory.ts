import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiProviderInterface } from './ai-provider.interface';
import { OpenAiProvider } from './openai.provider';
import { AnthropicProvider } from './anthropic.provider';
import { GeminiProvider } from './gemini.provider';

export type AiProviderType = 'openai' | 'anthropic' | 'gemini';

@Injectable()
export class AiProviderFactory {
  private readonly logger = new Logger(AiProviderFactory.name);
  private providers: Map<AiProviderType, AiProviderInterface> = new Map();

  constructor(
    private configService: ConfigService,
    private openaiProvider: OpenAiProvider,
    private anthropicProvider: AnthropicProvider,
    private geminiProvider: GeminiProvider,
  ) {
    this.providers.set('openai', this.openaiProvider);
    this.providers.set('anthropic', this.anthropicProvider);
    this.providers.set('gemini', this.geminiProvider);
  }

  getProvider(type?: AiProviderType): AiProviderInterface {
    const providerType =
      type || (this.configService.get<string>('AI_PROVIDER') as AiProviderType) || 'openai';

    const provider = this.providers.get(providerType);

    if (!provider) {
      this.logger.warn(`Unknown provider type: ${providerType}, falling back to OpenAI`);
      return this.openaiProvider;
    }

    return provider;
  }

  getAvailableProviders(): AiProviderType[] {
    const available: AiProviderType[] = [];

    if (this.configService.get<string>('OPENAI_API_KEY')) {
      available.push('openai');
    }
    if (this.configService.get<string>('ANTHROPIC_API_KEY')) {
      available.push('anthropic');
    }
    if (this.configService.get<string>('GOOGLE_API_KEY')) {
      available.push('gemini');
    }

    return available;
  }
}
