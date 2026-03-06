'use client';

import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
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
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dispatch', icon: LayoutDashboard },
  { href: '/dashboard/incidents', label: 'Einsätze', icon: AlertTriangle },
  { href: '/dashboard/units', label: 'Einheiten', icon: Radio },
  { href: '/dashboard/citizens', label: 'Bürger', icon: Users },
  { href: '/dashboard/vehicles', label: 'Fahrzeuge', icon: Car },
  { href: '/dashboard/warrants', label: 'Haftbefehle', icon: FileWarning },
  { href: '/dashboard/reports', label: 'Berichte', icon: FileText },
  { href: '/dashboard/organizations', label: 'Organisationen', icon: Building2 },
  { href: '/dashboard/admin', label: 'Admin', icon: Settings, adminOnly: true },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();

  const isAdmin = session?.user?.role === 'ADMIN';

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
            if (item.adminOnly && !isAdmin) return null;
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
