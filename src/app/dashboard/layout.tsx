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
  ScrollText,
  Map,
  BarChart2,
  Menu,
  X,
  ShieldCheck,
  SendHorizontal,
} from 'lucide-react';
import RealtimeProvider from '@/components/RealtimeProvider';
import NotificationBell from '@/components/NotificationBell';

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

type OrgType = 'POLICE' | 'FIRE' | 'AMBULANCE' | 'DOJ' | 'CUSTOM' | null;

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permKey?: keyof OrgPermission;
  adminOnly?: boolean;
  supervisorOnly?: boolean;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

function getNavGroupsForOrgType(orgType: OrgType): NavGroup[] {
  // Admin/Supervisor – full access (handled separately by isAdmin/isSupervisor checks)
  // Department-spezifische Navigationsstruktur

  const adminGroup: NavGroup = {
    label: 'Verwaltung',
    items: [
      { href: '/dashboard/stats', label: 'Statistiken', icon: BarChart2, supervisorOnly: true },
      { href: '/dashboard/admin-log', label: 'Admin-Log', icon: ScrollText, supervisorOnly: true },
      { href: '/dashboard/admin', label: 'Admin', icon: Settings, adminOnly: true },
    ],
  };

  if (orgType === 'POLICE') {
    return [
      {
        label: 'Dispatch',
        items: [
          { href: '/dashboard', label: 'Dispatch', icon: LayoutDashboard },
          { href: '/dashboard/incidents', label: 'Einsätze', icon: AlertTriangle, permKey: 'canViewIncidents' },
          { href: '/dashboard/units', label: 'Einheiten', icon: Radio, permKey: 'canManageUnits' },
          { href: '/dashboard/map', label: 'Karte', icon: Map },
        ],
      },
      {
        label: 'Akten & Bürger',
        items: [
          { href: '/dashboard/citizens', label: 'Bürger', icon: Users, permKey: 'canViewCitizens' },
          { href: '/dashboard/vehicles', label: 'Fahrzeuge', icon: Car, permKey: 'canViewVehicles' },
          { href: '/dashboard/licenses', label: 'Lizenzen', icon: ShieldCheck, permKey: 'canViewVehicles' },
          { href: '/dashboard/warrants', label: 'Haftbefehle', icon: FileWarning, permKey: 'canViewWarrants' },
          { href: '/dashboard/reports', label: 'Berichte', icon: FileText, permKey: 'canViewReports' },
          { href: '/dashboard/case-files', label: 'Polizeiakten', icon: FolderOpen, permKey: 'canViewCaseFiles' },
        ],
      },
      {
        label: 'Organisation',
        items: [
          { href: '/dashboard/org-news', label: 'Org-News', icon: Newspaper, permKey: 'canViewNews' },
          { href: '/dashboard/org-warnings', label: 'Disziplinarakte', icon: AlertTriangle, permKey: 'canViewWarnings' },
          { href: '/dashboard/training-records', label: 'Ausbildung', icon: GraduationCap, permKey: 'canViewTrainingRecords' },
          { href: '/dashboard/dispatch-logs', label: 'Schichtbuch', icon: ClipboardList, permKey: 'canViewDispatchLog' },
          { href: '/dashboard/organizations', label: 'Organisationen', icon: Building2 },
        ],
      },
      adminGroup,
    ];
  }

  if (orgType === 'DOJ') {
    return [
      {
        label: 'DOJ',
        items: [
          { href: '/dashboard/org-news', label: 'Org-News', icon: Newspaper, permKey: 'canViewNews' },
          { href: '/dashboard/citizens', label: 'Bürger', icon: Users, permKey: 'canViewCitizens' },
          { href: '/dashboard/charges', label: 'Anklagen', icon: FileSearch, permKey: 'canViewCharges' },
          { href: '/dashboard/verdicts', label: 'Urteile', icon: Gavel, permKey: 'canViewVerdicts' },
          { href: '/dashboard/case-files', label: 'Eingegangene Akten', icon: SendHorizontal, permKey: 'canViewCaseFiles' },
        ],
      },
      {
        label: 'Recht & Gesetze',
        items: [
          { href: '/dashboard/laws', label: 'Gesetze', icon: Scale, permKey: 'canViewLaws' },
          { href: '/dashboard/fine-catalog', label: 'Bußgeldkatalog', icon: BookOpen },
        ],
      },
      {
        label: 'Organisation',
        items: [
          { href: '/dashboard/org-warnings', label: 'Disziplinarakte', icon: AlertTriangle, permKey: 'canViewWarnings' },
          { href: '/dashboard/training-records', label: 'Ausbildung', icon: GraduationCap, permKey: 'canViewTrainingRecords' },
          { href: '/dashboard/organizations', label: 'Organisationen', icon: Building2 },
        ],
      },
      adminGroup,
    ];
  }

  if (orgType === 'AMBULANCE' || orgType === 'FIRE') {
    return [
      {
        label: 'Dispatch',
        items: [
          { href: '/dashboard', label: 'Dispatch', icon: LayoutDashboard },
          { href: '/dashboard/incidents', label: 'Einsätze', icon: AlertTriangle, permKey: 'canViewIncidents' },
          { href: '/dashboard/units', label: 'Einheiten', icon: Radio, permKey: 'canManageUnits' },
          { href: '/dashboard/map', label: 'Karte', icon: Map },
        ],
      },
      {
        label: 'Medizin',
        items: [
          { href: '/dashboard/medical-records', label: 'Med. Akten', icon: Stethoscope, permKey: 'canViewMedicalRecords' },
          { href: '/dashboard/death-certificates', label: 'Totenscheine', icon: HeartPulse, permKey: 'canViewDeathCerts' },
        ],
      },
      {
        label: 'Organisation',
        items: [
          { href: '/dashboard/org-news', label: 'Org-News', icon: Newspaper, permKey: 'canViewNews' },
          { href: '/dashboard/org-warnings', label: 'Disziplinarakte', icon: AlertTriangle, permKey: 'canViewWarnings' },
          { href: '/dashboard/training-records', label: 'Ausbildung', icon: GraduationCap, permKey: 'canViewTrainingRecords' },
          { href: '/dashboard/dispatch-logs', label: 'Schichtbuch', icon: ClipboardList, permKey: 'canViewDispatchLog' },
          { href: '/dashboard/organizations', label: 'Organisationen', icon: Building2 },
        ],
      },
      adminGroup,
    ];
  }

  // CUSTOM org type or no org: standard citizen view
  return [
    {
      label: 'Bürger-Portal',
      items: [
        { href: '/dashboard/laws', label: 'Gesetze', icon: Scale },
        { href: '/dashboard/fine-catalog', label: 'Bußgeldkatalog', icon: BookOpen },
        { href: '/dashboard/vehicles', label: 'Fahrzeuge', icon: Car },
      ],
    },
    adminGroup,
  ];
}

// Vollständige Navigation für Admins/Supervisors
const fullNavGroups: NavGroup[] = [
  {
    label: 'Dispatch',
    items: [
      { href: '/dashboard', label: 'Dispatch', icon: LayoutDashboard },
      { href: '/dashboard/incidents', label: 'Einsätze', icon: AlertTriangle, permKey: 'canViewIncidents' },
      { href: '/dashboard/units', label: 'Einheiten', icon: Radio, permKey: 'canManageUnits' },
      { href: '/dashboard/map', label: 'Karte', icon: Map },
    ],
  },
  {
    label: 'Akten & Bürger',
    items: [
      { href: '/dashboard/citizens', label: 'Bürger', icon: Users, permKey: 'canViewCitizens' },
      { href: '/dashboard/vehicles', label: 'Fahrzeuge', icon: Car, permKey: 'canViewVehicles' },
      { href: '/dashboard/licenses', label: 'Lizenzen', icon: ShieldCheck, permKey: 'canViewVehicles' },
      { href: '/dashboard/warrants', label: 'Haftbefehle', icon: FileWarning, permKey: 'canViewWarrants' },
      { href: '/dashboard/reports', label: 'Berichte', icon: FileText, permKey: 'canViewReports' },
      { href: '/dashboard/case-files', label: 'Parteiakten', icon: FolderOpen, permKey: 'canViewCaseFiles' },
    ],
  },
  {
    label: 'Justiz',
    items: [
      { href: '/dashboard/laws', label: 'Gesetze', icon: Scale, permKey: 'canViewLaws' },
      { href: '/dashboard/fine-catalog', label: 'Bußgeldkatalog', icon: BookOpen },
      { href: '/dashboard/verdicts', label: 'Urteile', icon: Gavel, permKey: 'canViewVerdicts' },
      { href: '/dashboard/charges', label: 'Anklagen', icon: FileSearch, permKey: 'canViewCharges' },
    ],
  },
  {
    label: 'Medizin',
    items: [
      { href: '/dashboard/death-certificates', label: 'Totenscheine', icon: HeartPulse, permKey: 'canViewDeathCerts' },
      { href: '/dashboard/medical-records', label: 'Med. Akten', icon: Stethoscope, permKey: 'canViewMedicalRecords' },
    ],
  },
  {
    label: 'Organisation',
    items: [
      { href: '/dashboard/org-news', label: 'Org-News', icon: Newspaper, permKey: 'canViewNews' },
      { href: '/dashboard/org-warnings', label: 'Disziplinarakte', icon: AlertTriangle, permKey: 'canViewWarnings' },
      { href: '/dashboard/training-records', label: 'Ausbildung', icon: GraduationCap, permKey: 'canViewTrainingRecords' },
      { href: '/dashboard/dispatch-logs', label: 'Schichtbuch', icon: ClipboardList, permKey: 'canViewDispatchLog' },
      { href: '/dashboard/organizations', label: 'Organisationen', icon: Building2 },
    ],
  },
  {
    label: 'Verwaltung',
    items: [
      { href: '/dashboard/stats', label: 'Statistiken', icon: BarChart2, supervisorOnly: true },
      { href: '/dashboard/admin-log', label: 'Admin-Log', icon: ScrollText, supervisorOnly: true },
      { href: '/dashboard/admin', label: 'Admin', icon: Settings, adminOnly: true },
    ],
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [orgPermissions, setOrgPermissions] = useState<OrgPermission | null>(null);
  const [orgType, setOrgType] = useState<OrgType>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAdmin = session?.user?.role === 'ADMIN';
  const isSupervisor = session?.user?.role === 'SUPERVISOR';

  useEffect(() => {
    const orgId = session?.user?.organizationId;
    if (!orgId) {
      setOrgPermissions(null);
      setOrgType(null);
      return;
    }
    fetch(`/api/organizations/${orgId}/permissions`)
      .then((r) => r.json())
      .then((d) => setOrgPermissions(d.data ?? null))
      .catch(() => setOrgPermissions(null));
    fetch(`/api/organizations/${orgId}`)
      .then((r) => r.json())
      .then((d) => setOrgType((d.data?.type as OrgType) ?? null))
      .catch(() => setOrgType(null));
  }, [session?.user?.organizationId]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Für Admins/Supervisors die vollständige Navigation anzeigen
  const navGroups = isAdmin || isSupervisor ? fullNavGroups : getNavGroupsForOrgType(orgType);

  const isNavItemVisible = (item: NavItem) => {
    // Admin-only items
    if ('adminOnly' in item && item.adminOnly && !isAdmin) return false;
    // Supervisor-or-admin-only items
    if ('supervisorOnly' in item && item.supervisorOnly && !isAdmin && !isSupervisor) return false;
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

  const SidebarContent = () => (
    <>
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
      <nav className="flex-1 p-3 overflow-y-auto">
        {navGroups.map((group, groupIdx) => {
          const visibleItems = group.items.filter(isNavItemVisible);
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.label}>
              {groupIdx > 0 && <div className="my-1 border-t border-slate-800/60" />}
              <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                {group.label}
              </p>
              {visibleItems.map((item) => {
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
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
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
            </div>
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
    </>
  );

  return (
    <RealtimeProvider>
      <div className="flex h-screen bg-slate-950 overflow-hidden">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar – desktop: always visible; mobile: overlay */}
        <aside
          className={clsx(
            'bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-200',
            'fixed inset-y-0 left-0 z-50 w-64',
            'md:relative md:translate-x-0',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <SidebarContent />
          {/* Close button (mobile only) */}
          <button
            className="absolute top-4 right-4 md:hidden text-slate-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Top bar (mobile) */}
          <header className="md:hidden flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-slate-400 hover:text-white"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                <Shield className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-white font-semibold text-sm">CAD System</span>
            </div>
            <NotificationBell />
          </header>

          {/* Desktop notification bar */}
          <div className="hidden md:flex items-center justify-end px-4 py-2 bg-slate-950 border-b border-slate-800/50">
            <NotificationBell />
          </div>

          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </RealtimeProvider>
  );
}
