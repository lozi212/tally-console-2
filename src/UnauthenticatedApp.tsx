import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import LoginPage from './pages/LoginPage'

/** Everything a logged-out visitor can reach. Any other URL goes to /login. */
export default function UnauthenticatedApp() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<RedirectToLogin />} />
    </Routes>
  )
}

function RedirectToLogin() {
  const location = useLocation()
  // Remember where they were going so login can send them back there.
  return <Navigate to="/login" replace state={{ from: location }} />
}
