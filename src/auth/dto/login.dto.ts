import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'mail@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'goodPass' })
  @IsString()
  password: string;
}
