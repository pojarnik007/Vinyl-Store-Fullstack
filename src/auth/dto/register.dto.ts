import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Max@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Max' })
  @IsString()
  @MinLength(2)
  firstName: string;

  @ApiProperty({ example: 'Me' })
  @IsString()
  @MinLength(2)
  lastName: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(8)
  @MaxLength(32)
  password: string;
}
