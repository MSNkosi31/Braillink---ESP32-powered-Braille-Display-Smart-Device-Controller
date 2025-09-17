import { type RouteConfig, index, route } from "@react-router/dev/routes";


export default [
  index("routes/signin.tsx"),
  route("signup", "routes/signup.tsx"),
  route("dashboard", "routes/dashboard.tsx"),
  route("notifications", "routes/notifications.tsx"),
  route("test", "routes/test.tsx"),
  route("offline-test", "routes/offline-test.tsx"),
  route("firebase-test", "routes/firebase-test.tsx"),
  route("auth-test", "routes/auth-test.tsx"),
  route("bypass-test", "routes/bypass-test.tsx"),
  route("debug-auth", "routes/debug-auth.tsx"),
  route("email-debug", "routes/email-debug.tsx"),
  route("quick-test", "routes/quick-test.tsx"),
  route("network-test", "routes/network-test.tsx"),
] satisfies RouteConfig;
