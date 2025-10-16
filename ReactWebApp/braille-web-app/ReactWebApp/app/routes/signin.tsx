import type { Route } from "./+types/signin";
import Login from "~/components/auth/signin/Signin";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Braille Display Login" },
    { name: "description", content: "Welcome to Braille Display!" },
  ];
}

export default function Signin() {
  return <Login />;
}
