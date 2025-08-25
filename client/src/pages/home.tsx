import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import PriceTable from "@/components/PriceTable";
import MiningPlans from "@/components/MiningPlans";
import MiningDashboard from "@/components/MiningDashboard";
import WithdrawalPage from "@/components/WithdrawalPage";
import { Coins, LogOut, User, Settings, BarChart3 } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Home() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      toast({
        title: "Unauthorized", 
        description: "You are logged out. Redirecting to login...",
        variant: "destructive",
      });
      setTimeout(() => {
        setLocation("/auth");
      }, 500);
      return;
    }
  }, [user, isLoading, toast, setLocation]);

  const { logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cmc-dark">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cmc-dark text-white">
      {/* Navigation */}
      <nav className="bg-cmc-card border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <Coins className="text-cmc-blue text-2xl" />
                <span className="text-xl font-bold">CryptoMine Pro</span>
              </div>
              <div className="hidden md:flex space-x-6">
                <a href="#dashboard" className="text-white hover:text-cmc-blue transition-colors" data-testid="nav-dashboard">Dashboard</a>
                <a href="#prices" className="text-cmc-gray hover:text-white transition-colors" data-testid="nav-prices">Prices</a>
                <a href="#plans" className="text-cmc-gray hover:text-white transition-colors" data-testid="nav-plans">Plans</a>
                <a href="#withdrawals" className="text-cmc-gray hover:text-white transition-colors" data-testid="nav-withdrawals">Withdrawals</a>
                {user?.isAdmin && (
                  <Link href="/admin" className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded-md text-white font-semibold transition-colors" data-testid="nav-admin">
                    🔒 Admin Dashboard
                  </Link>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden lg:flex items-center space-x-4">
                <div className="flex items-center space-x-2" data-testid="user-info">
                  {user?.profileImageUrl ? (
                    <img 
                      src={user.profileImageUrl} 
                      alt="Profile" 
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-cmc-gray" />
                  )}
                  <span className="text-sm">{user?.firstName || user?.email}</span>
                </div>
              </div>
              <Button 
                variant="outline"
                onClick={handleLogout}
                className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mining Dashboard Section */}
      <section id="dashboard" className="py-16 bg-cmc-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-4" data-testid="text-dashboard-title">Mining Dashboard</h2>
            <p className="text-cmc-gray" data-testid="text-dashboard-description">Monitor your mining performance and earnings</p>
          </div>
          <MiningDashboard />
        </div>
      </section>

      {/* Price Table Section */}
      <section id="prices" className="py-16 bg-cmc-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-4" data-testid="text-prices-title">Today's Cryptocurrency Prices</h2>
            <p className="text-cmc-gray" data-testid="text-prices-description">Real-time cryptocurrency market data</p>
          </div>
          <PriceTable />
        </div>
      </section>

      {/* Mining Plans Section */}
      <section id="plans" className="py-16 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4" data-testid="text-plans-title">Upgrade Your Mining Plan</h2>
            <p className="text-xl text-cmc-gray" data-testid="text-plans-description">Scale your mining operations with our professional plans</p>
          </div>
          <MiningPlans />
        </div>
      </section>

      {/* Withdrawals Section */}
      <section id="withdrawals" className="py-16 bg-cmc-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-4" data-testid="text-withdrawals-title">Withdraw Earnings</h2>
            <p className="text-cmc-gray" data-testid="text-withdrawals-description">Cash out your mining rewards to your preferred cryptocurrency wallet</p>
          </div>
          <WithdrawalPage />
        </div>
      </section>
    </div>
  );
}
