import type { Route } from "./+types/signin";
import Login from "~/components/auth/signin/Signin";
import { useAuth } from "~/contexts/AuthContext";
import { Navigate } from "react-router-dom";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Braille Display Login" },
    { name: "description", content: "Welcome to Braille Display!" },
  ];
}

export default function Signin() {
  try {
    const { isAuthenticated, loading, currentUser } = useAuth();
    
    // Show loading spinner while authentication is being checked
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }
    
    // Only redirect to dashboard if user is fully authenticated with complete data
    // This ensures we don't redirect based on cached/incomplete auth state
    if (isAuthenticated && currentUser && currentUser.email) {
      console.log('User is authenticated, redirecting to dashboard:', currentUser.email);
      return <Navigate to="/dashboard" replace />;
    }
    
    // Always show login form if not authenticated or user data is incomplete
    console.log('Showing login form - isAuthenticated:', isAuthenticated, 'currentUser:', currentUser?.email);
    return <Login />;
  } catch (error) {
    console.error('AuthContext error:', error);
    return <Login />; // Show login form even if there's an error
  }
}
