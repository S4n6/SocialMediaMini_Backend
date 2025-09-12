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
import { mailQueue } from 'src/queues/mail.queue';
import { NotificationGateway } from '../notification/notification.gateway';
import { GoogleUserDto } from './dto/google-auth.dto';
import { OAuth2Client } from 'google-auth-library';
import { ROLES } from 'src/constants/roles.constant';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailerService: MailerService,
    private notificationGateway: NotificationGateway,
  ) {
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  async register(createUserDto: CreateUserDto) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: createUserDto.email },
          ...(createUserDto.userName
            ? [{ userName: createUserDto.userName }]
            : []),
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email === createUserDto.email) {
        throw new ConflictException('Email already registered');
      }
      if (
        createUserDto.userName &&
        existingUser.userName === createUserDto.userName
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

    // Create user
    const user = await this.prisma.user.create({
      data: {
        fullName,
        userName: createUserDto.userName as string,
        email: createUserDto.email,
        password: hashedPassword,
        dateOfBirth: createUserDto.dateOfBirth,
        phoneNumber: createUserDto.phoneNumber,
        avatar: createUserDto.avatar,
        bio: createUserDto.bio,
        location: createUserDto.location,
        role: ROLES.USER,
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
      user.userName,
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

    if (
      !user ||
      !user.password ||
      !(await bcrypt.compare(loginDto.password, user.password))
    ) {
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

    this.notificationGateway.broadcast({
      userId: user.id,
      message: 'User logged in',
    });

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

  async googleLogin(googleUser: GoogleUserDto) {
    try {
      // Tìm user đã tồn tại với Google ID
      let user = await this.prisma.user.findUnique({
        where: { googleId: googleUser.googleId },
        include: {
          followers: true,
          following: true,
          posts: true,
        },
      });

      // Nếu chưa có user với Google ID, tìm theo email
      if (!user) {
        user = await this.prisma.user.findUnique({
          where: { email: googleUser.email },
          include: {
            followers: true,
            following: true,
            posts: true,
          },
        });

        // Nếu tìm thấy user với email, cập nhật Google ID
        if (user) {
          user = await this.prisma.user.update({
            where: { id: user.id },
            data: {
              googleId: googleUser.googleId,
              avatar: googleUser.profilePicture || user.avatar,
              isEmailVerified: true, // Auto verify for Google users
              emailVerifiedAt: new Date(),
            },
            include: {
              followers: true,
              following: true,
              posts: true,
            },
          });
        }
      }

      // Nếu vẫn chưa có user, tạo mới
      if (!user) {
        // Tạo username unique từ email
        const baseUsername = googleUser.email.split('@')[0];
        let userName = baseUsername;
        let counter = 1;

        // Kiểm tra username đã tồn tại chưa
        while (await this.prisma.user.findUnique({ where: { userName } })) {
          userName = `${baseUsername}${counter}`;
          counter++;
        }

        user = await this.prisma.user.create({
          data: {
            googleId: googleUser.googleId,
            email: googleUser.email,
            userName,
            fullName: googleUser.fullName,
            avatar: googleUser.profilePicture,
            isEmailVerified: true, // Auto verify for Google users
            emailVerifiedAt: new Date(),
            // No password for Google users - it's optional now
          },
          include: {
            followers: true,
            following: true,
            posts: true,
          },
        });

        // Send welcome notification for new users
        // Note: You may need to implement createNotification method in NotificationGateway
        try {
          // await this.notificationGateway.createNotification({...});
        } catch (error) {
          console.log('Failed to send welcome notification:', error);
        }
      }

      // Tạo JWT token
      const payload = {
        sub: user.id,
        email: user.email,
        userName: user.userName,
      };
      const accessToken = this.jwtService.sign(payload);

      // get relation counts using _count to avoid typing issues
      const counts = await this.prisma.user.findUnique({
        where: { id: user.id },
        select: {
          _count: { select: { followers: true, following: true, posts: true } },
        },
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          userName: user.userName,
          fullName: user.fullName,
          avatar: user.avatar,
          isEmailVerified: user.isEmailVerified,
          followersCount: counts?._count?.followers || 0,
          followingCount: counts?._count?.following || 0,
          postsCount: counts?._count?.posts || 0,
        },
        accessToken,
      };
    } catch (error) {
      throw new BadRequestException('Google authentication failed');
    }
  }

  async verifyGoogleToken(idToken: string) {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new UnauthorizedException('Invalid Google token');
      }

      const googleUser: GoogleUserDto = {
        googleId: payload.sub,
        email: payload.email!,
        fullName: payload.name!,
        firstName: payload.given_name!,
        lastName: payload.family_name!,
        profilePicture: payload.picture,
      };

      return this.googleLogin(googleUser);
    } catch (error) {
      throw new UnauthorizedException('Invalid Google token');
    }
  }
}
