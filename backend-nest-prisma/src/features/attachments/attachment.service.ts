import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Redis } from 'ioredis';
import { PrismaService } from '@app/database';
import { AttachmentType } from '@prisma/client';
import { REDIS_CLIENT } from '@app/redis';
import { IFileUploadStrategy, FileUploadResult } from './strategies/file-upload.strategy.interface';

@Injectable()
export class AttachmentService {
  private readonly ATTACHMENT_CACHE_PREFIX = 'attachment:';
  private readonly ATTACHMENT_CACHE_TTL = 300; // 5 minutes

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redisClient: Redis,
    @Inject('FILE_UPLOAD_STRATEGY') private readonly uploadStrategy: IFileUploadStrategy,
  ) {}

  /**
   * Upload single attachment
   */
  async uploadSingleAttachment(
    file: Express.Multer.File,
    folder: string,
    uploadedByUserId?: string,
    attachedToId?: string,
    attachedToType?: string,
  ): Promise<string> {
    const uploadResult: FileUploadResult = await this.uploadStrategy.uploadFile(file, folder);
    const fileType = this.detectFileType(file);

    const attachment = await this.prisma.attachment.create({
      data: {
        attachment: uploadResult.url,
        attachmentType: fileType,
        publicId: uploadResult.publicId || null,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        attachedToId: attachedToId || null,
        attachedToType: attachedToType || null,
      },
    });

    return attachment.id;
  }

  /**
   * Upload multiple attachments
   */
  async uploadMultipleAttachments(
    files: Express.Multer.File[],
    folder: string,
    uploadedByUserId?: string,
  ): Promise<string[]> {
    return Promise.all(
      files.map((file) => this.uploadSingleAttachment(file, folder, uploadedByUserId)),
    );
  }

  /**
   * Delete attachment (and file from cloud storage)
   */
  async deleteAttachment(attachmentId: string): Promise<void> {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id: attachmentId, isDeleted: false },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    if (attachment.publicId) {
      await this.uploadStrategy.deleteFile(attachment.publicId);
    }

    await this.prisma.attachment.update({
      where: { id: attachmentId },
      data: { isDeleted: true },
    });

    await this.invalidateCache(attachmentId);
  }

  /**
   * Get attachments by entity
   */
  async getAttachmentsByEntity(
    attachedToType: string,
    attachedToId: string,
  ) {
    return this.prisma.attachment.findMany({
      where: {
        attachedToType,
        attachedToId,
        isDeleted: false,
      },
    });
  }

  /**
   * Detect file type from MIME type
   */
  private detectFileType(file: Express.Multer.File): AttachmentType {
    if (file.mimetype.startsWith('image/')) {
      return AttachmentType.image;
    } else if (file.mimetype.startsWith('video/')) {
      return AttachmentType.video;
    } else if (file.mimetype.startsWith('application/')) {
      return AttachmentType.document;
    } else {
      return AttachmentType.unknown;
    }
  }

  /**
   * Invalidate attachment cache
   */
  async invalidateCache(attachmentId: string): Promise<void> {
    try {
      if (this.redisClient && typeof this.redisClient.del === 'function') {
        const cacheKey = `${this.ATTACHMENT_CACHE_PREFIX}${attachmentId}`;
        await this.redisClient.del(cacheKey);
      }
    } catch {
      // Non-fatal cache invalidation
    }
  }
}
