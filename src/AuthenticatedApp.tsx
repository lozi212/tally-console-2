
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  type Location,
} from 'react-router-dom'

import AppLayout from './components/AppLayout'
import QueryErrorBoundary from './components/QueryErrorBoundary'

import TransactionsPage from './pages/TransactionsPage'
import TransactionDetailPage from './pages/TransactionDetailPage'
import CustomersPage from './pages/CustomersPage'
import PaymentsPage from './pages/PaymentsPage'
import SettingsPage from './pages/SettingsPage'

/**
 * Everything a signed-in user can reach.
 */
export default function AuthenticatedApp() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route
          path="/transactions"
          element={<TransactionsPage />}
        />

        <Route
          path="/transactions/:id"
          element={
            <QueryErrorBoundary>
              <TransactionDetailPage />
            </QueryErrorBoundary>
          }
        />

        <Route
          path="/customers"
          element={<CustomersPage />}
        />

        <Route
          path="/payments"
          element={<PaymentsPage />}
        />

        <Route
          path="/settings"
          element={<SettingsPage />}
        />
      </Route>

      <Route
        path="/login"
        element={<RedirectAfterLogin />}
      />

      <Route
        path="*"
        element={<Navigate to="/transactions" replace />}
      />
    </Routes>
  )
}

function RedirectAfterLogin() {
  const location = useLocation()

  const from = (
    location.state as { from?: Location } | null
  )?.from

  const target = from
    ? `${from.pathname}${from.search}${from.hash}`
    : '/transactions'

  return <Navigate to={target} replace />
}

