import { useNavigate, useParams } from "react-router";
import { ImportScreen } from "../app/components/ImportScreen";

export function ImportPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  return (
    <ImportScreen
      onBack={() => navigate("/")}
      onGoHome={() => navigate("/")}
      onContinueToVoting={() => navigate(`/trip/${id}/vote`)}
    />
  );
}
