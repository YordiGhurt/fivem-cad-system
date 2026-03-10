import { prisma } from './prisma';

export async function createNotification(params: {
  userId: string;
  title: string;
  message: string;
  type?: string;
  link?: string;
}) {
  return prisma.notification.create({
    data: {
      userId: params.userId,
      title: params.title,
      message: params.message,
      type: params.type ?? 'info',
      link: params.link,
    },
  });
}

export async function notifyOrganizationMembers(
  organizationId: string,
  roles: string[],
  title: string,
  message: string,
  type?: string,
  link?: string,
) {
  const users = await prisma.user.findMany({
    where: {
      organizationId,
      role: { in: roles as ('ADMIN' | 'SUPERVISOR' | 'OFFICER' | 'DISPATCHER' | 'USER')[] },
      active: true,
    },
    select: { id: true },
  });

  if (users.length === 0) return;

  await prisma.notification.createMany({
    data: users.map((u) => ({
      userId: u.id,
      title,
      message,
      type: type ?? 'info',
      link,
    })),
  });
}
