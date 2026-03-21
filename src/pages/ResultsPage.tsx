import { useNavigate, useParams } from "react-router";
import { ResultsScreen } from "../app/components/ResultsScreen";

export function ResultsPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  return (
    <ResultsScreen
      onBack={() => navigate(`/trip/${id}/vote`)}
      onSetPreferences={() => navigate(`/trip/${id}/preferences`)}
    />
  );
}
