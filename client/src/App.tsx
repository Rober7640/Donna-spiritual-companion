import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/context/AuthContext";
import { ChatProvider } from "@/context/ChatContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Onboarding from "@/pages/Onboarding";
import Chat from "@/pages/Chat";
import Dashboard from "@/pages/Dashboard";
import SessionDetail from "@/pages/SessionDetail";
import WelcomeBack from "@/pages/WelcomeBack";
import PurchaseSuccess from "@/pages/PurchaseSuccess";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/chat" component={Chat} />
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/session/:id">
        <ProtectedRoute component={SessionDetail} />
      </Route>
      <Route path="/login" component={WelcomeBack} />
      <Route path="/purchase-success">
        <ProtectedRoute component={PurchaseSuccess} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ChatProvider>
          <Toaster />
          <Router />
        </ChatProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
