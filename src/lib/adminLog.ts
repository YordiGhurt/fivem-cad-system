import { prisma } from './prisma';
import { AdminLogAction, Prisma } from '@prisma/client';

export async function createAdminLog(
  action: AdminLogAction,
  description: string,
  performedById: string,
  targetId?: string,
  targetType?: string,
  metadata?: Record<string, unknown>,
) {
  return prisma.adminLog.create({
    data: {
      action,
      description,
      performedById,
      targetId,
      targetType,
      metadata: metadata as Prisma.InputJsonValue | undefined,
    },
  });
}
