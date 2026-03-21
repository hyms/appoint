import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole, User, Profile, Prisma } from '@prisma/client';
import { RegisterDto } from '../dto/auth.dto';

// Define the structure for the sanitized response based on AuthService.sanitizeUser
export type SanitizedUser = Omit<
  User,
  'passwordHash' | 'magicToken' | 'magicExpiresAt'
> & {
  profile?: Omit<Profile, 'userId'> | null;
};

@Injectable()
export class AuthPrismaRepository {
  constructor(private prisma: PrismaService) {}

  // --- User Creation & Registration ---
  async findUnique(args: Prisma.UserFindUniqueArgs): Promise<User | null> {
    return this.prisma.user.findUnique(args);
  }

  async create(args?: { data?: any; include?: any }): Promise<any> {
    const actualData = args?.data ? args.data : args;
    const include = args?.include;
    
    const user = await this.prisma.user.create({
      data: {
        email: actualData.email,
        passwordHash: actualData.passwordHash,
        phone: actualData.phone,
        role: actualData.role || UserRole.PATIENT,
        profile: actualData.profile as any,
      },
      include: include || { profile: true },
    });
    return user;
  }

  // --- Login & Magic Link Validation ---
  async findUserForLogin(
    email: string,
  ): Promise<(User & { profile: Profile | null }) | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });
  }

  async validateMagicLinkToken(token: string): Promise<SanitizedUser | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        magicToken: token,
        magicExpiresAt: { gte: new Date() },
      },
      include: { profile: true },
    });

    if (user) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          magicToken: null,
          magicExpiresAt: null,
        },
      });
    }
    return user ? this.sanitizeUser(user) : null;
  }

  // --- Admin & Retrieval Functions ---
  async findUserById(id: string): Promise<SanitizedUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });
    return user ? this.sanitizeUser(user) : null;
  }

  async findUsers(role?: UserRole): Promise<SanitizedUser[]> {
    const where: Prisma.UserWhereInput = {};
    if (role) {
      where.role = role;
    }

    const users = await this.prisma.user.findMany({
      where,
      include: { profile: true },
      orderBy: { createdAt: 'desc' },
    });

    return users.map(this.sanitizeUser);
  }

  async findProfessionals(): Promise<
    Array<{ id: string; email: string; firstName?: string; lastName?: string }>
  > {
    const users = await this.prisma.user.findMany({
      where: { role: 'PROFESSIONAL' },
      include: { profile: true },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((user) => ({
      id: user.id,
      email: user.email,
      firstName: user.profile?.firstName,
      lastName: user.profile?.lastName,
    }));
  }

  // --- Update & Delete ---
  async updateUser(
    id: string,
    updateData: Prisma.UserUpdateInput,
    profileData: Prisma.ProfileUpdateInput,
  ): Promise<SanitizedUser | null> {
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });

    if (!existingUser) {
      return null;
    }

    const update: Prisma.UserUpdateArgs['data'] = { ...updateData };

    if (Object.keys(profileData).length > 0) {
      update.profile = { update: profileData };
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: update,
      include: { profile: true },
    });

    return this.sanitizeUser(user);
  }

  async deleteUser(id: string): Promise<User | null> {
    const existingUser = await this.prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return null;
    }
    return this.prisma.user.delete({ where: { id } });
  }

  // --- Utility ---
  private sanitizeUser(user: any): SanitizedUser {
    const { passwordHash, magicToken, magicExpiresAt, ...sanitized } = user;
    return sanitized;
  }
}
