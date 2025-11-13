import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function GuestRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div>Loading...</div>
  }

  // If user is logged in, redirect to home page
  return user ? <Navigate to="/" replace /> : children
}

