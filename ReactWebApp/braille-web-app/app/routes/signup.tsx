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
  // Let the Signup component handle the authentication flow
  // Don't redirect here as it interferes with the signup process
  return <Signup />;
}