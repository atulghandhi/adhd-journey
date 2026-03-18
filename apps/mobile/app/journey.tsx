import { Redirect } from "expo-router";

import { useAuth } from "../src/hooks/useAuth";
import { getProtectedMobileRedirect } from "../src/lib/auth-routing";
import { JourneyHomeScreen } from "../src/screens/journey/JourneyHomeScreen";
import { BootstrapScreen } from "../src/screens/BootstrapScreen";

export default function JourneyRoute() {
  const { isLoading, session } = useAuth();

  if (isLoading) {
    return <BootstrapScreen />;
  }

  const redirectTarget = getProtectedMobileRedirect(session);

  if (redirectTarget) {
    return <Redirect href={redirectTarget as never} />;
  }

  return <JourneyHomeScreen />;
}
