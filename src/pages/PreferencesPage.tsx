import { useNavigate, useParams } from "react-router";
import { PreferencesScreen } from "../app/components/PreferencesScreen";

export function PreferencesPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  return (
    <PreferencesScreen
      onBack={() => navigate(`/trip/${id}/results`)}
      onBuild={() => navigate(`/trip/${id}/building`)}
    />
  );
}
