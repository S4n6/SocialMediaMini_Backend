import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { PostMediaRepository } from '../../application/ports/repositories/post-media.repository';
import { PostMediaEntity, PostMediaType } from '../../domain/post-media.entity';
import { PostMediaFactory } from '../factories/post-media.factory';

@Injectable()
export class PostMediaPrismaRepository implements PostMediaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(postMedia: PostMediaEntity): Promise<PostMediaEntity> {
    const data = {
      id: postMedia.id,
      url: postMedia.url,
      type: postMedia.type,
      postId: postMedia.postId,
      order: postMedia.order,
    };

    const result = await this.prisma.postMedia.upsert({
      where: { id: postMedia.id },
      create: data,
      update: {
        url: data.url,
        type: data.type,
        order: data.order,
      },
    });

    return PostMediaFactory.fromPersistence({
      id: result.id,
      url: result.url,
      type: result.type as PostMediaType,
      postId: result.postId,
      order: result.order || 1,
      createdAt: result.createdAt,
      updatedAt: result.createdAt, // Prisma doesn't have updatedAt in schema
    });
  }

  async saveMany(postMedias: PostMediaEntity[]): Promise<PostMediaEntity[]> {
    const data = postMedias.map((media) => ({
      id: media.id,
      url: media.url,
      type: media.type,
      postId: media.postId,
      order: media.order,
    }));

    // Use transaction to create multiple records
    const results = await this.prisma.$transaction(
      data.map((item) =>
        this.prisma.postMedia.create({
          data: item,
        }),
      ),
    );

    return results.map((result) =>
      PostMediaFactory.fromPersistence({
        id: result.id,
        url: result.url,
        type: result.type as PostMediaType,
        postId: result.postId,
        order: result.order || 1,
        createdAt: result.createdAt,
        updatedAt: result.createdAt,
      }),
    );
  }

  async findById(id: string): Promise<PostMediaEntity | null> {
    const result = await this.prisma.postMedia.findUnique({
      where: { id },
    });

    if (!result) {
      return null;
    }

    return PostMediaFactory.fromPersistence({
      id: result.id,
      url: result.url,
      type: result.type as PostMediaType,
      postId: result.postId,
      order: result.order || 1,
      createdAt: result.createdAt,
      updatedAt: result.createdAt,
    });
  }

  async findByPostId(postId: string): Promise<PostMediaEntity[]> {
    const results = await this.prisma.postMedia.findMany({
      where: { postId },
      orderBy: { order: 'asc' },
    });

    return results.map((result) =>
      PostMediaFactory.fromPersistence({
        id: result.id,
        url: result.url,
        type: result.type as PostMediaType,
        postId: result.postId,
        order: result.order || 1,
        createdAt: result.createdAt,
        updatedAt: result.createdAt,
      }),
    );
  }

  async findWithPagination(
    page: number,
    limit: number,
  ): Promise<{
    items: PostMediaEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.postMedia.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.postMedia.count(),
    ]);

    const entities = items.map((result) =>
      PostMediaFactory.fromPersistence({
        id: result.id,
        url: result.url,
        type: result.type as PostMediaType,
        postId: result.postId,
        order: result.order || 1,
        createdAt: result.createdAt,
        updatedAt: result.createdAt,
      }),
    );

    const totalPages = Math.ceil(total / limit);

    return {
      items: entities,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async deleteById(id: string): Promise<void> {
    await this.prisma.postMedia.delete({
      where: { id },
    });
  }

  async deleteByPostId(postId: string): Promise<void> {
    await this.prisma.postMedia.deleteMany({
      where: { postId },
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.postMedia.count({
      where: { id },
    });
    return count > 0;
  }

  async countByPostId(postId: string): Promise<number> {
    return await this.prisma.postMedia.count({
      where: { postId },
    });
  }

  async updateOrdersByPostId(
    postId: string,
    orders: Array<{ id: string; order: number }>,
  ): Promise<void> {
    // Use transaction to update multiple records
    await this.prisma.$transaction(
      orders.map(({ id, order }) =>
        this.prisma.postMedia.update({
          where: { id },
          data: { order },
        }),
      ),
    );
  }

  async findByUrls(urls: string[]): Promise<PostMediaEntity[]> {
    const results = await this.prisma.postMedia.findMany({
      where: {
        url: {
          in: urls,
        },
      },
    });

    return results.map((result) =>
      PostMediaFactory.fromPersistence({
        id: result.id,
        url: result.url,
        type: result.type as PostMediaType,
        postId: result.postId,
        order: result.order || 1,
        createdAt: result.createdAt,
        updatedAt: result.createdAt,
      }),
    );
  }
}
