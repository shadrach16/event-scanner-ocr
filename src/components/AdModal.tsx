import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Zap, Clock } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

// Capacitor Imports
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Toast } from '@capacitor/toast';
import { App } from '@capacitor/app';

interface AdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdCompleted: () => void;
}

declare global {
  interface Window {
    AdMob?: any;
  }
}

export default function AdModal({ isOpen, onClose, onAdCompleted }: AdModalProps) {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const [countdown, setCountdown] = useState(5);
  const [isAdLoading, setIsAdLoading] = useState(true);
  const [adError, setAdError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCountdown(5);
      setIsAdLoading(true);
      setAdError(false);
      initializeAd();
      
      // Native-only app-level event listeners
      if (Capacitor.isNativePlatform()) {
        // Handle the native back button to close the modal
        const listener = App.addListener('backButton', () => {
          onClose();
        });

        // Clean up listener when the modal closes
        return () => {
          listener.remove();
        };
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, countdown]);

  const initializeAd = async () => {
    try {
      if (Capacitor.isNativePlatform() && window.AdMob) {
        await loadCapacitorAd();
      } else {
        // Web fallback - simulate ad loading
        setTimeout(() => {
          setIsAdLoading(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Ad initialization failed:', error);
      setAdError(true);
      setIsAdLoading(false);
    }
  };

  const loadCapacitorAd = async () => {
    try {
      await window.AdMob.initialize({
        requestTrackingAuthorization: true,
        testingDevices: ['YOUR_DEVICE_ID'],
        initializeForTesting: true
      });
      const adOptions = {
        adId: 'ca-app-pub-3940256099942544/1033173712',
        isTesting: true
      };
      await window.AdMob.prepareInterstitial(adOptions);
      await window.AdMob.showInterstitial();
      setIsAdLoading(false);
      window.AdMob.addListener('onAdFailedToLoad', async (error: any) => {
        console.error('Ad failed to load:', error);
        await Toast.show({ text: t('adModal.adLoadError') });
        setAdError(true);
        setIsAdLoading(false);
      });
      window.AdMob.addListener('onAdClosed', () => handleAdComplete());
    } catch (error) {
      console.error('Capacitor AdMob error:', error);
      setAdError(true);
      setIsAdLoading(false);
    }
  };

  const handleAdComplete = () => {
    onAdCompleted();
    onClose();
  };

  const handleSkip = () => {
    if (countdown === 0) {
      Haptics.impact({ style: ImpactStyle.Medium });
      handleAdComplete();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm">
      <div className={`h-full w-full flex flex-col ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
          <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('adModal.title')}
          </h2>
          <button onClick={onClose} className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {isAdLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className={`w-16 h-16 mx-auto border-4 border-t-transparent rounded-full animate-spin mb-6 ${isDark ? 'border-blue-400' : 'border-blue-500'}`}></div>
                <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {t('adModal.loadingTitle')}
                </h3>
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {t('adModal.loadingSubtitle')}
                </p>
              </div>
            </div>
          ) : adError ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-md">
                <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 ${isDark ? 'bg-red-900/20' : 'bg-red-50'}`}>
                  <Zap className={`h-12 w-12 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
                </div>
                <h3 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {t('adModal.errorTitle')}
                </h3>
                <p className={`text-lg mb-8 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {t('adModal.errorMessage')}
                </p>
                <Button onClick={handleAdComplete} size="lg" className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg py-4">
                  {t('adModal.continueToApp')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              {/* Ad Content Area */}
              <div className="flex-1 flex items-center justify-center p-8">
                <div className={`w-full max-w-2xl border-4 border-dashed rounded-2xl p-12 text-center ${isDark ? 'border-gray-600 bg-gray-800/50' : 'border-gray-300 bg-gray-50'}`}>
                  <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center mb-8 ${isDark ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
                    <Zap className={`h-16 w-16 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
                  </div>
                  <h3 className={`text-3xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {t('adModal.advertisement')}
                  </h3>
                  <p className={`text-xl mb-8 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {t('adModal.adDisplay')}
                  </p>
                  <div className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {t('adModal.thankYou')}
                  </div>
                </div>
              </div>

              {/* Bottom Controls */}
              <div className={`p-6 border-t ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
                <div className="max-w-2xl mx-auto">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Clock className={`h-6 w-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                      <span className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {countdown > 0 ? t('adModal.skipIn', { countdown }) : t('adModal.skipNow')}
                      </span>
                    </div>
                    <Button
                      onClick={handleSkip}
                      disabled={countdown > 0}
                      size="lg"
                      variant={countdown === 0 ? "default" : "outline"}
                      className={`px-8 py-3 text-lg ${countdown === 0 ? "bg-blue-600 hover:bg-blue-700 text-white" : isDark ? "border-gray-600 text-gray-400" : "border-gray-300 text-gray-500"}`}
                    >
                      {countdown > 0 ? t('adModal.wait', { countdown }) : t('adModal.continue')}
                    </Button>
                  </div>
                  <div className={`text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {t('adModal.footerNotice')}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}