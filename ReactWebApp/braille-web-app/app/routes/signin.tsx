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
    const { isAuthenticated } = useAuth();
    
    // Redirect to dashboard if already authenticated
    if (isAuthenticated) {
      return <Navigate to="/dashboard" replace />;
    }
    
    return <Login />;
  } catch (error) {
    console.error('AuthContext error:', error);
    return <Login />; // Show login form even if there's an error
  }
}
