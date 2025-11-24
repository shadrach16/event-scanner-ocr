// hooks/usePremium.ts

import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';

// Import RevenueCat
import {
    Purchases,
    LOG_LEVEL,
    type PurchasesPackage,
    type CustomerInfo 
} from '@revenuecat/purchases-capacitor';

// CRITICAL: Define the Entitlement ID used in RevenueCat configuration
const PREMIUM_ENTITLEMENT_ID = 'premium'; 


// --- Entitlement Checker (Helper Function) ---
const checkPremiumAccess = (customerInfo: CustomerInfo): boolean => {
    // Checks for the active 'premium' entitlement.
    return customerInfo?.customerInfo?.entitlements?.active[PREMIUM_ENTITLEMENT_ID]?.isActive || false;
};


// --- Main Hook ---
export function usePremium() {
    const [storeReady, setStoreReady] = useState(false);
    const [packages, setPackages] = useState<PurchasesPackage[]>([]);
    const [isProcessingProductId, setIsProcessingProductId] = useState<string | null>(null);
    const storeInitialized = useRef(false);

    // State to hold premium status locally
    const [isPro, setIsPro] = useState(false);


    // --- Store Setup Function ---
    const initializeRevenueCat = useCallback(async () => {
        if (storeInitialized.current) {
            console.log("[RC] Already initialized.");
            return;
        }
        storeInitialized.current = true;

        if (!Capacitor.isNativePlatform()) {
            console.warn("[RC] RevenueCat purchases only available on native platforms.");
            setStoreReady(true);
            return;
        }

        try {
            await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });

            // Initialize RevenueCat anonymously (no appUserID provided)
            await Purchases.configure({ 
                apiKey: import.meta.env.VITE_REVENUECAT_API_KEY
            });

            console.log("[RC] Configured successfully (anonymous user)");

            // Add listener to update local premium status whenever customer info changes (e.g., expiry)
            Purchases.addCustomerInfoUpdateListener((customerInfo) => {
                const newStatus = checkPremiumAccess(customerInfo);
                setIsPro(newStatus);
                console.log("[RC] CustomerInfo updated, isPro:", newStatus);
            });
            
            // 1. Initial check of premium status
            const initialCustomerInfo = await Purchases.getCustomerInfo();
            setIsPro(checkPremiumAccess(initialCustomerInfo));


            // 2. Load products ("Offerings" in RevenueCat)
            console.log("[RC] Fetching offerings...");
            const offerings = await Purchases.getOfferings();

            if (offerings.current) {
                // Assuming all packages in the current offering are the ones for the paywall
                setPackages(offerings.current.availablePackages); 
                setStoreReady(true);
            } else {
                console.warn("[RC] No current offering found.");
                toast.error("No premium products could be loaded at this time.");
                setStoreReady(true);
            }
        } catch (error: any) {
            console.error("[RC] Setup failed:", error);
            toast.error(`Store setup failed: ${error.message || 'Unknown error'}`);
            setStoreReady(true);
            storeInitialized.current = false;
        }
    }, []);

    // --- Initialize on mount ---
    useEffect(() => {
        initializeRevenueCat();
    }, [initializeRevenueCat]);


    // --- Purchase Handler ---
    const handlePurchase = useCallback(async (productId: string) => {
        if (!storeReady) {
            toast.error("Store is not ready, please wait.");
            return { success: false, productIdentifier: null };
        }

        if (isProcessingProductId) {
            toast.info("Another purchase is processing.");
            return { success: false, productIdentifier: null };
        }

        const packToBuy = packages.find(p => p.product.identifier === productId);

        if (!packToBuy) {
            toast.error(`Product "${productId}" not found.`);
            console.warn("RC Package not found for product ID:", productId);
            return { success: false, productIdentifier: null };
        }

        console.log(`[RC] Initiating purchase for ${productId}...`);
        setIsProcessingProductId(productId);

        try {
            const { customerInfo, productIdentifier } = await Purchases.purchasePackage({
                aPackage: packToBuy,
            });

            console.log("[RC] Purchase successful:", productIdentifier);
            toast.success("Purchase successful! Premium access granted.");
            
            // Update local state immediately based on returned info
            setIsPro(checkPremiumAccess(customerInfo)); 
            
            return { success: true, productIdentifier };

        } catch (err: any) {
            if (err.userCancelled) {
                console.log("[RC] Purchase cancelled by user.");
                toast.info("Purchase cancelled.");
            } else {
                console.error(`[RC] Purchase failed for ${productId}:`, err);
                toast.error(`Purchase failed: ${err.message || 'Store error'}`);
            }
            return { success: false, productIdentifier: null };
        } finally {
            setIsProcessingProductId(null);
        }
    }, [storeReady, isProcessingProductId, packages]);

    // --- Restore Purchases Handler ---
    const handleRestorePurchases = useCallback(async () => {
        if (!storeReady) {
            toast.error("Store is not ready, please wait.");
            return false;
        }
        
        // Use 'restore' as a generic indicator for the UI loading state
        setIsProcessingProductId('restore'); 

        try {
            console.log("[RC] Restoring purchases...");
            const customerInfo = await Purchases.restorePurchases();

            const hasPremium = checkPremiumAccess(customerInfo);

            if (hasPremium) {
                console.log("[RC] Active premium entitlement found.");
                toast.success('Premium access restored!', {
                    description: 'Your subscription is now active.'
                });
                setIsPro(true); // Update local state
                return true;
            } else {
                console.log("[RC] No active premium entitlement found to restore.");
                toast.info('No active premium purchases found to restore.');
                return false;
            }
        } catch (error: any) {
            console.error('[RC] Restore purchases error:', error);
            toast.error('Failed to restore purchases');
            return false;
        } finally {
            if (isProcessingProductId === 'restore') {
                setIsProcessingProductId(null);
            }
        }
    }, [storeReady, isProcessingProductId]);


    return {
        storeReady,
        isProcessingProductId,
        handlePurchase,
        handleRestorePurchases,
        isPro, 
        packages,
    };
}