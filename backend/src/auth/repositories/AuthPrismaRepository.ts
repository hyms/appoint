import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole, User, Profile, Prisma } from '@prisma/client';

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

  async softDeleteUser(id: string): Promise<SanitizedUser | null> {
    const existingUser = await this.prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return null;
    }
    const user = await this.prisma.user.update({
      where: { id },
      data: { isActive: false, email: `deleted_${Date.now()}_${existingUser.email}` },
      include: { profile: true },
    });
    return this.sanitizeUser(user);
  }

  async getPatientDetails(patientId: string) {
    console.log('AuthPrismaRepository - Attempting to find patient with ID:', patientId);
    const user = await this.prisma.user.findUnique({
      where: { id: patientId },
      include: { profile: true },
    });

    if (!user) {
      console.log('AuthPrismaRepository - User not found for ID:', patientId);
      return null;
    }

    if (!user.isActive) {
      console.log('AuthPrismaRepository - User found but is inactive for ID:', patientId);
      return null;
    }
    console.log('AuthPrismaRepository - User found and is active.');

    const appointments = await this.prisma.appointment.findMany({
      where: { patientId },
      include: {
        professional: { include: { profile: true } },
      },
      orderBy: { date: 'desc' },
      take: 20,
    });

    const strikes = await this.prisma.strike.findMany({
      where: { patientId, isActive: true },
      include: {
        professional: { include: { profile: true } },
      },
      orderBy: { strikeDate: 'desc' },
    });

    const stats = {
      totalAppointments: appointments.length,
      completed: appointments.filter(a => a.status === 'COMPLETED').length,
      cancelled: appointments.filter(a => a.status === 'CANCELLED').length,
      noShow: appointments.filter(a => a.status === 'NO_SHOW').length,
      activeStrikes: strikes.length,
    };

    return {
      user: this.sanitizeUser(user),
      appointments: appointments.map(apt => ({
        id: apt.id,
        date: apt.date,
        startTime: apt.startTime,
        endTime: apt.endTime,
        status: apt.status,
        professional: {
          id: apt.professional.id,
          firstName: apt.professional.profile?.firstName,
          lastName: apt.professional.profile?.lastName,
        },
      })),
      strikes: strikes.map(s => ({
        id: s.id,
        reason: s.reason,
        strikeDate: s.strikeDate,
        blockedUntil: s.blockedUntil,
        professional: {
          firstName: s.professional.profile?.firstName,
          lastName: s.professional.profile?.lastName,
        },
      })),
      stats,
    };
  }

  // --- Utility ---
  private sanitizeUser(user: any): SanitizedUser {
    const { passwordHash, magicToken, magicExpiresAt, ...sanitized } = user;
    return sanitized;
  }
}
