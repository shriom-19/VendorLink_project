import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { CartProvider } from "@/contexts/cart-context";
import { NavigationHeader } from "@/components/navigation-header";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import VendorDashboard from "@/pages/vendor-dashboard";
import SupplierDashboard from "@/pages/supplier-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import Orders from "@/pages/orders";
import SpecialRequests from "@/pages/special-requests";

function AppContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Landing />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationHeader />
      <Switch>
        <Route path="/">
          {user.role === 'vendor' && <VendorDashboard />}
          {user.role === 'supplier' && <SupplierDashboard />}
          {user.role === 'admin' && <AdminDashboard />}
        </Route>
        <Route path="/vendor" component={VendorDashboard} />
        <Route path="/supplier" component={SupplierDashboard} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/orders" component={Orders} />
        <Route path="/special-requests" component={SpecialRequests} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function Router() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </AuthProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
