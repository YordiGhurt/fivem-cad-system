import { PrismaClient, Role, OrgType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const police = await prisma.organization.upsert({
    where: { name: 'Los Santos Police Department' },
    update: {},
    create: {
      name: 'Los Santos Police Department',
      type: OrgType.POLICE,
      callsign: 'LSPD',
      color: '#3b82f6',
      description: 'Los Santos Police Department',
    },
  });

  const ems = await prisma.organization.upsert({
    where: { name: 'Emergency Medical Services' },
    update: {},
    create: {
      name: 'Emergency Medical Services',
      type: OrgType.AMBULANCE,
      callsign: 'EMS',
      color: '#ef4444',
      description: 'Emergency Medical Services',
    },
  });

  await prisma.organization.upsert({
    where: { name: 'Los Santos Fire Department' },
    update: {},
    create: {
      name: 'Los Santos Fire Department',
      type: OrgType.FIRE,
      callsign: 'LSFD',
      color: '#f97316',
      description: 'Los Santos Fire Department',
    },
  });

  await prisma.organization.upsert({
    where: { name: 'Department of Justice' },
    update: {},
    create: {
      name: 'Department of Justice',
      type: OrgType.DOJ,
      callsign: 'DOJ',
      color: '#a855f7',
      description: 'Department of Justice',
    },
  });

  const hashedPassword = await bcrypt.hash('admin123', 12);
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@cad.local',
      password: hashedPassword,
      role: Role.ADMIN,
      organizationId: police.id,
    },
  });

  const citizen = await prisma.citizen.upsert({
    where: { citizenId: 'CIT-001' },
    update: {},
    create: {
      firstName: 'Max',
      lastName: 'Mustermann',
      citizenId: 'CIT-001',
      gender: 'männlich',
      phone: '555-0100',
      address: 'Vinewood Hills 1, Los Santos',
      nationality: 'US-Amerikanisch',
      notes: 'Beispiel-Bürger',
    },
  });

  await prisma.vehicle.upsert({
    where: { plate: 'LSCA-001' },
    update: {},
    create: {
      plate: 'LSCA-001',
      model: 'Kuruma',
      color: 'Schwarz',
      ownerId: citizen.citizenId,
    },
  });

  // suppress unused variable warnings
  void ems;

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
