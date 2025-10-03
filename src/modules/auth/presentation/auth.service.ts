import { Injectable } from '@nestjs/common';
import { AuthApplicationService } from '../application/auth-application.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly authApplicationService: AuthApplicationService,
  ) {}

  async validateUser(email: string): Promise<any> {
    // This method is used by passport strategies to validate user
    // You can implement user lookup logic here if needed
    return { email };
  }

  async validateUserById(userId: string): Promise<any> {
    // This method is used by JWT strategy to validate user
    // For now, return a mock user - in real implementation, you'd fetch from database
    return {
      id: userId,
      email: 'user@example.com',
      username: 'user',
      role: 'user',
      fullName: 'User Name',
    };
  }

  async googleLogin(user: any) {
    return this.authApplicationService.googleAuth({
      googleId: user.id,
      email: user.email,
      fullName: user.fullName,
      avatar: user.picture,
      emailVerified: user.emailVerified || true,
    });
  }
}
