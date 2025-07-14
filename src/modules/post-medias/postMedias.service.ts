import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { UpdatePostMediaDto } from './dto/updatePostMedia.dto';
import { CLOUDINARY } from 'src/constants/cloudinary.constant';

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
        `posts/${postId}`,
      );

      // Save media info to database
      const mediaData = uploadedFiles.map((file) => ({
        mediaUrl: file.secure_url,
        mediaType: file.resource_type,
        publicId: file.public_id,
        postId: postId,
      }));

      await this.prisma.postMedia.createMany({
        data: mediaData,
      });

      // Return the created media with full details
      return this.prisma.postMedia.findMany({
        where: { postId },
        orderBy: { createdAt: 'desc' },
        take: files.length, // Only return newly created media
      });
    } catch (error) {
      throw new BadRequestException('Failed to upload and save media');
    }
  }

  async uploadSingle(
    file: Express.Multer.File,
    postId: string,
    userId: string,
  ) {
    // Validate file
    if (!file) {
      throw new BadRequestException('File is required');
    }

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
      // Upload to Cloudinary
      const uploadedFile = await this.cloudinaryService.uploadFile(
        file,
        `${CLOUDINARY.FOLDER}/posts/${postId}`,
      );

      // Save to database
      const savedMedia = await this.prisma.postMedia.create({
        data: {
          mediaUrl: uploadedFile.secure_url,
          mediaType: uploadedFile.resource_type,
          publicId: uploadedFile.public_id,
          postId: postId,
        },
      });

      return savedMedia;
    } catch (error) {
      throw new BadRequestException('Failed to upload and save media');
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
                  username: true,
                  fullname: true,
                  profilePicture: true,
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
                username: true,
                fullname: true,
                profilePicture: true,
              },
            },
          },
        },
      },
    });

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    // Add optimized URLs to response
    const optimizedMedia = {
      ...media,
      thumbnailUrl: media.publicId ? this.getThumbnail(media.publicId) : null,
      optimizedUrls: media.publicId
        ? {
            small: this.getOptimizedMediaUrl(media.publicId, { width: 400 }),
            medium: this.getOptimizedMediaUrl(media.publicId, { width: 800 }),
            large: this.getOptimizedMediaUrl(media.publicId, { width: 1200 }),
          }
        : null,
    };

    return optimizedMedia;
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
      // Delete from Cloudinary first
      if (media.publicId) {
        await this.cloudinaryService.deleteFile(media.publicId);
      }

      // Then delete from database
      await this.prisma.postMedia.delete({
        where: { id },
      });

      return { message: 'Media deleted successfully' };
    } catch (error) {
      throw new BadRequestException('Failed to delete media');
    }
  }

  async removeByPost(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        postMedia: true,
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
      // Delete from Cloudinary
      const publicIds = post.postMedia
        .filter((media) => media.publicId)
        .map((media) => media.publicId!);

      if (publicIds.length > 0) {
        await this.cloudinaryService.deleteMultipleFiles(publicIds);
      }

      // Delete from database
      await this.prisma.postMedia.deleteMany({
        where: { postId },
      });

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
        where: { ...whereClause, mediaType: 'image' },
      }),
      this.prisma.postMedia.count({
        where: { ...whereClause, mediaType: 'video' },
      }),
    ]);

    return {
      total: totalCount,
      images: imageCount,
      videos: videoCount,
    };
  }
}
