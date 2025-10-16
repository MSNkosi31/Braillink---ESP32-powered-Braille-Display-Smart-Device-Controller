import type { Route } from "./+types/signup";
import Signup from "~/components/auth/signup/Signup";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Braille Display SignUp" },
    { name: "description", content: "Welcome to Braille Display!" },
  ];
}

export default function Register() {
  return <Signup />;
}