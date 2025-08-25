import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { TrendingUp, Zap } from "lucide-react";

interface BalanceTickerProps {
  currentBalance: number;
  currency: string;
  isActive?: boolean;
  className?: string;
}

export default function RealTimeBalanceTicker({ 
  currentBalance, 
  currency = "BTC", 
  isActive = true,
  className = ""
}: BalanceTickerProps) {
  const [previousBalance, setPreviousBalance] = useState(currentBalance);
  const [tickerDigits, setTickerDigits] = useState<string[]>([]);
  const [isIncreasing, setIsIncreasing] = useState(false);

  const formatBalance = (balance: number) => {
    return balance.toFixed(8).split('');
  };

  useEffect(() => {
    const currentDigits = formatBalance(currentBalance);
    const prevDigits = formatBalance(previousBalance);
    
    if (currentBalance !== previousBalance) {
      setIsIncreasing(currentBalance > previousBalance);
      setTickerDigits(currentDigits);
      setPreviousBalance(currentBalance);
    } else {
      setTickerDigits(currentDigits);
    }
  }, [currentBalance, previousBalance]);

  const getDigitColor = (isChanging: boolean) => {
    if (!isActive) return "text-gray-400";
    if (isChanging && isIncreasing) return "text-green-400";
    return "text-white";
  };

  return (
    <div className={`font-mono relative ${className}`}>
      <div className="flex items-center gap-1">
        {/* Currency symbol with pulse */}
        <motion.div
          className="text-sm text-gray-400 mr-1"
          animate={isActive ? { opacity: [0.7, 1, 0.7] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {currency}
        </motion.div>

        {/* Ticker digits with individual animations */}
        <div className="flex">
          {tickerDigits.map((digit, index) => {
            const isDecimalPoint = digit === '.';
            const isChangingDigit = index >= tickerDigits.length - 3; // Last 3 digits change most
            
            return (
              <motion.span
                key={`${index}-${digit}`}
                className={`${getDigitColor(isChangingDigit)} ${
                  isDecimalPoint ? 'mx-0.5' : ''
                }`}
                initial={{ y: isChangingDigit ? -10 : 0, opacity: 0.8 }}
                animate={{ 
                  y: 0, 
                  opacity: 1,
                  scale: isChangingDigit ? [1, 1.1, 1] : 1
                }}
                transition={{ 
                  duration: 0.3, 
                  delay: index * 0.02,
                  ease: "easeOut" 
                }}
              >
                {digit}
              </motion.span>
            );
          })}
        </div>

        {/* Live indicator */}
        {isActive && (
          <motion.div 
            className="ml-2 flex items-center gap-1"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
            <span className="text-xs text-green-400 font-sans">LIVE</span>
          </motion.div>
        )}
      </div>

      {/* Micro sparkle effect for increases */}
      <AnimatePresence>
        {isActive && isIncreasing && (
          <motion.div
            className="absolute -top-1 -right-2 text-green-400"
            initial={{ opacity: 0, scale: 0, rotate: -30 }}
            animate={{ 
              opacity: [0, 1, 0], 
              scale: [0, 1, 0],
              y: [-5, -15, -20],
              rotate: [0, 180, 360]
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          >
            <Zap className="w-3 h-3" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}