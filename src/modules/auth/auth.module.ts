import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './strategies/Jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { JWT } from 'src/config/jwt.config';
import { MailerModule } from '../mailer/mailer.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    PassportModule,
    JwtModule.register({
      secret: JWT.SECRET,
      signOptions: { expiresIn: JWT.EXPIRES_IN },
    }),
    MailerModule,
    NotificationModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, GoogleStrategy],
  exports: [AuthService],
})
export class AuthModule {}
