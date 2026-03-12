'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import type { LucideProps } from 'lucide-react';
import {
  Shield,
  LayoutDashboard,
  Database,
  History,
  Settings,
  Key,
  Users,
  Code2,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bell,
  Search,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ToastContainer, setToastCallback, type ToastType } from '@/components/ui/Toast';

type IconComponent = React.ComponentType<LucideProps>;

interface SidebarLink {
  href: string;
  icon: IconComponent;
  label: string;
}

const userLinks: SidebarLink[] = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { href: '/dashboard/vault', icon: Database, label: 'My Vault' },
  { href: '/dashboard/access', icon: Key, label: 'Access Control' },
  { href: '/dashboard/history', icon: History, label: 'Audit Log' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: ToastType }>>([]);
  const pathname = usePathname();
  const router = useRouter();

  // Toast management
  const addToast = (message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // Initialize toast callback
  useEffect(() => {
    setToastCallback(addToast);
  }, []);

  // Get user data from localStorage
  const getUserData = () => {
    if (typeof window === 'undefined') return { username: 'User', role: 'User' };
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        return {
          username: user.username || 'User',
          role: user.role || 'User',
        };
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
    return { username: 'User', role: 'User' };
  };

  const { username: userName, role: userRole } = getUserData();

  // Check if user is logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Desktop Sidebar */}
      <motion.aside
        className={cn(
          'hidden lg:flex flex-col fixed left-0 top-0 bottom-0 z-40 border-r border-white/5 bg-black/80 backdrop-blur-xl'
        )}
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-6 border-b border-white/5">
          <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-black" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="overflow-hidden whitespace-nowrap"
              >
                <div className="text-sm font-bold text-white">Gaia Sovereign</div>
                <div className="text-[10px] text-white/30 font-mono">v1.0.0</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {userLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);
            
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  active
                    ? 'bg-white/10 text-white'
                    : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                )}
              >
                <Icon className="w-4.5 h-4.5 shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="truncate"
                    >
                      {link.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </nav>

        {/* Portal Switcher & Logout */}
        <div className="px-3 py-3 border-t border-white/5">
          {!collapsed && (
            <div className="space-y-1 mb-3">
              <Link
                href="/dashboard"
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                  pathname.startsWith('/dashboard') ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60 hover:bg-white/5'
                )}
              >
                <Database className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </Link>
              <Link
                href="/admin"
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                  pathname.startsWith('/admin') ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60 hover:bg-white/5'
                )}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Admin</span>
              </Link>
              <Link
                href="/developer"
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                  pathname.startsWith('/developer') ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60 hover:bg-white/5'
                )}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Developer</span>
              </Link>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors w-full'
            )}
          >
            <LogOut className="w-4.5 h-4.5 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>

        {/* Collapse Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-white/10 border border-white/10 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/20 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </motion.aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-16 bg-black/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg bg-white/5">
            <Menu className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center">
              <Shield className="w-4 h-4 text-black" />
            </div>
            <span className="text-sm font-bold">Gaia Sovereign</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg bg-white/5">
            <Bell className="w-4 h-4 text-white/60" />
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-72 bg-black border-r border-white/5 flex flex-col"
              initial={{ x: -288 }}
              animate={{ x: 0 }}
              exit={{ x: -288 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="flex items-center justify-between px-5 py-6 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-black" />
                  </div>
                  <div className="text-sm font-bold">Gaia Sovereign</div>
                </div>
                <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg bg-white/5">
                  <X className="w-4 h-4 text-white/60" />
                </button>
              </div>
              <nav className="flex-1 py-4 px-3 space-y-1">
                {userLinks.map((link) => {
                  const Icon = link.icon;
                  const active = isActive(link.href);
                  
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                        active ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                      )}
                    >
                      <Icon className="w-4.5 h-4.5" />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </nav>
              <div className="px-3 py-3 border-t border-white/5">
                <div className="space-y-1 mb-3">
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                      pathname.startsWith('/dashboard') ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60 hover:bg-white/5'
                    )}
                  >
                    <Database className="w-3.5 h-3.5" />
                    <span>Dashboard</span>
                  </Link>
                  <Link
                    href="/admin"
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                      pathname.startsWith('/admin') ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60 hover:bg-white/5'
                    )}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Admin</span>
                  </Link>
                  <Link
                    href="/developer"
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                      pathname.startsWith('/developer') ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60 hover:bg-white/5'
                    )}
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>Developer</span>
                  </Link>
                </div>
                <button
                  onClick={() => { handleLogout(); setMobileOpen(false); }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/30 hover:text-white/60 w-full"
                >
                  <LogOut className="w-4.5 h-4.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <motion.main
        className={cn('flex-1 min-h-screen', 'lg:pt-0 pt-16')}
        animate={{ marginLeft: collapsed ? 72 : 260 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        style={{ marginLeft: 260 }}
      >
        {/* Top Bar */}
        <header className="hidden lg:flex items-center justify-between h-16 px-8 border-b border-white/5 bg-black/40 backdrop-blur-sm sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 text-sm bg-white/5 border border-white/5 rounded-lg text-white placeholder:text-white/25 focus:outline-none focus:border-white/15 w-64 transition-colors"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
              <Bell className="w-4 h-4 text-white/60" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full" />
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-white/5">
              <div className="w-8 h-8 rounded-lg bg-linear-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold">
                {userName.split(' ').map((n: string) => n[0]).join('')}
              </div>
              <div className="hidden xl:block">
                <div className="text-sm font-medium text-white">{userName}</div>
                <div className="text-[10px] text-white/30">{userRole}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6 lg:p-8">{children}</div>
      </motion.main>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
