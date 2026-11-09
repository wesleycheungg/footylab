import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { CartProvider } from './contexts/CartProvider';
import { UserProvider } from './contexts/UserProvider';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import OrderDetailPage from './pages/OrderDetailPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import ProductPage from './pages/ProductPage';
import ShopPage from './pages/ShopPage';
import SignupPage from './pages/SignupPage';

/**
 * Routes mirror the Frontend Routes table in PLAN.md. `/` and `/jerseys`
 * both render the shop page; the nav links are query-param presets on
 * /jerseys rather than separate pages.
 *
 * Browsing stays public on purpose — only checkout and orders sit behind
 * ProtectedRoute.
 */
export default function App() {
  return (
    <BrowserRouter>
      {/* CartProvider sits inside UserProvider: it reacts to sign-in state
          to load, clear, or replay a pending add. */}
      <UserProvider>
        <CartProvider>
          <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<ShopPage />} />
            <Route path="/jerseys" element={<ShopPage />} />
            <Route path="/products/:id" element={<ProductPage />} />

            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Layout route: one gate wrapping everything that needs an
                account, rather than repeating the check per route. */}
            <Route element={<ProtectedRoute />}>
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/orders" element={<OrderHistoryPage />} />
              {/* Also serves the post-checkout confirmation, via
                  location.state.justPlaced. */}
              <Route path="/orders/:id" element={<OrderDetailPage />} />
            </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </CartProvider>
      </UserProvider>
    </BrowserRouter>
  );
}
