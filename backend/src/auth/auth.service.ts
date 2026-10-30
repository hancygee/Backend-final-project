import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Prisma } from '../generated/prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  async register(registerDto: RegisterDto) {
    const { name, email, password } = registerDto;

    // Normalize email to avoid case-related duplicates
    const normalizedEmail = email.trim().toLowerCase();

    // Check whether the email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    
    // Never store plaintext passwords
    const passwordHash = await bcrypt.hash(password, 12);

    try {
      // Create a regular user account
      const user = await this.prisma.user.create({
        data: {
          name,
          email: normalizedEmail,
          passwordHash,
          role: 'USER',
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      return {
        message: 'User registered successfully',
        data: user,
      };
    } catch (error: unknown) {
      // Handle concurrent registrations with the same email
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Email already registered');
      }

      throw error;
    }
  }
  
async login(loginDto: LoginDto) {
  const email = loginDto.email.trim().toLowerCase();

  // Find the registered user
  const user = await this.prisma.user.findUnique({
    where: { email },
  });

  // Avoid revealing whether the email exists
  if (!user) {
    throw new UnauthorizedException(
      'Invalid email or password',
    );
  }

  // Compare the submitted password with its stored hash
  const isPasswordValid = await bcrypt.compare(
    loginDto.password,
    user.passwordHash,
  );

  if (!isPasswordValid) {
    throw new UnauthorizedException(
      'Invalid email or password',
    );
  }

  // Create a signed JWT containing only necessary identity data
  const accessToken = await this.jwtService.signAsync({
    sub: user.id,
    role: user.role,
  });

  return {
    message: 'Login successful',
    access_token: accessToken,
    token_type: 'Bearer',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}


async getProfile(userId: number) {
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new NotFoundException('User not found');
  }

  return user;
}

}
