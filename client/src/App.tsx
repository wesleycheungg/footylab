import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import NotFoundPage from './pages/NotFoundPage';
import PlaceholderPage from './pages/PlaceholderPage';
import ProductPage from './pages/ProductPage';
import ShopPage from './pages/ShopPage';

/**
 * Routes mirror the Frontend Routes table in PLAN.md. `/` and `/jerseys`
 * both render the shop page; the nav links are query-param presets on
 * /jerseys rather than separate pages.
 *
 * ProtectedRoute wraps /checkout and /orders* in Phase 7 — until auth
 * exists there is nothing to protect them with.
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<ShopPage />} />
          <Route path="/jerseys" element={<ShopPage />} />
          <Route path="/products/:id" element={<ProductPage />} />

          <Route
            path="/login"
            element={<PlaceholderPage title="Log in" phase="Phase 7" />}
          />
          <Route
            path="/signup"
            element={<PlaceholderPage title="Create an account" phase="Phase 7" />}
          />
          <Route
            path="/checkout"
            element={<PlaceholderPage title="Checkout" phase="Phase 9" />}
          />
          <Route
            path="/orders"
            element={<PlaceholderPage title="Order history" phase="Phase 9" />}
          />
          <Route
            path="/orders/:id"
            element={<PlaceholderPage title="Order detail" phase="Phase 9" />}
          />

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
