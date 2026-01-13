import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import DebugInfoBadge from './DebugInfoBadge';

const Layout = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />

      {/* Fixed debug flag badge (bottom-right corner) */}
      <DebugInfoBadge />
    </div>
  );
};

export default Layout;
