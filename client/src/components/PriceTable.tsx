import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";

interface CryptoPrice {
  id: string;
  symbol: string;
  name: string;
  price: string;
  change1h?: string;
  change24h?: string;
  change7d?: string;
  marketCap?: string;
  volume24h?: string;
  logoUrl?: string;
}

export default function PriceTable() {
  const { data: prices = [], isLoading } = useQuery({
    queryKey: ["/api/crypto-prices"],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const formatPrice = (price: string) => {
    const num = parseFloat(price);
    if (num >= 1) {
      return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$${num.toFixed(6)}`;
  };

  const formatMarketCap = (marketCap: string) => {
    const num = parseFloat(marketCap);
    if (num >= 1e12) {
      return `$${(num / 1e12).toFixed(2)}T`;
    }
    if (num >= 1e9) {
      return `$${(num / 1e9).toFixed(2)}B`;
    }
    if (num >= 1e6) {
      return `$${(num / 1e6).toFixed(2)}M`;
    }
    return `$${num.toLocaleString()}`;
  };

  const formatPercentage = (change: string) => {
    const num = parseFloat(change);
    const isPositive = num >= 0;
    return (
      <span className={isPositive ? "text-cmc-green" : "text-cmc-red"}>
        {isPositive ? "+" : ""}{num.toFixed(2)}%
      </span>
    );
  };

  if (isLoading) {
    return (
      <Card className="bg-white rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-8 text-center">
          <div className="text-gray-500" data-testid="text-loading-prices">Loading cryptocurrency prices...</div>
        </div>
      </Card>
    );
  }

  if (prices.length === 0) {
    return (
      <Card className="bg-white rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-8 text-center">
          <div className="text-gray-500" data-testid="text-no-prices">No price data available</div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-2xl overflow-hidden shadow-2xl" data-testid="card-price-table">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 border-b border-gray-200">
              <TableHead className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</TableHead>
              <TableHead className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</TableHead>
              <TableHead className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</TableHead>
              <TableHead className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">1h %</TableHead>
              <TableHead className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">24h %</TableHead>
              <TableHead className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">7d %</TableHead>
              <TableHead className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Market Cap</TableHead>
              <TableHead className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Volume(24h)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-white divide-y divide-gray-200">
            {prices.slice(0, 10).map((crypto: CryptoPrice, index: number) => (
              <TableRow key={crypto.id} className="hover:bg-gray-50 transition-colors" data-testid={`row-crypto-${crypto.symbol}`}>
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {index + 1}
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {crypto.logoUrl ? (
                      <img 
                        className="h-8 w-8 rounded-full mr-3" 
                        src={crypto.logoUrl} 
                        alt={`${crypto.name} logo`}
                        data-testid={`img-logo-${crypto.symbol}`}
                      />
                    ) : (
                      <div className="h-8 w-8 bg-gray-200 rounded-full mr-3 flex items-center justify-center">
                        <span className="text-xs font-bold text-gray-500">{crypto.symbol.slice(0, 2)}</span>
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-medium text-gray-900" data-testid={`text-name-${crypto.symbol}`}>
                        {crypto.name}
                      </div>
                      <div className="text-sm text-gray-500" data-testid={`text-symbol-${crypto.symbol}`}>
                        {crypto.symbol}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900" data-testid={`text-price-${crypto.symbol}`}>
                  {formatPrice(crypto.price)}
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-right text-sm" data-testid={`text-change1h-${crypto.symbol}`}>
                  {crypto.change1h ? formatPercentage(crypto.change1h) : <span className="text-gray-400">—</span>}
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-right text-sm" data-testid={`text-change24h-${crypto.symbol}`}>
                  {crypto.change24h ? formatPercentage(crypto.change24h) : <span className="text-gray-400">—</span>}
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-right text-sm" data-testid={`text-change7d-${crypto.symbol}`}>
                  {crypto.change7d ? formatPercentage(crypto.change7d) : <span className="text-gray-400">—</span>}
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900" data-testid={`text-marketcap-${crypto.symbol}`}>
                  {crypto.marketCap ? formatMarketCap(crypto.marketCap) : <span className="text-gray-400">—</span>}
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900" data-testid={`text-volume-${crypto.symbol}`}>
                  {crypto.volume24h ? formatMarketCap(crypto.volume24h) : <span className="text-gray-400">—</span>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
