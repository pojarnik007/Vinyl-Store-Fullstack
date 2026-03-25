import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { LogsService } from '../logs/logs.service';
import { LogAction, LogEntity } from '../logs/entities/system-log.entity';

interface GoogleUser {
  googleId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private readonly logsService: LogsService,
  ) {}

  async findOrCreateUser(googleUser: GoogleUser): Promise<User> {
    let user = await this.usersService.findByGoogleId(googleUser.googleId);

    if (!user) {
      user = await this.usersService.findByEmail(googleUser.email);
    }

    if (!user) {
      user = await this.usersService.create({
        googleId: googleUser.googleId,
        email: googleUser.email,
        firstName: googleUser.firstName,
        lastName: googleUser.lastName,
        avatar: googleUser.avatar,
        isAdmin: false,
      });

      this.logsService.log(LogAction.CREATE, LogEntity.USER, user.id, user.id, {
        email: user.email,
        provider: 'google',
      });
    } else if (!user.googleId) {
      user = await this.usersService.update(user.id, { googleId: googleUser.googleId });

      this.logsService.log(LogAction.UPDATE, LogEntity.USER, user.id, user.id, {
        linkedGoogle: true,
      });
    }

    return user;
  }

  generateToken(user: User): string {
    const payload = {
      sub: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
    };
    return this.jwtService.sign(payload);
  }

  async register(dto: RegisterDto): Promise<{ access_token: string }> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.usersService.create({
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      password: hashedPassword,
      isAdmin: false,
    });

    this.logsService.log(LogAction.CREATE, LogEntity.USER, user.id, user.id, {
      email: user.email,
    });

    return { access_token: this.generateToken(user) };
  }

  async login(dto: LoginDto): Promise<{ access_token: string }> {
    const user = await this.usersService.findByEmailWithPassword(dto.email);

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logsService.log(LogAction.LOGIN as any, LogEntity.USER, user.id, user.id);
    return { access_token: this.generateToken(user) };
  }

  async googleLogin(user: User): Promise<{ access_token: string }> {
    this.logsService.log(LogAction.LOGIN as any, LogEntity.USER, user.id, user.id, {
      method: 'google',
    });
    return { access_token: this.generateToken(user) };
  }
}
