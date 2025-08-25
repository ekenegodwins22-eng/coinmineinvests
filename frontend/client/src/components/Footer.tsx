import { Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-cmc-card border-t border-gray-700 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-2 text-cmc-gray">
            <span>© 2024 CryptoMine Pro. All rights reserved.</span>
          </div>
          
          <div className="flex items-center space-x-1 text-cmc-gray text-sm">
            <span>Made with</span>
            <Heart className="w-4 h-4 text-red-500 fill-current" />
            <span>for crypto miners worldwide</span>
          </div>
          
          <div className="flex items-center space-x-6 text-sm text-cmc-gray">
            <a href="#privacy" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#terms" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#support" className="hover:text-white transition-colors">Support</a>
          </div>
        </div>
      </div>
    </footer>
  );
}