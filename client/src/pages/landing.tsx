import { Button } from "@/components/ui/button";
import PriceTable from "@/components/PriceTable";
import MiningPlans from "@/components/MiningPlans";
import { Coins, TrendingUp, Shield, Users } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

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
                <a href="#home" className="text-white hover:text-cmc-blue transition-colors" data-testid="nav-home">Home</a>
                <a href="#prices" className="text-cmc-gray hover:text-white transition-colors" data-testid="nav-prices">Prices</a>
                <a href="#plans" className="text-cmc-gray hover:text-white transition-colors" data-testid="nav-plans">Mining Plans</a>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                onClick={handleLogin}
                className="border-cmc-blue text-cmc-blue hover:bg-cmc-blue hover:text-white"
                data-testid="button-login"
              >
                Login
              </Button>
              <Button 
                onClick={handleLogin}
                className="bg-cmc-blue hover:bg-blue-600"
                data-testid="button-signup"
              >
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative py-20 bg-gradient-to-br from-cmc-dark via-gray-900 to-cmc-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl lg:text-6xl font-bold mb-6" data-testid="text-hero-title">
                Professional <span className="text-cmc-blue">Bitcoin Mining</span> Platform
              </h1>
              <p className="text-xl text-cmc-gray mb-8 leading-relaxed" data-testid="text-hero-description">
                Join thousands of miners earning passive income with our state-of-the-art mining infrastructure. 
                Start with as little as $10 and scale your mining operations.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={handleLogin}
                  className="bg-cmc-blue text-white px-8 py-4 text-lg hover:bg-blue-600"
                  data-testid="button-start-mining"
                >
                  Start Mining Now
                </Button>
                <Button 
                  variant="outline"
                  className="border-gray-600 text-white px-8 py-4 text-lg hover:border-cmc-blue"
                  data-testid="button-view-plans"
                >
                  View Plans
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-8 mt-12">
                <div className="text-center">
                  <div className="text-2xl font-bold text-cmc-blue" data-testid="text-uptime">99.9%</div>
                  <div className="text-sm text-cmc-gray">Uptime</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-cmc-green" data-testid="text-paidout">$2.4M+</div>
                  <div className="text-sm text-cmc-gray">Paid Out</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white" data-testid="text-miners">50k+</div>
                  <div className="text-sm text-cmc-gray">Active Miners</div>
                </div>
              </div>
            </div>
            <div className="bg-cmc-card rounded-2xl p-6 border border-gray-700">
              <h3 className="text-xl font-semibold mb-4" data-testid="text-mining-stats">Live Mining Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-cmc-dark p-4 rounded-xl">
                  <div className="text-sm text-cmc-gray">Bitcoin Price</div>
                  <div className="text-2xl font-bold text-cmc-green" data-testid="text-btc-price">$112,570.41</div>
                  <div className="text-sm text-cmc-green">+2.17%</div>
                </div>
                <div className="bg-cmc-dark p-4 rounded-xl">
                  <div className="text-sm text-cmc-gray">Network Hashrate</div>
                  <div className="text-2xl font-bold" data-testid="text-hashrate">789.2 EH/s</div>
                </div>
                <div className="bg-cmc-dark p-4 rounded-xl">
                  <div className="text-sm text-cmc-gray">Mining Difficulty</div>
                  <div className="text-2xl font-bold" data-testid="text-difficulty">103.92T</div>
                </div>
                <div className="bg-cmc-dark p-4 rounded-xl">
                  <div className="text-sm text-cmc-gray">Block Reward</div>
                  <div className="text-2xl font-bold" data-testid="text-block-reward">3.125 BTC</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Price Table Section */}
      <section id="prices" className="py-16 bg-cmc-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-4" data-testid="text-prices-title">Today's Cryptocurrency Prices by Market Cap</h2>
            <p className="text-cmc-gray" data-testid="text-prices-description">The global crypto market cap is $3.92T, a 1.89% increase over the last day.</p>
          </div>
          <PriceTable />
        </div>
      </section>

      {/* Mining Plans Section */}
      <section id="plans" className="py-16 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4" data-testid="text-plans-title">Choose Your Mining Plan</h2>
            <p className="text-xl text-cmc-gray" data-testid="text-plans-description">Start earning passive income with our professional mining infrastructure</p>
          </div>
          <MiningPlans />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-cmc-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4" data-testid="text-features-title">Why Choose CryptoMine Pro?</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center" data-testid="card-feature-security">
              <Shield className="mx-auto h-12 w-12 text-cmc-blue mb-4" />
              <h3 className="text-xl font-semibold mb-2">Enterprise Security</h3>
              <p className="text-cmc-gray">Bank-grade security with cold storage and multi-signature wallets</p>
            </div>
            <div className="text-center" data-testid="card-feature-performance">
              <TrendingUp className="mx-auto h-12 w-12 text-cmc-green mb-4" />
              <h3 className="text-xl font-semibold mb-2">Optimized Performance</h3>
              <p className="text-cmc-gray">Latest ASIC miners with 99.9% uptime guarantee</p>
            </div>
            <div className="text-center" data-testid="card-feature-support">
              <Users className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">24/7 Support</h3>
              <p className="text-cmc-gray">Dedicated support team available around the clock</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-cmc-card border-t border-gray-700 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Coins className="text-cmc-blue text-2xl" />
                <span className="text-xl font-bold">CryptoMine Pro</span>
              </div>
              <p className="text-cmc-gray mb-4">Professional Bitcoin mining platform with industry-leading infrastructure and competitive returns.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-cmc-gray">
                <li><a href="#" className="hover:text-white">Mining Plans</a></li>
                <li><a href="#" className="hover:text-white">Dashboard</a></li>
                <li><a href="#" className="hover:text-white">Withdrawals</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-cmc-gray">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Contact Us</a></li>
                <li><a href="#" className="hover:text-white">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-cmc-gray">
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Risk Disclosure</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-cmc-gray">
            <p>&copy; 2024 CryptoMine Pro. All rights reserved. Licensed and regulated.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
