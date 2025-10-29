import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { ExternalUserService } from '../../application/interfaces/external-services.interface';

/**
 * Infrastructure Adapter for User Module Integration
 * Implements external service interface for accessing user data
 */
@Injectable()
export class UserAdapter implements ExternalUserService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(userId: string): Promise<{
    id: string;
    username: string;
    fullName: string;
    avatar: string | null;
    bio?: string | null;
  } | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          fullName: true,
          avatar: true,
          bio: true,
        },
      });

      return user;
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      return null;
    }
  }

  async exists(userId: string): Promise<boolean> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      return !!user;
    } catch (error) {
      console.error('Error checking user existence:', error);
      return false;
    }
  }
}
