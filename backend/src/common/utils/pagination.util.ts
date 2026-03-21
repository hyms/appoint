import { PrismaService } from '../../prisma/prisma.service';

export function calculateSkip(page: number, limit: number): number {
  return (page - 1) * limit;
}

export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
) {
  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}
