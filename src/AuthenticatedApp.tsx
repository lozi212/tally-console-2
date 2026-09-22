import { Navigate, Route, Routes, useLocation, type Location } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import TransactionsPage from './pages/TransactionsPage'
import TransactionDetailPage from './pages/TransactionDetailPage'

/** Everything a signed-in user can reach. /login and unknown URLs redirect. */
export default function AuthenticatedApp() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/transactions/:id" element={<TransactionDetailPage />} />
      </Route>
      <Route path="/login" element={<RedirectAfterLogin />} />
      <Route path="*" element={<Navigate to="/transactions" replace />} />
    </Routes>
  )
}

function RedirectAfterLogin() {
  const location = useLocation()
  const from = (location.state as { from?: Location } | null)?.from
  const target = from ? `${from.pathname}${from.search}${from.hash}` : '/transactions'
  return <Navigate to={target} replace />
}
