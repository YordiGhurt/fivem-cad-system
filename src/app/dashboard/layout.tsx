'use client';

import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  AlertTriangle,
  Radio,
  Users,
  Car,
  FileWarning,
  FileText,
  Building2,
  Settings,
  LogOut,
  Shield,
  Scale,
  Gavel,
  FileSearch,
  FolderOpen,
  HeartPulse,
  Stethoscope,
  BookOpen,
  Newspaper,
  GraduationCap,
  ClipboardList,
} from 'lucide-react';

interface OrgPermission {
  canViewIncidents: boolean;
  canViewWarrants: boolean;
  canViewReports: boolean;
  canViewCitizens: boolean;
  canViewVehicles: boolean;
  canManageUnits: boolean;
  canViewLaws: boolean;
  canViewVerdicts: boolean;
  canViewCharges: boolean;
  canViewCaseFiles: boolean;
  canViewDeathCerts: boolean;
  canViewMedicalRecords: boolean;
  canViewNews: boolean;
  canViewWarnings: boolean;
  canViewTrainingRecords: boolean;
  canViewDispatchLog: boolean;
}

const navItems = [
  { href: '/dashboard', label: 'Dispatch', icon: LayoutDashboard },
  { href: '/dashboard/incidents', label: 'Einsätze', icon: AlertTriangle, permKey: 'canViewIncidents' as keyof OrgPermission },
  { href: '/dashboard/units', label: 'Einheiten', icon: Radio, permKey: 'canManageUnits' as keyof OrgPermission },
  { href: '/dashboard/citizens', label: 'Bürger', icon: Users, permKey: 'canViewCitizens' as keyof OrgPermission },
  { href: '/dashboard/vehicles', label: 'Fahrzeuge', icon: Car, permKey: 'canViewVehicles' as keyof OrgPermission },
  { href: '/dashboard/warrants', label: 'Haftbefehle', icon: FileWarning, permKey: 'canViewWarrants' as keyof OrgPermission },
  { href: '/dashboard/reports', label: 'Berichte', icon: FileText, permKey: 'canViewReports' as keyof OrgPermission },
  { href: '/dashboard/laws', label: 'Gesetze', icon: Scale, permKey: 'canViewLaws' as keyof OrgPermission },
  { href: '/dashboard/verdicts', label: 'Urteile', icon: Gavel, permKey: 'canViewVerdicts' as keyof OrgPermission },
  { href: '/dashboard/charges', label: 'Anklagen', icon: FileSearch, permKey: 'canViewCharges' as keyof OrgPermission },
  { href: '/dashboard/case-files', label: 'Parteiakten', icon: FolderOpen, permKey: 'canViewCaseFiles' as keyof OrgPermission },
  { href: '/dashboard/death-certificates', label: 'Totenscheine', icon: HeartPulse, permKey: 'canViewDeathCerts' as keyof OrgPermission },
  { href: '/dashboard/medical-records', label: 'Med. Akten', icon: Stethoscope, permKey: 'canViewMedicalRecords' as keyof OrgPermission },
  { href: '/dashboard/fine-catalog', label: 'Bußgeldkatalog', icon: BookOpen },
  { href: '/dashboard/org-news', label: 'Org-News', icon: Newspaper, permKey: 'canViewNews' as keyof OrgPermission },
  { href: '/dashboard/org-warnings', label: 'Disziplinarakte', icon: AlertTriangle, permKey: 'canViewWarnings' as keyof OrgPermission },
  { href: '/dashboard/training-records', label: 'Ausbildung', icon: GraduationCap, permKey: 'canViewTrainingRecords' as keyof OrgPermission },
  { href: '/dashboard/dispatch-logs', label: 'Schichtbuch', icon: ClipboardList, permKey: 'canViewDispatchLog' as keyof OrgPermission },
  { href: '/dashboard/organizations', label: 'Organisationen', icon: Building2 },
  { href: '/dashboard/admin', label: 'Admin', icon: Settings, adminOnly: true },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [orgPermissions, setOrgPermissions] = useState<OrgPermission | null>(null);

  const isAdmin = session?.user?.role === 'ADMIN';

  useEffect(() => {
    const orgId = session?.user?.organizationId;
    if (!orgId) {
      setOrgPermissions(null);
      return;
    }
    fetch(`/api/organizations/${orgId}/permissions`)
      .then((r) => r.json())
      .then((d) => setOrgPermissions(d.data ?? null))
      .catch(() => setOrgPermissions(null));
  }, [session?.user?.organizationId]);

  const isNavItemVisible = (item: (typeof navItems)[number]) => {
    // Admin-only items
    if ('adminOnly' in item && item.adminOnly && !isAdmin) return false;
    // No permission key = always visible
    if (!('permKey' in item) || !item.permKey) return true;
    // ADMINs and SUPERVISORs bypass org-permission filtering
    const role = session?.user?.role;
    if (role === 'ADMIN' || role === 'SUPERVISOR') return true;
    // No org or no permissions loaded yet → show all (graceful fallback)
    if (!session?.user?.organizationId || orgPermissions === null) return true;
    // Filter by org permission
    return orgPermissions[item.permKey] !== false;
  };

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">CAD System</p>
              <p className="text-slate-400 text-xs">FiveM QBCore</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            if (!isNavItemVisible(item)) return null;
            const Icon = item.icon;
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800',
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-slate-800">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-white uppercase">
                {session?.user?.username?.[0] ?? 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{session?.user?.username}</p>
              <p className="text-slate-400 text-xs">{session?.user?.role}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-sm transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Abmelden
          </button>
        </div>
      </aside>
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
