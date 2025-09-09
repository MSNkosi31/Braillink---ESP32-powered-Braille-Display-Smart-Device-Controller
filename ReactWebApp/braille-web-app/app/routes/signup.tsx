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
  const { isAuthenticated } = useAuth();
  
  // Redirect to dashboard if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <Signup />;
}