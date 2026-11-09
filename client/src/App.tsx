import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { UserProvider } from './contexts/UserProvider';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import PlaceholderPage from './pages/PlaceholderPage';
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
      <UserProvider>
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
              <Route
                path="/checkout"
                element={<PlaceholderPage title="Checkout" phase="Phase 9" />}
              />
              <Route
                path="/orders"
                element={
                  <PlaceholderPage title="Order history" phase="Phase 9" />
                }
              />
              <Route
                path="/orders/:id"
                element={
                  <PlaceholderPage title="Order detail" phase="Phase 9" />
                }
              />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </UserProvider>
    </BrowserRouter>
  );
}
