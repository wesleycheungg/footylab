import { Outlet } from 'react-router-dom';
import { useCart } from '../contexts/cartContext';
import AnnouncementBar from './AnnouncementBar';
import CartDrawer from './CartDrawer';
import Footer from './Footer';
import Header from './Header';

/**
 * Chrome that wraps every route. Rendered as a parent route so the header
 * and footer persist across navigation instead of remounting per page.
 */
export default function Layout() {
  const { isOpen } = useCart();

  return (
    <div className="app-shell">
      {/* `inert` while the cart is open: the drawer is a modal dialog, and
          without this Tab walks straight out of it into the header and
          footer sitting behind the backdrop. Also hides that content from
          assistive tech, which is what a modal should do. Same mechanism
          ExpandableSection uses for collapsed copy. */}
      <div className="app-shell__content" inert={isOpen}>
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

      {/* Overlay, not a route: the cart is reachable from every page. */}
      <CartDrawer />
    </div>
  );
}
