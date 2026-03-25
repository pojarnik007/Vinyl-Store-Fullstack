import { PartialType } from '@nestjs/swagger';
import { CreateVinylDto } from './create-vinyl.dto';

export class UpdateVinylDto extends PartialType(CreateVinylDto) {}
