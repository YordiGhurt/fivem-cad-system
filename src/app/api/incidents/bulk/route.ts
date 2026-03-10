import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAdminLog } from '@/lib/adminLog';
import { z } from 'zod';

const bulkDeleteSchema = z.object({
  ids: z.array(z.string()).min(1),
});

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = session.user.role;
  if (role !== 'ADMIN' && role !== 'SUPERVISOR') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { ids } = bulkDeleteSchema.parse(body);

    await prisma.incident.deleteMany({ where: { id: { in: ids } } });

    await createAdminLog(
      'DATA_DELETED',
      `Bulk-Delete: ${ids.length} Einsätze gelöscht`,
      session.user.id,
      undefined,
      'Incident',
    );

    return NextResponse.json({ message: `${ids.length} incidents deleted` });
  } catch (error) {
    console.error('[incidents/bulk DELETE]', error);
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
}
