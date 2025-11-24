import React from 'react';
import { X, Crown, Check, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '../contexts/ThemeContext';
// Import the new hook
import { usePremium } from '../hooks/usePremium';
import { toast } from 'sonner';

// Import the type for explicit typing
import { PurchasesPackage } from '@revenuecat/purchases-capacitor'; 


interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchase: (plan: 'monthly' | 'lifetime') => void; 
}


export default function PremiumModal({ isOpen, onClose, onPurchase }: PremiumModalProps) {
  const { isDark } = useTheme();

  // --- Use the RevenueCat hook ---
  const {
    storeReady,
    isProcessingProductId,
    packages,
    handlePurchase: purchaseProduct, 
    handleRestorePurchases,
  } = usePremium();

  // Find the required packages from the RevenueCat offerings.
  // CRITICAL: Ensure these product identifiers match your RevenueCat setup!
  const monthlyPackage = packages.find(p => p.product.identifier.includes('monthly'));
  const lifetimePackage = packages.find(p => p.product.identifier.includes('lifetime'));

  // Determine the overall loading state
  const isLoading = !storeReady;
  // A modal is ready only when the store is ready AND both packages are found
  const isReady = !isLoading && monthlyPackage && lifetimePackage;


  // --- Purchase Handler ---
  const handlePurchase = async (pkg: PurchasesPackage) => {
    const productId = pkg.product.identifier;
    
    // Determine the plan type for the external onPurchase prop
    const planType: 'monthly' | 'lifetime' = productId.includes('monthly') ? 'monthly' : 'lifetime';

    // The purchaseProduct function from the hook handles the full flow
    const result = await purchaseProduct(productId);

    if (result.success) {
      // Call the external prop to notify the parent component
      onPurchase(planType); 
      // Close the modal
      onClose();
    }
  };

  // --- Restore Handler ---
  const handleRestore = async () => {
    // The hook handles the processing state and success/error toasts
    const success = await handleRestorePurchases();
    if (success) {
      onClose();
    }
  };

  if (!isOpen) return null;


  return (
    <div className="fixed inset-0 bg-black/95 flex flex-col z-50 transition-opacity duration-300">

      {/* Close Button at Top Right */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 z-50 rounded-full bg-gray-700/50 hover:bg-gray-700 text-white transition-colors shadow-lg"
      >
        <X className="h-6 w-6" />
      </button>

      <div className="flex-grow flex flex-col items-center justify-center text-white p-6 relative">

        {/* Main Icon and Header */}
        <div className="text-center mb-8 mt-12">
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl">
            <Crown className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">
            Go Pro: Unlock Full AI
          </h2>
          <p className="text-sm text-gray-300 mt-2">
            Supercharge your workflow and remove all ads.
          </p>
        </div>

        {/* Premium Features List (Preserved) */}
        <div className="w-full max-w-sm space-y-3 mb-10 text-left">
          {[
            'Unlimited, lightning-fast AI event processing',
            'Completely Ad-Free experience, forever',
            'Full batch processing capabilities',
            'Advanced calendar data synchronization',
          ].map((feature, index) => (
            <div key={index} className="flex items-center space-x-3 bg-white/10 p-3 rounded-lg">
              <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-100">
                {feature}
              </span>
            </div>
          ))}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
            <span className="ml-3 text-gray-300">
              Fetching prices...
            </span>
          </div>
        )}

        {/* Payment Options */}
        {isReady && (
          <div className="w-full max-w-sm space-y-4">

            {/* Lifetime Option (Best Value) */}
            <Button
              // Use the package object for the click handler
              onClick={() => handlePurchase(lifetimePackage!)}
              disabled={!!isProcessingProductId}
              className={`w-full h-16 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white text-xl font-extrabold rounded-xl shadow-2xl transition-all relative ${
                isProcessingProductId === lifetimePackage!.product.identifier ? 'opacity-70' : ''
              }`}
            >
              {isProcessingProductId === lifetimePackage!.product.identifier ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-3" />
                  Processing Purchase...
                </>
              ) : (
                <>
                  {/* Use RevenueCat's formatted price string */}
                  Lifetime Access: {lifetimePackage!.product.priceString} 
                  <span className="absolute top-[-10px] right-[-10px] bg-yellow-500 text-gray-900 text-xs font-bold px-3 py-1 rounded-full shadow-md transform rotate-3">
                    BEST VALUE
                  </span>
                </>
              )}
            </Button>

            {/* Monthly Option */}
            <Button
              onClick={() => handlePurchase(monthlyPackage!)}
              disabled={!!isProcessingProductId}
              variant="outline"
              className={`w-full h-14 bg-transparent border-2 border-purple-500 text-purple-400 text-md font-bold rounded-xl hover:bg-purple-900/30 ${
                isProcessingProductId === monthlyPackage!.product.identifier ? 'opacity-70' : ''
              }`}
            >
              {/* Use RevenueCat's formatted price string */}
              Monthly Subscription: {monthlyPackage!.product.priceString} / month 
            </Button>

          </div>
        )}

        {/* Payment Options - Not Ready State (e.g., config error) */}
        {storeReady && (!monthlyPackage || !lifetimePackage) && (
             <div className="w-full max-w-sm text-center text-gray-400 py-10">
                 <AlertCircle className="h-6 w-6 mx-auto text-red-500 mb-2" />
                 <p>Could not load all subscription plans. Please ensure your device has a working app store connection and check your RevenueCat configuration.</p>
             </div>
        )}


        {/* Footer Links and Restore */}
        <div className="w-full max-w-sm mt-6 text-center text-gray-400">
          <button
            onClick={handleRestore}
            disabled={isLoading || !!isProcessingProductId} 
            className="text-sm underline hover:text-white transition-colors"
          >
            {isProcessingProductId === 'restore' ? (
                <Loader2 className="h-4 w-4 inline-block animate-spin mr-2" />
            ) : null}
            Restore Previous Purchases
          </button>

        </div>
      </div>
    </div>
  );
}