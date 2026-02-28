import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { IExternalUserService } from '../../application/ports/i-external-services';

@Injectable()
export class PrismaUserAdapter implements IExternalUserService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(
    userId: string,
  ): Promise<{ id: string; fullName: string; avatar: string | null } | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, fullName: true, avatar: true },
    });
  }
}
