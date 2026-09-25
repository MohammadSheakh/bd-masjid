import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@app/database';
import { UpdateProfileDto } from './dto/update-profile.dto';

export const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  profileImageUrl: true,
  phoneNumber: true,
  isEmailVerified: true,
  authProvider: true,
  isDeleted: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

const userWithPasswordSelect = {
  ...publicUserSelect,
  password: true,
} satisfies Prisma.UserSelect;

export type PublicUserRecord = Prisma.UserGetPayload<{
  select: typeof publicUserSelect;
}>;

export type UserWithPasswordRecord = Prisma.UserGetPayload<{
  select: typeof userWithPasswordSelect;
}>;

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<PublicUserRecord | null> {
    return this.prisma.user.findUnique({
      where: { id, isDeleted: false },
      select: publicUserSelect,
    });
  }

  async findByEmail(
    email: string,
    includePassword = false,
  ): Promise<PublicUserRecord | UserWithPasswordRecord | null> {
    return this.prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        isDeleted: false,
      },
      select: includePassword ? userWithPasswordSelect : publicUserSelect,
    });
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<PublicUserRecord | null> {
    const { name, phoneNumber, profileImageUrl } = dto;

    const updateData: Prisma.UserUpdateInput = {};
    if (name) updateData.name = name;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;
    if (profileImageUrl) updateData.profileImageUrl = profileImageUrl;

    return this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: publicUserSelect,
    });
  }

  async getUserStatistics(userId: string) {
    const [createdMosquesCount, attendancesCount] = await Promise.all([
      this.prisma.mosque.count({
        where: { createdById: userId, isDeleted: false },
      }),
      this.prisma.userMosqueAttendance.count({
        where: { userId },
      }),
    ]);

    return {
      createdMosquesCount,
      attendancesCount,
    };
  }
}
