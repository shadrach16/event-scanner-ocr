import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';
import {
  AdMob,
  AdMobRewardItem,
  RewardAdOptions,
  InterstitialAdPluginEvents,
  PluginListenerHandle, // <-- Import the listener type
} from '@capacitor-community/admob';

// --- (Other constants and types remain the same) ---
const PRODUCTION_APP_ID = 'ca-app-pub-3840102724542989~9114794148';
const PRODUCTION_INTERSTITIAL_AD_ID = 'ca-app-pub-3840102724542989/3755270570';
const TEST_INTERSTITIAL_AD_ID = 'ca-app-pub-3940256099942544/1033173712';

// --- (AdConfig, AdResult, AdReward types remain the same) ---
export interface AdResult {
    success: boolean;
    completed: boolean;
    reward?: AdMobRewardItem;
}

// --- Ad Service Class ---
class AdService {
    private static isInitialized = false;
    private static admobPlugin: any = null;
    private static areListenersAdded = false;

    // ... (isNative and initialize methods remain the same) ...
    static isNative(): boolean {
        try {
            return Capacitor.isNativePlatform();
        } catch (error) {
            return false;
        }
    }

    static async initialize(): Promise<boolean> {
        try {
            if (this.isInitialized) return true;

            if (this.isNative()) {
                this.admobPlugin = AdMob;

                await this.admobPlugin.initialize({
                    appId: PRODUCTION_APP_ID,
                });

                console.log('AdMob initialized successfully.');
                // We will handle specific dismissal listeners inside showNativeInterstitial
                // Keeping the global listeners for general tracking is fine but not strictly required for resolution logic
            } else {
                console.log('AdMob not available, using web simulation');
            }

            this.isInitialized = true;
            return true;
        } catch (error) {
            console.error('AdMob initialization failed:', error);
            this.isInitialized = true;
            return false;
        }
    }
    // ... (trackAdInteraction and addInterstitialListeners methods can be kept as is, but addInterstitialListeners is now optional for the resolution logic) ...

    static async showInterstitial(testMode: boolean = true): Promise<AdResult> {
        try {
            await this.initialize();

            if (this.isNative() && this.admobPlugin) {
                return await this.showNativeInterstitial(testMode);
            } else {
                return await this.simulateInterstitial();
            }
        } catch (error) {
            console.error('Interstitial ad failed:', error);
            toast.error('Failed to load advertisement.');
            return { success: false, completed: false };
        }
    }

    private static async showNativeInterstitial(testMode: boolean): Promise<AdResult> {
        if (!this.admobPlugin) return { success: false, completed: false };

        const adUnitId = testMode ? TEST_INTERSTITIAL_AD_ID : PRODUCTION_INTERSTITIAL_AD_ID;
        console.log(`Loading ${testMode ? 'TEST' : 'PRODUCTION'} interstitial ad: ${adUnitId}`);
        const prepareOptions: RewardAdOptions = { adId: adUnitId };

        // We load the ad outside of the Promise block to ensure it's ready before waiting.
        try {
            await this.admobPlugin.prepareInterstitial(prepareOptions);
            console.log(`${testMode ? 'TEST' : 'PRODUCTION'} interstitial ad prepared successfully`);
            toast.info(`${testMode ? 'Test ad' : 'Ad'} loaded. Showing now...`);
        } catch (loadError) {
            console.error('Ad load failed:', loadError);
            toast.error('Failed to load ad. Try again shortly.');
            return { success: false, completed: false };
        }


        return new Promise<AdResult>(async (resolve) => {
            let dismissedListener: PluginListenerHandle | null = null;
            let failedToShowListener: PluginListenerHandle | null = null;
            
            // 1. Define the cleanup function
            const cleanup = () => {
                dismissedListener?.remove();
                failedToShowListener?.remove();
            };

            // 2. Set up temporary listeners
            dismissedListener = this.admobPlugin.addListener(
                InterstitialAdPluginEvents.Dismissed,
                () => {
                    console.log('INTERSTITIAL AD: Dismissed by user');
                    cleanup(); // Crucial: Remove listeners right away
                    resolve({
                        success: true,
                        completed: true // Interstitials are generally 'completed' when dismissed
                    });
                }
            );

            failedToShowListener = this.admobPlugin.addListener(
                InterstitialAdPluginEvents.FailedToShow,
                (error: any) => {
                    console.error('INTERSTITIAL AD: FailedToShow', error);
                    cleanup(); // Crucial: Remove listeners right away
                    toast.error('Ad Show Failed.');
                    resolve({
                        success: false,
                        completed: false
                    });
                }
            );
            
            // 3. Show the ad
            try {
                await this.admobPlugin.showInterstitial();
                console.log(`${testMode ? 'TEST' : 'PRODUCTION'} interstitial ad show called`);
                
                // IMPORTANT: We do *not* resolve here. We wait for the Dismissed listener to fire.
                // The Promise will only resolve when the ad is dismissed or fails to show.
            } catch (showError) {
                console.error('Ad show failed immediately:', showError);
                cleanup();
                resolve({
                    success: false,
                    completed: false
                });
            }

            // Optional Safety Timeout (Only use if you suspect event dropping issues)
            // setTimeout(() => {
            //     cleanup();
            //     resolve({ success: false, completed: false });
            //     console.warn('Ad show timed out. Assuming failure.');
            // }, 15000); // 15 seconds is a safe maximum wait time for an ad to finish.
        });
    }

    private static async simulateInterstitial(): Promise<AdResult> {
        return new Promise((resolve) => {
            toast.info('🎬 Loading TEST interstitial ad (Web Simulation)...');
            setTimeout(() => {
                toast.success('🎉 TEST ad completed! (Simulated)');
                resolve({ success: true, completed: true });
            }, 3000);
        });
    }
}

export { AdService };