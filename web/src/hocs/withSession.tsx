import { useSessionContext } from "@/contexts/session";
import { Navigate } from "react-router-dom";

export default function withSession<T>(Component: React.ComponentType<T>) {
  function WrappedComponent(props: T) {
    const { session } = useSessionContext();

    // If session is null, redirect to login or show an error
    if (!session) {
      return <Navigate to="/" replace />;
    }

    return <Component {...props} session={session} />;
  }
  WrappedComponent.displayName = Component.displayName;
  return WrappedComponent;
}
