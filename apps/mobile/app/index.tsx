import { Redirect } from "expo-router";

import { useAuth } from "../src/hooks/useAuth";
import { getMobileEntryRoute } from "../src/lib/auth-routing";
import { BootstrapScreen } from "../src/screens/BootstrapScreen";

export default function IndexRoute() {
  const { isLoading, session } = useAuth();

  if (isLoading) {
    return <BootstrapScreen />;
  }

  return <Redirect href={getMobileEntryRoute(session) as never} />;
}
