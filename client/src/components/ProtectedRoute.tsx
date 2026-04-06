import { Redirect } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import type { ComponentType } from "react";

interface ProtectedRouteProps {
  component: ComponentType;
}

export default function ProtectedRoute({ component: Component }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return <Component />;
}
