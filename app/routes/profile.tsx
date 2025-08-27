import type { MetaFunction } from "react-router";
import ProfileSettings from "../components/profile/ProfileSettings";

export const meta: MetaFunction = () => {
  return [
    { title: "Profile Settings - Braille Web App" },
    { name: "description", content: "Manage your profile settings and preferences" },
  ];
};

export default function Profile() {
  return <ProfileSettings />;
}
