import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { VinylService } from './vinyl.service';
import { CreateVinylDto } from './dto/create-vinyl.dto';
import { UpdateVinylDto } from './dto/update-vinyl.dto';
import { VinylQueryDto } from './dto/vinyl-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { Public } from '../auth/decorators/public.decorator';
import { SearchAuthGuard } from '../auth/guards/search-auth.guard';
import { TelegramService } from '../telegram/telegram.service';
import { ConfigService } from '@nestjs/config';

@ApiTags('vinyl')
@Controller('vinyl')
export class VinylController {
  constructor(
    private readonly vinylService: VinylService,
    private readonly telegramService: TelegramService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  @Public()
  @UseGuards(SearchAuthGuard)
  @ApiOperation({ summary: 'Список виниловых пластинок (публичный)' })
  findAll(@Query() query: VinylQueryDto, @CurrentUser() user?: User) {
    return this.vinylService.findAll(query, user?.id);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Получить пластинку по ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.vinylService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Добавить новую пластинку (только Admin)' })
  create(@Body() dto: CreateVinylDto, @CurrentUser() user: User) {
    return this.vinylService.create(dto, user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Обновить пластинку (только Admin)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVinylDto,
    @CurrentUser() user: User,
  ) {
    return this.vinylService.update(id, dto, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Удалить пластинку (только Admin)' })
  delete(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.vinylService.delete(id, user.id);
  }

  @Post(':id/share')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Сделать пост в telegram (только Admin)' })
  async shareToTelegram(@Param('id') id: string) {
    const vinyl = await this.vinylService.findOne(id);
    const appUrl = this.configService.get<string>('appUrl') || 'http://localhost:3000';
    await this.telegramService.postNewVinylToChannel(vinyl, appUrl);
    return { message: 'Shared to Telegram successfully' };
  }
}
