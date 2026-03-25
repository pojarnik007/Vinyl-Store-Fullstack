import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DiscogsService } from './discogs.service';
import { VinylService } from '../vinyl/vinyl.service';
import { LogsService } from '../logs/logs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { LogAction, LogEntity } from '../logs/entities/system-log.entity';

class DiscogsSearchDto {
  @ApiProperty() @IsString() q: string;
}

@ApiTags('admin')
@Controller('admin/discogs')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth('JWT-auth')
export class DiscogsController {
  constructor(
    private readonly discogsService: DiscogsService,
    private readonly vinylService: VinylService,
    private readonly logsService: LogsService,
  ) {}

  @Get('search')
  @ApiOperation({ summary: 'Поиск по Discogs (только Admin)' })
  search(@Query() dto: DiscogsSearchDto) {
    return this.discogsService.searchReleases(dto.q);
  }

  @Post('import/:releaseId')
  @ApiOperation({ summary: 'Импортировать пластинку из Discogs (только Admin)' })
  async importRelease(@Param('releaseId') releaseId: string, @CurrentUser() admin: User) {
    const release = await this.discogsService.getRelease(releaseId);
    const vinylData = this.discogsService.mapReleaseToVinyl(release);
    const vinyl = await this.vinylService.create(vinylData, admin.id);

    await this.logsService.log(LogAction.CREATE, LogEntity.VINYL, vinyl.id, admin.id, {
      source: 'discogs',
      releaseId,
    });

    return vinyl;
  }
}
