import { useAuth, type PageKey } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Navbar } from '@/components/Navbar';
import { APP_PAGES } from '@/config/pages';
import NoAccess from '@/pages/NoAccess';

interface LayoutProps {
  children: React.ReactNode;
  requiredPage?: PageKey;
  adminOnly?: boolean;
}

export function Layout({ children, requiredPage, adminOnly }: LayoutProps) {
  const { isAuthenticated, hasPage, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !user?.isAdmin) {
    const firstAllowed = APP_PAGES.find((page) => hasPage(page.key));
    return firstAllowed ? <Navigate to={firstAllowed.url} replace /> : <NoAccess />;
  }

  if (requiredPage && !hasPage(requiredPage)) {
    const firstAllowed = APP_PAGES.find((page) => hasPage(page.key));
    if (firstAllowed) {
      return <Navigate to={firstAllowed.url} replace />;
    }
    if (user?.isAdmin) {
      return <Navigate to="/admin/usuarios" replace />;
    }
    return <NoAccess />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full overflow-x-hidden">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar />
          <main className="flex-1 p-6 bg-background overflow-x-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
