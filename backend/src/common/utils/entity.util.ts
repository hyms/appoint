import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export async function findEntityOrThrow<T extends { id: string }>(
  _prisma: PrismaService,
  modelDelegate: any,
  id: string,
  entityName: string,
): Promise<T> {
  const entity = await modelDelegate.findUnique({ where: { id } });
  if (!entity) {
    throw new NotFoundException(`${entityName} not found`);
  }
  return entity;
}
