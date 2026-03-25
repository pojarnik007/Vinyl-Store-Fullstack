import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({
    example: 'd07c2fa8-6cbc-40e8-95bb-18e22b38810c',
    description: 'ID виниловой пластинки для покупки',
  })
  @IsUUID('4')
  vinylId: string;
}
