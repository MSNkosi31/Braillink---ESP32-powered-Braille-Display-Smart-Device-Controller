import { type RouteConfig, index, route } from "@react-router/dev/routes";


export default [
  index("routes/signin.tsx"),
  route("signup", "routes/signup.tsx"),
  route("dashboard", "routes/dashboard.tsx"),
  route("notifications", "routes/notifications.tsx"),
] satisfies RouteConfig;
