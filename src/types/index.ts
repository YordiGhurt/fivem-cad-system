import type { User, Organization, Unit, Incident, Report, Citizen, Vehicle, Warrant } from '@prisma/client';

export type { User, Organization, Unit, Incident, Report, Citizen, Vehicle, Warrant };

export type UserRole = 'ADMIN' | 'SUPERVISOR' | 'OFFICER' | 'DISPATCHER' | 'USER';
export type OrgType = 'POLICE' | 'FIRE' | 'AMBULANCE' | 'DOJ' | 'CUSTOM';
export type UnitStatus = 'AVAILABLE' | 'BUSY' | 'OFFDUTY' | 'ONSCENE' | 'ENROUTE' | 'BREAK';
export type IncidentStatus = 'ACTIVE' | 'PENDING' | 'CLOSED' | 'CANCELLED';
export type ReportType = 'INCIDENT' | 'ARREST' | 'WARRANT' | 'MEDICAL' | 'CUSTOM';
export type WarrantStatus = 'ACTIVE' | 'EXPIRED' | 'SERVED';

export interface SessionUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  organizationId?: string;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface UnitWithRelations extends Unit {
  user: Pick<User, 'id' | 'username'>;
  organization: Pick<Organization, 'id' | 'name' | 'callsign' | 'color'>;
}

export interface IncidentWithRelations extends Incident {
  organization: Pick<Organization, 'id' | 'name' | 'callsign' | 'color'>;
  units: Array<{
    id: string;
    unit: UnitWithRelations;
    assignedAt: Date;
  }>;
  notes: Array<{
    id: string;
    content: string;
    createdAt: Date;
    author: Pick<User, 'id' | 'username'>;
  }>;
  _count: { reports: number };
}

export interface ReportWithRelations extends Report {
  author: Pick<User, 'id' | 'username'>;
  incident?: Pick<Incident, 'id' | 'caseNumber' | 'type'> | null;
}
