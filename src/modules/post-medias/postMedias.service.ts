import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { UpdatePostMediaDto } from './dto/updatePostMedia.dto';
import { CLOUDINARY } from 'src/config/cloudinary.constant';

@Injectable()
export class PostMediasService {
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
  ) {}

  async uploadAndCreate(
    files: Express.Multer.File[],
    postId: string,
    userId: string,
  ) {
    // Validate files
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one file is required');
    }

    // Check if post exists and user has permission
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException('You can only add media to your own posts');
    }

    try {
      // Upload files to Cloudinary
      const uploadedFiles = await this.cloudinaryService.uploadMultipleFiles(
        files,
        `${CLOUDINARY.FOLDER}/posts/${postId}`,
      );

      // Save media info to database (Prisma PostMedia has `url` and `type`)
      const mediaData = uploadedFiles.map((file, index) => ({
        url: file.secure_url,
        type: file.resource_type,
        postId: postId,
        order: index + 1,
      }));

      await this.prisma.postMedia.createMany({ data: mediaData });

      // Return the created media with full details
      return this.prisma.postMedia.findMany({
        where: { postId },
        orderBy: { createdAt: 'desc' },
        take: files.length,
      });
    } catch (error) {
      throw new BadRequestException('Failed to upload and save media');
    }
  }

  async getSignature() {
    try {
      const folder = 'SocialMedia/posts';
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = await this.cloudinaryService.generateSignature({
        timestamp,
        folder,
      });

      return {
        message: 'Signature generated successfully',
        data: {
          signature,
          timestamp,
          folder,
          apiKey: CLOUDINARY.API_KEY || '',
          cloudName: CLOUDINARY.CLOUD_NAME || '',
        },
      };
    } catch (error) {
      throw new BadRequestException('Failed to generate signature');
    }
  }

  async findAll(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [medias, totalCount] = await Promise.all([
      this.prisma.postMedia.findMany({
        skip,
        take: limit,
        include: {
          post: {
            include: {
              author: {
                select: {
                  id: true,
                  userName: true,
                  fullName: true,
                  avatar: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.postMedia.count(),
    ]);

    return {
      medias,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1,
      },
    };
  }

  async findByPost(postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return this.prisma.postMedia.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const media = await this.prisma.postMedia.findUnique({
      where: { id },
      include: {
        post: {
          include: {
            author: {
              select: {
                id: true,
                userName: true,
                fullName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    // Currently PostMedia stores `url` and `type` (no Cloudinary publicId in schema).
    // Return the media record as-is.
    return media;
  }

  async update(
    id: string,
    updatePostMediaDto: UpdatePostMediaDto,
    userId: string,
  ) {
    const media = await this.prisma.postMedia.findUnique({
      where: { id },
      include: {
        post: true,
      },
    });

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    if (media.post.authorId !== userId) {
      throw new ForbiddenException('You can only update your own media');
    }

    return this.prisma.postMedia.update({
      where: { id },
      data: updatePostMediaDto,
    });
  }

  async remove(id: string, userId: string) {
    const media = await this.prisma.postMedia.findUnique({
      where: { id },
      include: {
        post: true,
      },
    });

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    if (media.post.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own media');
    }

    try {
      // Schema does not persist Cloudinary publicId, so only delete DB record here.
      await this.prisma.postMedia.delete({ where: { id } });
      return { message: 'Media deleted successfully' };
    } catch (error) {
      throw new BadRequestException('Failed to delete media');
    }
  }

  async removeByPost(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        authorId: true,
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException(
        'You can only delete media from your own posts',
      );
    }

    try {
      // Fetch post medias to determine any cleanup (publicId not stored in schema)
      const medias = await this.prisma.postMedia.findMany({
        where: { postId },
      });

      // If there were any Cloudinary publicIds stored previously, delete them.
      const publicIds = medias
        .filter((m: any) => (m as any).publicId)
        .map((m: any) => (m as any).publicId as string);

      if (publicIds.length > 0) {
        await this.cloudinaryService.deleteMultipleFiles(publicIds);
      }

      // Delete DB records
      await this.prisma.postMedia.deleteMany({ where: { postId } });
      return { message: 'All post media deleted successfully' };
    } catch (error) {
      throw new BadRequestException('Failed to delete post media');
    }
  }

  getOptimizedMediaUrl(publicId: string, options: any = {}) {
    return this.cloudinaryService.getOptimizedUrl(publicId, options);
  }

  getThumbnail(publicId: string, size: number = 150) {
    return this.cloudinaryService.getThumbnail(publicId, size);
  }

  async getMediaStats(postId?: string) {
    const whereClause = postId ? { postId } : {};

    const [totalCount, imageCount, videoCount] = await Promise.all([
      this.prisma.postMedia.count({ where: whereClause }),
      this.prisma.postMedia.count({
        where: { ...whereClause, type: 'image' },
      }),
      this.prisma.postMedia.count({
        where: { ...whereClause, type: 'video' },
      }),
    ]);

    return {
      total: totalCount,
      images: imageCount,
      videos: videoCount,
    };
  }
}
