import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { X, Tv, Loader2,Sparkles } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';

// Ensure the AdService import is correct
import { AdService, AdResult } from '@/services/adService'; // <-- Import AdResult type

interface VideoAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdCompleted: () => void;
}

export default function VideoAdModal({ isOpen, onClose, onAdCompleted }: VideoAdModalProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  
  // Keep the rewardGranted ref, but adjust the logic below
  const rewardGranted = useRef(false);

  useEffect(() => {
    if (!isOpen) return;

    const showAd = async () => {
      setIsLoading(true);
      
      try {
        // Use the improved AdService method
        const result: AdResult = await AdService.showInterstitial(false); 
        
        setIsLoading(false);
        
        if (result.completed) {
          // If the interstitial ad was successfully dismissed (completed)
          rewardGranted.current = true;
          handleAdCompleted();
        } else {
          // Ad failed to load or show, or was closed prematurely (if possible)
          console.log('Ad not completed:', result);
          toast.error(t('Ad failed to load or complete. Please try again.'));
          onClose(); // Close the modal if ad failed
        }
      } catch (error) {
        // Fallback catch for unexpected errors
        console.error('Unexpected error during AdService.showInterstitial:', error);
        setIsLoading(false);
        toast.error(t('An unexpected error occurred while loading the ad.'));
        onClose(); 
      }
    };

    showAd();
    
    // Cleanup function to run when the component unmounts or before the next effect
    return () => {
        // Important: If the component closes before the ad finishes, you might need
        // a way to abort the underlying native ad call, but for AdMob, listeners
        // handle resolution, and the modal closing usually means the user navigated away.
    };
  }, [isOpen, onClose, onAdCompleted, t]);

  const handleAdCompleted = ( ) => {
    onAdCompleted();
    onClose(); // Close the modal after the action is complete
  };

  const handleCancel = () => {
    // This button will only be visible if you decide to add UI elements.
    // Given the current flow, the modal should close automatically after the ad logic finishes.
    toast.warning(t('You must complete the ad to continue.'));
    onClose();
  };

  if (!isOpen) return null;

  return (
    // Your modal UI needs to be here. 
    // Since the ad is shown natively, this UI is mainly a backdrop/loading screen.
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
        <div className={`p-8 rounded-lg shadow-2xl text-center max-w-sm ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
            <div className="flex justify-center items-center mb-4">
                <Tv className="w-10 h-10 text-blue-500 animate-pulse" />
            </div>

            <h3 className="text-xl font-bold mb-2">
                {t('Loading Video Advertisement')}
            </h3>
            
            {isLoading && (
                <>
                    <Loader2 className="w-6 h-6 mx-auto my-4 animate-spin text-blue-400" />
                    <p className="text-sm text-gray-400">
                        {t('Please wait while the native ad loads...')}
                    </p>
                </>
            )}

            {!isLoading && (
                <>
                    <p className="text-sm text-gray-400">
                        {t('Ad loaded. If it did not show automatically, an issue occurred.')}
                    </p>
                    <Button onClick={onClose} variant="ghost" className="mt-4 text-red-500">
                        <X className="w-4 h-4 mr-2" />
                        {t('Close')}
                    </Button>
                </>
            )}
        </div>
    </div>
  );
}