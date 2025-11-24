import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  RotateCcw, // Used for restoring purchases
  Globe,
  Calendar,
  Bell,
  Heart,
  Info,
  Mail,
  ChevronRight,
  Crown,
  RefreshCw 
} from 'lucide-react';
import { StorageService } from '../services/storageService';
import { UserSettings } from '../types/event';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'sonner';
import PremiumModal from '../components/PremiumModal';
import VideoAdModal from '../components/VideoAdModal';
// Import the new hook
import { usePremium } from '../hooks/usePremium';

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English', flag: '🇺🇸' },
  { value: 'es', label: 'Español', flag: '🇪🇸' },
  { value: 'fr', label: 'Français', flag: '🇫🇷' },
  { value: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { value: 'it', label: 'Italiano', flag: '🇮🇹' },
  { value: 'pt', label: 'Português', flag: '🇵🇹' },
  { value: 'ru', label: 'Русский', flag: '🇷🇺' },
  { value: 'ja', label: '日本語', flag: '🇯🇵' },
  { value: 'ko', label: '한국어', flag: '🇰🇷' },
  { value: 'zh', label: '中文', flag: '🇨🇳' },
  { value: 'ar', label: 'العربية', flag: '🇸🇦' },
  { value: 'ar-eg', label: 'العربية (مصر)', flag: '🇪🇬' }
];

export default function Settings() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showVideoAdModal, setShowVideoAdModal] = useState(false);
  
  // Destructure variables from the new usePremium hook
  const {
    isPro, // New state name for premium status
    storeReady, // New state for checking if products are loaded
    isProcessingProductId, // New state for active purchase/restore operation
    handleRestorePurchases, // New function to trigger restore
  } = usePremium();

  const [settings, setSettings] = useState<UserSettings>({
    defaultCalendar: 'Personal',
    defaultReminder: 15,
    language: 'en',
    isPremium: false
  });

  useEffect(() => {
    const savedSettings = StorageService.getSettings();
    setSettings({
      ...savedSettings,
      // Sync local settings status with the hook's real-time status
      isPremium: isPro 
    });
    
    // Set the language on component mount
    if (savedSettings.language) {
      i18n.changeLanguage(savedSettings.language);
    }
    // Dependency on isPro ensures the UI updates when the user's status changes
  }, [i18n, isPro]);

  const handleSettingChange = (key: keyof UserSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    StorageService.saveSettings(newSettings);
    
    if (key === 'language') {
      i18n.changeLanguage(value);
      toast.success(t('settings.settingsUpdated', 'Settings updated successfully!'));
    } else {
      toast.success(t('settings.settingsUpdated', 'Settings updated successfully!'));
    }
  };

  const handleGoPremium = () => {
    setShowPremiumModal(true);
  };

  // The modal handles the purchase itself; this callback updates local storage/state
  const handlePremiumPurchase = (purchasedPlan: 'monthly' | 'lifetime') => {
    // Note: The isPro status will be set by the hook's listener shortly after purchase.
    // We update local storage immediately for a fast UI update.
    const newSettings = { ...settings, isPremium: true };
    setSettings(newSettings);
    StorageService.saveSettings(newSettings);
    toast.success(`🎉 Premium ${purchasedPlan} plan activated!`);
  };

  // NEW: Handler for restoring purchases
  const handleRestore = useCallback(async () => {
    if (!storeReady) {
      toast.info(t('settings.storeNotReady', 'Please wait for the store to initialize.'));
      return;
    }
    
    // handleRestorePurchases manages the processing state and toasts
    await handleRestorePurchases();
    // useEffect will pick up the status change from isPro
  }, [storeReady, handleRestorePurchases]);

  const handleSupportUs = () => {
    setShowVideoAdModal(true);
  };

  const handleVideoAdCompleted = () => {
    toast.success('🎉 Thank you for supporting Photo2Calendar!');
  };

  const getCurrentLanguage = () => {
    return LANGUAGE_OPTIONS.find(lang => lang.value === settings.language) || LANGUAGE_OPTIONS[0];
  };

  const handleContactUs = () => {
    const subject = encodeURIComponent('Photo2Calendar Support');
    const body = encodeURIComponent('Hi Photo2Calendar team,\n\nI need help with:\n\n');
    window.open(`mailto:support@photo2calendar.com?subject=${subject}&body=${body}`, '_blank');
  };

  const handleAboutApp = () => {
    toast.info('Photo2Calendar v1.0.0\nTransform your photos into calendar events with AI');
  };

  // NEW: Simplified status text since plan/expiryDate are not exposed by the new hook
  const formatStatusText = (isPremium: boolean) => {
    if (!storeReady) {
      return t('settings.loadingStoreStatus', 'Checking store status...');
    }
    return isPremium
        ? t('settings.unlimitedProcessing', 'Unlimited processing & Ad-free.')
        : t('settings.limitedProcessing', 'Limited processing (Ad-supported)');
  }


  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`flex items-center justify-between p-4 ${
        isDark ? 'bg-gray-900' : 'bg-white'
      }`}>
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate('/')} 
            className={`p-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className={`text-xl font-medium ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>{t('settings.title')}</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4">
        {/* User Status - Free/Premium */}
        <div className={`flex items-center justify-between py-4 border-b ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              // Use isPro
              isPro 
                ? 'bg-gradient-to-br from-yellow-400 to-orange-500' 
                : isDark ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              {/* Use isPro */}
              {isPro ? (
                <Crown className="h-4 w-4 text-white" />
              ) : (
                <Calendar className="h-4 w-4 text-gray-600" />
              )}
            </div>
            <div>
              <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {/* Use isPro */}
                {isPro ? t('settings.premiumUser', 'Premium User') : t('settings.freeUser', 'Free User')}
              </h3>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {/* Use the new status formatter */}
                {formatStatusText(isPro)}
              </p>
            </div>
          </div>
          {/* Use isPro */}
          {!isPro && (
            <Button
              onClick={handleGoPremium}
              size="sm"
              // Disable button if store is still loading or processing
              disabled={!storeReady || !!isProcessingProductId}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              <Crown className="mr-2 h-4 w-4" />
              {/* Display loading state if store isn't ready */}
              {!storeReady ? t('settings.loading', 'Loading...') : t('settings.goPremium')}
            </Button>
          )}
        </div>

        {/* Settings List */}
        <div className="py-2">
          {/* Language */}
          <div className={`flex items-center justify-between py-4 border-b ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="flex items-center space-x-3">
              <Globe className="h-5 w-5 text-blue-500" />
              <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {t('settings.language')}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Select 
                value={settings.language} 
                onValueChange={(value) => handleSettingChange('language', value)}
              >
                <SelectTrigger className={`w-32 h-8 text-sm border-none shadow-none ${
                  isDark ? 'bg-transparent text-gray-300' : 'bg-transparent text-gray-600'
                }`}>
                  <SelectValue>
                    <div className="flex items-center space-x-1">
                      <span className="text-sm">{getCurrentLanguage().flag}</span>
                      <span>{getCurrentLanguage().label}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGE_OPTIONS.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      <div className="flex items-center space-x-2">
                        <span>{lang.flag}</span>
                        <span>{lang.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <ChevronRight className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-400'}`} />
            </div>
          </div>

          {/* Default Calendar */}
          <div className={`flex items-center justify-between py-4 border-b ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-green-500" />
              <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {t('settings.defaultCalendar')}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Select 
                value={settings.defaultCalendar} 
                onValueChange={(value) => handleSettingChange('defaultCalendar', value)}
              >
                <SelectTrigger className={`w-24 h-8 text-sm border-none shadow-none ${
                  isDark ? 'bg-transparent text-gray-300' : 'bg-transparent text-gray-600'
                }`}>
                  <SelectValue>
                    {t(`settings.calendars.${settings.defaultCalendar.toLowerCase()}`)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Personal">{t('settings.calendars.personal')}</SelectItem>
                  <SelectItem value="Work">{t('settings.calendars.work')}</SelectItem>
                  <SelectItem value="Family">{t('settings.calendars.family')}</SelectItem>
                  <SelectItem value="Other">{t('settings.calendars.other')}</SelectItem>
                </SelectContent>
              </Select>
              <ChevronRight className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-400'}`} />
            </div>
          </div>

          {/* Default Reminder */}
          <div className={`flex items-center justify-between py-4 border-b ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="flex items-center space-x-3">
              <Bell className="h-5 w-5 text-orange-500" />
              <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {t('settings.defaultReminder')}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Select 
                value={settings.defaultReminder.toString()} 
                onValueChange={(value) => handleSettingChange('defaultReminder', parseInt(value))}
              >
                <SelectTrigger className={`w-16 h-8 text-sm border-none shadow-none ${
                  isDark ? 'bg-transparent text-gray-300' : 'bg-transparent text-gray-600'
                }`}>
                  <SelectValue>
                    {settings.defaultReminder === 0 ? t('settings.reminders.none') :
                     settings.defaultReminder === 5 ? t('settings.reminders.5m') :
                     settings.defaultReminder === 15 ? t('settings.reminders.15m') :
                     settings.defaultReminder === 30 ? t('settings.reminders.30m') :
                     settings.defaultReminder === 60 ? t('settings.reminders.1h') :
                     settings.defaultReminder === 1440 ? t('settings.reminders.1d') : 
                     `${settings.defaultReminder}m`}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">{t('settings.reminders.none')}</SelectItem>
                  <SelectItem value="5">{t('settings.reminders.5m')}</SelectItem>
                  <SelectItem value="15">{t('settings.reminders.15m')}</SelectItem>
                  <SelectItem value="30">{t('settings.reminders.30m')}</SelectItem>
                  <SelectItem value="60">{t('settings.reminders.1h')}</SelectItem>
                  <SelectItem value="1440">{t('settings.reminders.1d')}</SelectItem>
                </SelectContent>
              </Select>
              <ChevronRight className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-400'}`} />
            </div>
          </div>
        </div>

        {/* Support & Info Section */}
        <div className="mt-6">
          <h2 className={`text-sm font-medium uppercase tracking-wide mb-4 ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`}>{t('settings.supportInfo')}</h2>
 


          {/* Support Us (Watch Ad) */}
          <button
            onClick={handleSupportUs}
            className={`flex items-center justify-between w-full py-4 border-b ${
              isDark ? 'border-gray-700' : 'border-gray-200'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Heart className="h-5 w-5 text-red-500" />
              <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {t('settings.supportUs')}
              </span>
            </div>
            <ChevronRight className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-400'}`} />
          </button>

          {/* About App */}
          <button
            onClick={handleAboutApp}
            className={`flex items-center justify-between w-full py-4 border-b ${
              isDark ? 'border-gray-700' : 'border-gray-200'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Info className="h-5 w-5 text-purple-500" />
              <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {t('settings.aboutApp')}
              </span>
            </div>
            <ChevronRight className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-400'}`} />
          </button>

          {/* Contact Us */}
          <button
            onClick={handleContactUs}
            className={`flex items-center justify-between w-full py-4`}
          >
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-blue-500" />
              <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {t('settings.contactUs')}
              </span>
            </div>
            <ChevronRight className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-400'}`} />
          </button>
        </div>
      </div>

      {/* Modals */}
      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        onPurchase={handlePremiumPurchase} // This callback is simplified
      />

      <VideoAdModal
        isOpen={showVideoAdModal}
        onClose={() => setShowVideoAdModal(false)}
        onAdCompleted={handleVideoAdCompleted}
      />
    </div>
  );
}