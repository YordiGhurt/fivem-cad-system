import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { OrgType } from '@prisma/client';

const gradeSchema = z.object({
  level: z.number().int().min(0),
  name: z.string().min(1),
  isBoss: z.boolean().optional().default(false),
});

const jobSchema = z.object({
  name: z.string().min(1),
  label: z.string().min(1),
  type: z.string().optional(),
  grades: z.array(gradeSchema).min(2),
});

const syncJobsSchema = z.object({
  jobs: z.array(jobSchema),
});

function mapJobTypeToOrgType(type?: string): OrgType {
  switch (type) {
    case 'leo':
      return OrgType.POLICE;
    case 'ems':
      return OrgType.AMBULANCE;
    case 'fire':
      return OrgType.FIRE;
    default:
      return OrgType.CUSTOM;
  }
}

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key');
  if (apiKey !== process.env.CAD_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = syncJobsSchema.parse(body);

    let synced = 0;
    let skipped = 0;

    for (const job of data.jobs) {
      const orgType = mapJobTypeToOrgType(job.type);

      // Upsert organisation – but never overwrite permissions
      const org = await prisma.organization.upsert({
        where: { name: job.name },
        update: {
          // Only update label (callsign) and type; never touch permissions
          callsign: job.label,
          type: orgType,
        },
        create: {
          name: job.name,
          callsign: job.label,
          type: orgType,
          color: '#3b82f6',
        },
      });

      // Upsert ranks – never overwrite permissions of existing ranks
      for (const grade of job.grades) {
        const rankLevel = grade.level + 1; // CAD levels start at 1

        const existing = await prisma.orgRank.findFirst({
          where: { organizationId: org.id, level: rankLevel },
        });

        if (existing) {
          // Only update the name; preserve permissions and color
          await prisma.orgRank.update({
            where: { id: existing.id },
            data: { name: grade.name },
          });
        } else {
          await prisma.orgRank.create({
            data: {
              organizationId: org.id,
              name: grade.name,
              level: rankLevel,
              color: '#94a3b8',
            },
          });
        }
      }

      synced++;
    }

    return NextResponse.json({ success: true, synced, skipped });
  } catch (error) {
    console.error('[sync/jobs]', error);
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
}
