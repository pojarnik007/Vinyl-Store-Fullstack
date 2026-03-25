import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as TelegramBot from 'node-telegram-bot-api';
import { VinylRecord } from '../vinyl/entities/vinyl.entity';

@Injectable()
export class TelegramService implements OnModuleInit {
  private bot?: TelegramBot;
  private channelId?: string;
  private readonly logger = new Logger(TelegramService.name);

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    this.channelId = this.configService.get<string>('TELEGRAM_CHANNEL_ID');

    if (!token || !this.channelId) {
      this.logger.warn(
        'Telegram Bot not configured. Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHANNEL_ID',
      );
      return;
    }

    try {
      const TelegramBotClass = (TelegramBot as any).default || TelegramBot;

      this.bot = new TelegramBotClass(token, { polling: false });
      this.logger.log('Telegram Bot initialized');
    } catch (error) {
      this.logger.error(`Failed to initialize Telegram Bot: ${error.message}`);
    }
  }

  async postNewVinylToChannel(vinyl: VinylRecord, storeBaseUrl: string): Promise<void> {
    if (!this.bot || !this.channelId) {
      this.logger.warn('Telegram Bot not initialized, skipping post');
      return;
    }

    const vinylUrl = `${storeBaseUrl}/vinyl/${vinyl.id}`;

    const message = [
      `🎵 *New Vinyl in Store!*`,
      ``,
      `*${this.escapeMarkdown(vinyl.name)}*`,
      `👤 Artist: ${this.escapeMarkdown(vinyl.authorName)}`,
      `💰 Price: $${Number(vinyl.price).toFixed(2)}`,
      ``,
      vinyl.description.length > 150
        ? `${this.escapeMarkdown(vinyl.description.substring(0, 150))}...`
        : this.escapeMarkdown(vinyl.description),
      ``,
      `[🛒 View in Store](${vinylUrl})`,
    ].join('\n');

    try {
      if (vinyl.image) {
        await this.bot.sendPhoto(this.channelId, vinyl.image, {
          caption: message,
          parse_mode: 'Markdown',
        });
      } else {
        await this.bot.sendMessage(this.channelId, message, {
          parse_mode: 'Markdown',
          disable_web_page_preview: false,
        });
      }
      this.logger.log(`Posted vinyl "${vinyl.name}" to Telegram channel`);
    } catch (error) {
      this.logger.error(`Failed to post to Telegram: ${error.message}`);
    }
  }

  private escapeMarkdown(text: string): string {
    return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
  }
}
