import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PaymentModal from "./PaymentModal";

interface MiningPlan {
  id: string;
  name: string;
  price: string;
  miningRate: string;
  dailyEarnings: string;
  monthlyRoi: string;
  contractPeriod: number;
  isActive: boolean;
}

export default function MiningPlans() {
  const [selectedPlan, setSelectedPlan] = useState<MiningPlan | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["/api/mining-plans"],
  });

  const handleSelectPlan = (plan: MiningPlan) => {
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  const formatDailyEarnings = (earnings: string) => {
    const btcAmount = parseFloat(earnings);
    const usdAmount = btcAmount * 112570; // Approximate BTC price
    return `~$${usdAmount.toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="text-cmc-gray" data-testid="text-loading-plans">Loading mining plans...</div>
      </div>
    );
  }

  return (
    <>
      <div className="grid md:grid-cols-3 gap-8" data-testid="container-mining-plans">
        {plans.map((plan: MiningPlan, index: number) => {
          const isPopular = plan.name === "Pro";
          const isEnterprise = plan.name === "Enterprise";

          return (
            <div
              key={plan.id}
              className={`bg-cmc-card rounded-2xl p-8 border ${
                isPopular
                  ? "border-2 border-cmc-blue relative overflow-hidden"
                  : isEnterprise
                  ? "border border-gray-700 hover:border-yellow-500 transition-colors"
                  : "border border-gray-700 hover:border-cmc-blue transition-colors"
              }`}
              data-testid={`card-plan-${plan.name.toLowerCase()}`}
            >
              {isPopular && (
                <div className="absolute top-0 right-0 bg-cmc-blue text-white px-4 py-1 text-sm font-semibold rounded-bl-xl">
                  POPULAR
                </div>
              )}
              
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2" data-testid={`text-plan-name-${plan.name.toLowerCase()}`}>
                  {plan.name}
                </h3>
                <div className={`text-4xl font-bold mb-2 ${
                  isEnterprise ? "text-yellow-500" : "text-cmc-blue"
                }`} data-testid={`text-plan-price-${plan.name.toLowerCase()}`}>
                  ${plan.price}
                </div>
                <div className="text-cmc-gray">/month</div>
              </div>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between">
                  <span className="text-cmc-gray">Mining Rate</span>
                  <span className="font-semibold" data-testid={`text-mining-rate-${plan.name.toLowerCase()}`}>
                    {plan.miningRate} MH/s
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-cmc-gray">Daily Earnings</span>
                  <span className="font-semibold text-cmc-green" data-testid={`text-daily-earnings-${plan.name.toLowerCase()}`}>
                    {formatDailyEarnings(plan.dailyEarnings)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-cmc-gray">Monthly ROI</span>
                  <span className="font-semibold text-cmc-green" data-testid={`text-monthly-roi-${plan.name.toLowerCase()}`}>
                    ~{plan.monthlyRoi}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-cmc-gray">Contract Period</span>
                  <span className="font-semibold" data-testid={`text-contract-period-${plan.name.toLowerCase()}`}>
                    {plan.contractPeriod} months
                  </span>
                </div>
              </div>
              
              <Button
                onClick={() => handleSelectPlan(plan)}
                className={`w-full py-3 font-semibold transition-colors ${
                  isEnterprise
                    ? "bg-yellow-500 text-black hover:bg-yellow-400"
                    : "bg-cmc-blue text-white hover:bg-blue-600"
                }`}
                data-testid={`button-select-${plan.name.toLowerCase()}`}
              >
                Select Plan
              </Button>
            </div>
          );
        })}
      </div>

      {selectedPlan && (
        <PaymentModal
          plan={selectedPlan}
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedPlan(null);
          }}
        />
      )}
    </>
  );
}
