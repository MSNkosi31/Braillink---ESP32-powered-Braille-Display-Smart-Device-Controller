import type { Route } from "./+types/signup";
import Signup from "~/components/auth/signup/Signup";
import { useAuth } from "~/contexts/AuthContext";
import { Navigate } from "react-router-dom";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Braille Display SignUp" },
    { name: "description", content: "Welcome to Braille Display!" },
  ];
}

export default function Register() {
  const { isAuthenticated, loading } = useAuth();
  
  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  
  // Redirect to dashboard if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <Signup />;
}