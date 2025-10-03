import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { ExternalUserService } from '../application/interfaces/external-services.interface';

@Injectable()
export class PrismaUserService implements ExternalUserService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(userId: string): Promise<{
    id: string;
    username: string;
    fullName: string;
    avatar: string | null;
    bio?: string | null;
  } | null> {
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
  }

  async exists(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    return !!user;
  }
}
