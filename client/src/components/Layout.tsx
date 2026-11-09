import { Outlet } from 'react-router-dom';
import AnnouncementBar from './AnnouncementBar';
import Footer from './Footer';
import Header from './Header';

/**
 * Chrome that wraps every route. Rendered as a parent route so the header
 * and footer persist across navigation instead of remounting per page.
 */
export default function Layout() {
  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <AnnouncementBar />
      <Header />
      <main id="main" className="app-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
