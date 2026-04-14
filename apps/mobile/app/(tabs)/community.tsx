import { ErrorBoundary } from "../../src/components/ErrorBoundary";
import { CommunityScreen } from "../../src/screens/community/CommunityScreen";

export default function CommunityRoute() {
  return (
    <ErrorBoundary>
      <CommunityScreen />
    </ErrorBoundary>
  );
}
