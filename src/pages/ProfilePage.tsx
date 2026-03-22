import { useNavigate } from "react-router";
import { ProfileScreen } from "../app/components/ProfileScreen";

export function ProfilePage() {
  const navigate = useNavigate();
  return <ProfileScreen onBack={() => navigate("/")} />;
}
