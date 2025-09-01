import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { MailerService } from '../mailer/mailer.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { CreateUserDto } from '../users/dto/createUser.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailerService: MailerService,
  ) {}

  async register(createUserDto: CreateUserDto) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: createUserDto.email },
          ...(createUserDto['userName']
            ? [{ userName: createUserDto['userName'] }]
            : []),
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email === createUserDto.email) {
        throw new ConflictException('Email already registered');
      }
      if (
        createUserDto['userName'] &&
        existingUser.userName === createUserDto['userName']
      ) {
        throw new ConflictException('Username already taken');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Generate email verification token
    const verificationToken = this.jwtService.sign(
      { sub: createUserDto.userName, email: createUserDto.email },
      { expiresIn: '1d' },
    );

    // Compose fullName and userName
    const fullName = createUserDto.fullName?.trim();
    const baseUsername = fullName || createUserDto.email.split('@')[0];

    // Create user
    const user = await this.prisma.user.create({
      data: {
        fullName,
        userName: baseUsername,
        email: createUserDto.email,
        password: hashedPassword,
        dateOfBirth: createUserDto.dateOfBirth,
        phoneNumber: createUserDto.phoneNumber,
        avatar: createUserDto.avatar,
        bio: createUserDto.bio,
        location: createUserDto.location,
        role: 'USER',
      },
      select: {
        id: true,
        userName: true,
        email: true,
        fullName: true,
        avatar: true,
        role: true,
        dateOfBirth: true,
        isEmailVerified: true,
        emailVerifiedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Send verification email
    await this.mailerService.sendEmailVerification(
      user.email,
      user.userName || 'User',
      verificationToken,
    );

    return {
      message:
        'User registered successfully. Please check your email to verify your account.',
      user,
      requiresEmailVerification: true,
    };
  }

  async verifyEmail(token: string) {
    if (!token) {
      throw new BadRequestException('Verification token is required');
    }

    let payload: any;
    try {
      payload = this.jwtService.verify(token);
    } catch (err) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    const email = payload.email;
    if (!email) {
      throw new BadRequestException('Invalid token payload');
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isEmailVerified) {
      return {
        message: 'Email is already verified',
        user: {
          id: user.id,
          email: user.email,
          isEmailVerified: true,
        },
      };
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true, emailVerifiedAt: new Date() },
      select: {
        id: true,
        userName: true,
        email: true,
        fullName: true,
        isEmailVerified: true,
        emailVerifiedAt: true,
        createdAt: true,
      },
    });

    const newPayload = { sub: updatedUser.id, email: updatedUser.email };
    const accessToken = this.jwtService.sign(newPayload);

    return {
      message: 'Email verified successfully',
      user: updatedUser,
      accessToken,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: loginDto.email },
          ...(loginDto.userName ? [{ userName: loginDto.userName }] : []),
        ],
      },
    });

    if (!user || !(await bcrypt.compare(loginDto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isEmailVerified) {
      return {
        success: false,
        message: 'Please verify your email before logging in',
        requiresEmailVerification: true,
        email: user.email,
      };
    }

    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    return {
      success: true,
      message: 'Login successful',
      accessToken,
      user: {
        id: user.id,
        userName: user.userName,
        email: user.email,
        fullName: user.fullName,
        avatar: user.avatar,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
    };
  }

  async resendVerificationEmail(email: string) {
    if (!email) {
      throw new BadRequestException('Email is required');
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isEmailVerified) {
      return {
        message: 'Email is already verified',
        user: {
          id: user.id,
          email: user.email,
          isEmailVerified: true,
        },
      };
    }

    const verificationToken = this.jwtService.sign({ email: user.email });

    await this.mailerService.sendEmailVerification(
      user.email,
      user.userName || 'User',
      verificationToken,
    );

    return {
      message: 'Verification email sent successfully',
      user: {
        id: user.id,
        email: user.email,
        emailVerified: false,
      },
    };
  }

  async validateUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        userName: true,
        role: true,
        fullName: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }
}
