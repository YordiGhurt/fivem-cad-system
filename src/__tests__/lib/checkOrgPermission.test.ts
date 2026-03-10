import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    orgPermission: {
      findUnique: vi.fn(),
    },
  },
}));

import { checkOrgPermission } from '@/lib/checkOrgPermission';
import { prisma } from '@/lib/prisma';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockPrisma = prisma as any;

describe('checkOrgPermission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns false if user is not found', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    const result = await checkOrgPermission('unknown-id', 'canCreateIncidents');
    expect(result).toBe(false);
  });

  it('returns true if user is ADMIN (bypass)', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ role: 'ADMIN', organizationId: 'org1' });
    const result = await checkOrgPermission('admin-id', 'canCreateIncidents');
    expect(result).toBe(true);
  });

  it('returns true if user is SUPERVISOR (bypass)', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ role: 'SUPERVISOR', organizationId: 'org1' });
    const result = await checkOrgPermission('sup-id', 'canViewCitizens');
    expect(result).toBe(true);
  });

  it('returns false if user has no organizationId', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ role: 'OFFICER', organizationId: null });
    const result = await checkOrgPermission('officer-id', 'canCreateIncidents');
    expect(result).toBe(false);
  });

  it('returns false if org has no permissions record', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ role: 'OFFICER', organizationId: 'org1' });
    mockPrisma.orgPermission.findUnique.mockResolvedValue(null);
    const result = await checkOrgPermission('officer-id', 'canCreateIncidents');
    expect(result).toBe(false);
  });

  it('returns true if org has the permission', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ role: 'OFFICER', organizationId: 'org1' });
    mockPrisma.orgPermission.findUnique.mockResolvedValue({ canCreateIncidents: true });
    const result = await checkOrgPermission('officer-id', 'canCreateIncidents');
    expect(result).toBe(true);
  });

  it('returns false if org does not have the permission', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ role: 'OFFICER', organizationId: 'org1' });
    mockPrisma.orgPermission.findUnique.mockResolvedValue({ canCreateIncidents: false });
    const result = await checkOrgPermission('officer-id', 'canCreateIncidents');
    expect(result).toBe(false);
  });
});
