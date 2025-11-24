import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Menu, Camera, Image, FileText, Type, CheckCircle, Home, History, Calendar, 
  Plus, ChevronDown, ChevronRight, Sparkles, Zap, Shield, Star, Moon, Sun, 
  AlertCircle, Smartphone 
} from 'lucide-react';
// Assuming other services and components are correctly imported
import { AIService } from '../services/aiService';
import { DeviceService } from '../services/deviceService';
import { StorageService } from '../services/storageService';
import { CalendarService } from '../services/calendarService';
import { UserSettings } from '../types/event';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'sonner';
import PermissionModal from '../components/PermissionModal';
import {StudioStepper} from '../components/StudioStepper';
import EventsHistory from './EventsHistory';
import { AdService } from '@/services/adService';

export default function Index() {
 const { t, i18n } = useTranslation();
 const navigate = useNavigate();
 const { theme, toggleTheme, isDark } = useTheme();
 const [isProcessing, setIsProcessing] = useState(false);
 const [showAdModal, setShowAdModal] = useState(false);
 const [showPermissionModal, setShowPermissionModal] = useState(false);
 const [permissionType, setPermissionType] = useState<'calendar' | 'camera' | 'storage'>('calendar');
 const [textInput, setTextInput] = useState('');
 const [selectedFile, setSelectedFile] = useState<File | null>(null);
 const [selectedText, setSelectedText] = useState<string>('');
 const [activeTab, setActiveTab] = useState('photo');
 const [currentView, setCurrentView] = useState<'home' | 'history'>('home');
 const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
 const [settings, setSettings] = useState<UserSettings>({
  defaultCalendar: 'Personal',
  defaultReminder: 15,
  language: 'en',
  isPremium: false
 });
 const [hasApiKey, setHasApiKey] = useState(false);
 const [deviceInfo, setDeviceInfo] = useState<any>(null);
 const [calendarInfo, setCalendarInfo] = useState<any>(null);
 const [eventData, setEventData] = useState<any>(null);
 const [isAIComplete, setIsAIComplete] = useState(false); 

  // --- HOOKS ---
 useEffect(() => {
  const savedSettings = StorageService.getSettings();
  setSettings(savedSettings);
  if (savedSettings.language && savedSettings.language !== i18n.language) {
   i18n.changeLanguage(savedSettings.language);
  }

  const apiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY||localStorage.getItem('google-ai-api-key') ;
  setHasApiKey(!!apiKey && apiKey !== 'your-api-key-here');
  DeviceService.getDeviceInfo().then(setDeviceInfo);
  setCalendarInfo(CalendarService.getCalendarInfo());
  CalendarService.requestCalendarPermission()
 }, [i18n]);

 useEffect(() => {
  if (isAIComplete && showAdModal === false && eventData) {
   console.log('Both AI processing and Ad viewing complete. Navigating...');
   navigate('/review', eventData);
   setIsProcessing(false); 
   setEventData(null);
   setIsAIComplete(false);
   setSelectedFile(null);
   setSelectedText('');
   setTextInput('');
  } else if (isAIComplete && showAdModal === false && !eventData) {
   setIsProcessing(false);
   setIsAIComplete(false);
  }
 }, [isAIComplete, showAdModal, eventData, navigate]);

  // --- PERMISSION & AI LOGIC ---

 const checkCalendarPermission = async () => {
  try {
   const hasPermission = await CalendarService.checkCalendarPermission();
   if (!hasPermission) {
    setPermissionType('calendar');
    setShowPermissionModal(true);
    return false;
   }
   return true;
  } catch (error) {
   console.error('Calendar permission check failed:', error);
   return true;
  }
 };

 const processWithAI = async (requiresAd: boolean): Promise<boolean>  =>  {
  if (!hasApiKey) {
   toast.error('Please configure your Google AI API key in Settings first.');
   navigate('/settings');
   setIsProcessing(false);
   return;
  }

  if (!selectedFile && !selectedText) {
    toast.error('No content selected to process.');
    setIsProcessing(false);
    return;
  }
  
  let error: Error | null = null;
  
  try {
   let events;
   const startTime = Date.now();
   
   if (selectedFile) {
    if (selectedFile.type.startsWith('image/')) {
     events = await AIService.extractEventsFromImage(selectedFile);
    } else {
     toast.error('Currently only image files are supported for AI processing.');
     error = new Error('Unsupported file type.');
     throw error;
    }
   } else if (selectedText) {
    events = await AIService.extractEventsFromText(selectedText);
   } else {
    error = new Error('No content to process');
    throw error;
   }

   const processingTime = Date.now() - startTime;

   if (events.length === 0) {
    toast.error('No events found in the provided content. Please try with different content.');
    error = new Error('No events found.');
    throw error;
   }

   const userData = StorageService.getUserData();
   StorageService.saveUserData({
    ...userData,
    totalEventsProcessed: userData.totalEventsProcessed + events.length,
    totalImagesProcessed: selectedFile ? userData.totalImagesProcessed + 1 : userData.totalImagesProcessed,
    totalTextProcessed: selectedText ? userData.totalTextProcessed + 1 : userData.totalTextProcessed,
    lastUsed: new Date().toISOString()
   });
   
   const navigationState = { 
     state: { 
      events, 
      source: selectedFile ? 'image' : 'text',
      processingTime 
     } 
   };

   if (requiresAd) {
      console.log('check1',JSON.stringify(navigationState) )
      return navigationState;
   } else {
    // Premium user: Navigate directly
      navigate('/review', navigationState);
      setIsProcessing(false);
      setSelectedFile(null);
      setSelectedText('');
      setTextInput('');
      return true; 
   }
    
  } catch (e) {
   error = e instanceof Error ? e : new Error('Failed to process content. Please check your API key and try again.');
   console.error('Processing error:', error);
   toast.error(error.message);
     setEventData(null);
    return false; 
   
  } finally {
   if (error  && requiresAd) {
     setIsProcessing(false); 
   }
  }
 };


// --- MODIFIED: handleContinue (Synchronization Logic) ---

 const handleContinue = async () => {
 
  const requiresAd = !settings.isPremium;
  setIsProcessing(true); // Show processing modal immediately
  
  const aiPromise = processWithAI(requiresAd); // AI starts running in background
   
  if (!requiresAd) {
      // Premium flow is handled by processWithAI internally
      return;
  }
   
  // NON-PREMIUM USER FLOW:
  
  // 1. Start AD and AI processing concurrently
  const adPromise = AdService.showInterstitial(false);
  
  // 2. Wait for BOTH promises to resolve
  const [navState, adResult] = await Promise.all([aiPromise, adPromise]); // 💡 CAPTURE DATA HERE
  
  // 3. Update states based on AD completion and AI completion
  const adWasCompleted = adResult && adResult.success && adResult.completed;

  // 4. Handle navigation and final cleanup
  if (adWasCompleted) {
      const reward = adResult.reward || { type: 'support', amount: 1 } as any;
      handleAdCompleted(reward);
      
      // Navigate only if the AI analysis was successful (navState contains the data object)
      if (navState) { // navState will be the navigationState object or false on failure
          // AI finished successfully AND AD finished: Navigate immediately
          navigate('/review', navState); // Use the captured data
          setIsProcessing(false); 
          setSelectedFile(null);
          setSelectedText('');
          setTextInput('');
      } else {
          // AI failed: Stop processing spinner and show final message
          setIsProcessing(false);
          toast.error('AI processing failed during ad viewing. Please try again.');
      }
      
  } else {
      // AD was skipped/failed/closed: Stop processing spinner and notify user
      setIsProcessing(false);
      toast.info('Ad not completed or no reward granted.');
  }
 };
 


  // --- HANDLERS ---

 const handleFileSelection = async (source: 'camera' | 'gallery' | 'file') => {
  try {
   let file: File | null = null;
   
   if (source === 'camera') {
    const hasPermission = await DeviceService.requestCameraPermission();
    if (!hasPermission) {
     setPermissionType('camera');
     setShowPermissionModal(true);
     return;
    }
   }
   
   switch (source) {
    case 'camera':
     file = await DeviceService.takePhoto();
     break;
    case 'gallery':
     file = await DeviceService.selectFromGallery();
     break;
    case 'file':
     file = await DeviceService.selectFromFiles();
     break;
   }

   if (file) {
    setSelectedFile(file);
        toast.success(`Selected: ${file.name}`);
    if (DeviceService.isNative()) {
     DeviceService.vibrate(50);
    }
   }
  } catch (error) {
   console.error('File selection error:', error);
   if (error instanceof Error) {
    toast.error(error.message);
   } else {
    toast.error(`Failed to ${source === 'camera' ? 'take photo' : 'select file'}. Please try again.`);
   }
  }
 };


 const handleTextSubmit = () => {
  if (!textInput.trim()) {
   toast.error('Please enter some text to analyze.');
   return;
  }
   
  setSelectedText(textInput);
  toast.success('Text ready for processing');
   
  if (DeviceService.isNative()) {
   DeviceService.vibrate(50);
  }
 };



 const handleAdCompleted = () => {
  console.log('Ad completed. Signaling AI check.');
 };

 const handlePermissionGranted = async () => {
  setShowPermissionModal(false);
   
  const granted = await CalendarService.requestCalendarPermission();

  if (granted) {
   if (selectedFile || selectedText) {
    handleContinue();
  }
  } else {
    toast.error(t('calendarPermissionDenied')); 
  }
 };

 const clearSelection = () => {
  setSelectedFile(null);
  setSelectedText('');
  setTextInput('');
 };

 const handleMenuClick = () => {
  navigate('/settings');
 };

 const handleViewChange = (view: 'home' | 'history') => {
  setCurrentView(view);
 };

 const handleQuickCamera = async () => {
  await handleFileSelection('camera');
 };

  // --- RENDER ---

 if (isProcessing) {
  return (
   <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${
    isDark 
     ? 'bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900' 
     : 'bg-gradient-to-br from-blue-50 to-indigo-100'
   }`}>
    <div className="text-center space-y-6 max-w-sm">
     <div className="relative">
      <div className={`w-16 h-16 mx-auto border-4 border-t-transparent rounded-full animate-spin ${
       isDark ? 'border-purple-400' : 'border-blue-500'
      }`}></div>
      <Sparkles className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 ${
       isDark ? 'text-purple-400' : 'text-blue-500'
      }`} />
     </div>
     <div className="space-y-2">
      <h2 className={`text-xl font-medium ${
       isDark ? 'text-white' : 'text-gray-900'
      }`}>
       {t('processing.analyzing')}
      </h2>
      <p className={`text-sm ${
       isDark ? 'text-gray-300' : 'text-gray-600'
      }`}>
       {t('processing.pleaseWait')}
      </p>
     </div>


   {!settings.isPremium &&   <div className={`p-4 rounded-lg text-center ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
      <p className="text-sm font-medium">{t('adModal.adDisplay')}</p>
      <p className="text-xs mt-1">
       {t('adModal.thankYou')} 💝
      </p>
     </div>}

    </div>

   

   </div>
  );
 }

 if (currentView === 'history') {
  return <EventsHistory onViewChange={handleViewChange} />;
 }

 return (
  <div className={`min-h-screen transition-colors duration-300 ${
   isDark 
    ? 'bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900' 
    : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
  }`}>
   {/* Header */}
   <div className={`flex items-center justify-between py-4 px-3 border-b backdrop-blur-sm transition-colors duration-300 ${
    isDark 
     ? 'border-gray-700 bg-gray-800/80' 
     : 'border-gray-100 bg-white/80'
   }`}>
    <div className="flex items-center space-x-3">
     <button 
      onClick={handleMenuClick} 
      className={`p-2 rounded-lg transition-colors ${
       isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
      }`}
     >
      <Menu className="h-6 w-6" />
     </button>
     <h1 className={`text-xl font-medium  px-2 rounded-xl 
 bg-gradient-to-r from-green-500 to-emerald-800 border-green-600 text-white 
     `}>{t('app.title')}</h1>
      
    </div>
    <div className="flex items-center space-x-2">
     {!hasApiKey && (
      <button
       onClick={() => navigate('/settings')}
       className={`p-2 rounded-lg transition-colors ${
        isDark ? 'text-yellow-400 hover:bg-gray-700' : 'text-orange-500 hover:bg-gray-100'
       }`}
       title="Configure API Key"
      >
       <AlertCircle className="h-5 w-5" />
      </button>
     )}
     <button
      onClick={toggleTheme}
      className={`p-2 rounded-lg transition-colors ${
       isDark ? 'hover:bg-gray-700 text-yellow-400' : 'hover:bg-gray-100 text-gray-600'
      }`}
     >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
     </button>
    </div>
   </div>

   {/* API Key Warning */}
   {!hasApiKey && (
    <div className={`mx-4 mt-4 p-3 rounded-lg border-2 border-dashed ${
     isDark 
      ? 'bg-yellow-900/20 border-yellow-600 text-yellow-200' 
      : 'bg-yellow-50 border-yellow-300 text-yellow-800'
    }`}>
     <div className="flex items-center space-x-2">
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      <div className="text-sm">
       <span className="font-medium">API Key Required:</span> Configure your Google AI API key in Settings to enable AI processing.
       <button
        onClick={() => navigate('/settings')}
        className="ml-2 underline hover:no-underline"
       >
        Go to Settings
       </button>
      </div>
     </div>
    </div>
   )}


   {/* Content */}
   <div className="max-w-md mx-auto px-4  pt-3 space-y-5">
    {/* Main Card with Yellow Background */}
    <div className={`backdrop-blur-sm border-2 rounded-3xl p-4 transition-all ${
     isDark 
      ? 'bg-yellow-900/30 border-yellow-700/50' 
      : 'bg-yellow-50 border-yellow-200'
    }`}>
     <div className="flex items-start space-x-3">
     
      <div className="flex-1">
       <h2 className={`text-xs font-bold tracking-wider mb-1 ${
        isDark ? 'text-yellow-200' : 'text-yellow-800'
       }`}>{t('home.whyHelpful')}</h2>
       <p className={`text-sm ${
        isDark ? 'text-yellow-100' : 'text-yellow-900'
       }`}>
        { t('home.helpfulDescription')}
       </p>
      </div>
     </div>
    </div>

<StudioStepper activeState={selectedFile ? 'processing':'upload'} />

 {/* How it works section */}
    <Collapsible open={isHowItWorksOpen} onOpenChange={setIsHowItWorksOpen}>
     <CollapsibleTrigger asChild>
      <div className={`    py-2 cursor-pointer flex items-center justify-between transition-all   backdrop-blur-sm border rounded-2xl mt-2 p-3 shadow-sm ${
       isDark 
        ? 'bg-gray-800/90 border-gray-700' 
        : 'bg-white/90 border-gray-200'
      }`}>
       <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
         <Zap className="h-4 w-4 text-white" />
        </div>
        <h3 className={`text-sm font-medium ${
         isDark ? 'text-white' : 'text-gray-900'
        }`}>
         {t('home.howItWorks')} 
        </h3>
       </div>
       <ChevronDown className={`h-4 w-4 transition-transform ${
        isDark ? 'text-gray-400' : 'text-gray-600'
       } ${isHowItWorksOpen ? 'rotate-180' : ''}`} />
      </div>
     </CollapsibleTrigger>
     <CollapsibleContent>
      <div className={`backdrop-blur-sm border rounded-2xl mt-2 p-4 shadow-sm ${
       isDark 
        ? 'bg-gray-800/90 border-gray-700' 
        : 'bg-white/90 border-gray-200'
      }`}>
       <div className={`space-y-3 text-sm ${
        isDark ? 'text-gray-300' : 'text-gray-700'
       }`}>
        <div className="flex items-start space-x-3">
         <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5">1</div>
         <p>{ t('home.step1')}</p>
        </div>
        <div className="flex items-start space-x-3">
         <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5">2</div>
         <p>{t('home.step2')}</p>
        </div>
        <div className="flex items-start space-x-3">
         <div className="w-6 h-6 bg-gradient-to-br from-pink-500 to-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5">3</div>
         <p>{t('home.step3')}</p>
        </div>
        <div className="flex items-start space-x-3">
         <div className="w-6 h-6 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5">4</div>
         <p>{t('home.step4')}</p>
        </div>
       </div>
      </div>
     </CollapsibleContent>
    </Collapsible>



   

    {/* Enhanced Tabs with Silver Border */}
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
     <TabsList className={`grid w-full grid-cols-2 mb-6 backdrop-blur-sm p-2 rounded-2xl h-16 border-2 ${
      isDark ? 'bg-gray-800/90 border-gray-500' : 'bg-white/90 border-gray-300'
     }`}>
      <TabsTrigger 
       value="photo" 
       className={`text-base font-semibold rounded-xl transition-all h-12 px-6 ${
        isDark 
         ? 'data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-700/50' 
         : 'data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-100/50'
       }`}
      >
       <Image className="mr-3 h-5 w-5" />
       {t('home.photo')}
      </TabsTrigger>
      <TabsTrigger 
       value="text" 
       className={`text-base font-semibold rounded-xl transition-all h-12 px-6 ${
        isDark 
         ? 'data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-700/50' 
         : 'data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-100/50'
       }`}
      >
       <Type className="mr-3 h-5 w-5" />
       {t('home.text')}
      </TabsTrigger>
     </TabsList>

     <TabsContent value="photo" className="space-y-3">
      {!selectedFile ? (
       <>
        <Button
         onClick={() => handleFileSelection('gallery')}
         variant="outline"
         className={`w-full h-14 justify-start border transition-all rounded-xl ${
          isDark 
           ? 'border-gray-600 hover:border-blue-400 hover:bg-blue-900/20 bg-gray-800/50' 
           : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
         }`}
        >
         <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${
          isDark ? 'bg-gray-700' : 'bg-gray-100'
         }`}>
          <Image className={`h-4 w-4 ${isDark ? 'text-white' : 'text-gray-700'}`} />
         </div>
         <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
          { t('home.selectFromGallery')}
         </span>
        </Button>

        <Button
         onClick={() => handleFileSelection('camera')}
         variant="outline"
         className={`w-full h-14 justify-start border transition-all rounded-xl ${
          isDark 
           ? 'border-gray-600 hover:border-purple-400 hover:bg-purple-900/20 bg-gray-800/50' 
           : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
         }`}
        >
         <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${
          isDark ? 'bg-gray-700' : 'bg-gray-100'
         }`}>
          <Camera className={`h-4 w-4 ${isDark ? 'text-white' : 'text-gray-700'}`} />
         </div>
         <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
          { t('home.takePhoto')}
         </span>
        </Button>

        <Button
         onClick={() => handleFileSelection('file')}
         variant="outline"
         className={`w-full h-14 justify-start border transition-all rounded-xl ${
          isDark 
           ? 'border-gray-600 hover:border-orange-400 hover:bg-orange-900/20 bg-gray-800/50' 
           : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50'
         }`}
        >
         <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${
          isDark ? 'bg-gray-700' : 'bg-gray-100'
         }`}>
          <FileText className={`h-4 w-4 ${isDark ? 'text-white' : 'text-gray-700'}`} />
         </div>
         <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
          { t('home.selectFromFiles')}
         </span>
        </Button>
       </>
      ) : (
       <div className="space-y-4">
        <div className={`border-2 rounded-xl p-4 flex items-center space-x-3 ${
         isDark 
          ? 'bg-green-900/20 border-green-600' 
          : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
        }`}>
         <div className="w-6 h-6 p-1 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
          <CheckCircle className="h-4 w-4 text-white" />
         </div>
         <div className="flex-1">
          <p className={`font-semibold text-sm ${
           isDark ? 'text-green-300' : 'text-green-800'
          }`}>{t('home.fileSelected')}</p>
          <p className={`text-xs truncate w-[80%] ${
           isDark ? 'text-green-400' : 'text-green-600'
          }`}>{selectedFile.name.slice(0,50)}...</p>
         </div>
        </div>
         
        <div className="flex space-x-3">
         <Button
          onClick={clearSelection}
          variant="outline"
          className={`flex-1 h-12 rounded-xl border ${
           isDark 
            ? 'border-gray-600 hover:bg-gray-700 text-white' 
            : 'border-gray-200 hover:bg-gray-50'
          }`}
         >
          {t('buttons.change')}
         </Button>
         <Button
          onClick={handleContinue}
          disabled={!hasApiKey}
          className="flex-1 h-12 bg-blue-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
         >
          { t('buttons.continue')}
          <ChevronRight className="mr-2 h-4 w-4" />
         </Button>
        </div>
       </div>
      )}
     </TabsContent>

     <TabsContent value="text" className="space-y-4">
      {!selectedText ? (
       <>
        <Textarea
         placeholder={ t('home.textPlaceholder')}
         value={textInput}
         onChange={(e) => setTextInput(e.target.value)}
         rows={6}
         className={`resize-none border rounded-xl backdrop-blur-sm transition-colors ${
          isDark 
           ? 'border-gray-600 focus:border-purple-400 bg-gray-800/80 text-white placeholder-gray-400' 
           : 'border-gray-200 focus:border-purple-500 bg-white/80'
         }`}
        />
        <Button
         onClick={handleTextSubmit}
         className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
         disabled={!textInput.trim()}
        >
         <Type className="mr-2 h-4 w-4" />
         {t('buttons.processText')}
        </Button>
       </>
      ) : (
       <div className="space-y-4">
        <div className={`border-2 rounded-xl p-4 ${
         isDark 
          ? 'bg-green-900/20 border-green-600' 
          : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
        }`}>
         <div className="flex items-center space-x-3 mb-2">
          <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
           <CheckCircle className="h-4 w-4 text-white" />
          </div>
          <p className={`font-semibold text-sm ${
           isDark ? 'text-green-300' : 'text-green-800'
          }`}>{t('home.textReady')}</p>
         </div>
         <div className={`backdrop-blur-sm rounded-lg p-3 max-h-24 overflow-y-auto border ${
          isDark 
           ? 'bg-gray-800/80 border-gray-600 text-gray-200' 
           : 'bg-white/80 border text-gray-700'
         }`}>
          <p className="text-xs">{selectedText}</p>
         </div>
        </div>
         
        <div className="flex space-x-3">
         <Button
          onClick={clearSelection}
          variant="outline"
          className={`flex-1 h-12 rounded-xl border ${
           isDark 
            ? 'border-gray-600 hover:bg-gray-700 text-white' 
            : 'border-gray-200 hover:bg-gray-50'
          }`}
         >
          {t('buttons.change')}
         </Button>
         <Button
          onClick={handleContinue}
          disabled={!hasApiKey}
          className="flex-1 h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
         >
          { t('buttons.continue')}
          <ChevronRight className="mr-2 h-4 w-4" />
         </Button>
        </div>
       </div>
      )}
     </TabsContent>
    </Tabs>

    {/* Free tier message */}
 {!settings.isPremium && (
          <div className="text-center pt-4">
            <div className={`p-4 rounded-xl border-2 border-dashed ${isDark ? 'bg-amber-900/20 border-amber-600 text-amber-200' : 'bg-amber-50 border-amber-300 text-amber-800'}`}>
              <p className="text-sm font-semibold">{t('home.adNotice')}</p>
              <button onClick={() => navigate('/settings')} className={`font-bold underline transition-colors text-sm mt-1 ${isDark ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'}`}>
                {t('home.buyCoffee')}
              </button>
            </div>
          </div>
        )}
   </div>

   {/* Bottom Navigation */}
   <div className={`fixed bottom-0 left-0 right-0 backdrop-blur-sm border-t transition-colors duration-300 ${
    isDark 
     ? 'bg-gray-800/90 border-gray-700' 
     : 'bg-white/90 border-gray-200'
   }`}>
    <div className="max-w-md mx-auto px-4 py-2">
     <div className="flex items-center justify-around">
      <button
       onClick={() => handleViewChange('home')}
       className={`flex flex-col items-center space-y-1 p-3 rounded-xl transition-all ${
        currentView === 'home'
         ? isDark 
          ? 'bg-purple-900/50 text-purple-300' 
          : 'bg-gradient-to-br from-blue-50 to-purple-50 text-blue-600'
         : isDark 
          ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
       }`}
      >
       <Home className="h-5 w-5" />
       <span className="text-xs font-medium">{t('navigation.events')}</span>
      </button>
       
      <button
       onClick={() => handleViewChange('history')}
       className={`flex flex-col items-center space-y-1 p-3 rounded-xl transition-all ${
        currentView === 'history'
         ? isDark 
          ? 'bg-purple-900/50 text-purple-300' 
          : 'bg-gradient-to-br from-blue-50 to-purple-50 text-blue-600'
         : isDark 
          ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
       }`}
      >
       <History className="h-5 w-5" />
       <span className="text-xs font-medium">{t('navigation.history')}</span>
      </button>
     </div>
    </div>
   </div>

   {/* Floating Camera Button - Enhanced for Native */}
   <button 
    onClick={handleQuickCamera}
    className={`fixed bottom-20 right-4 w-16 h-16 rounded-full shadow-xl hover:shadow-2xl flex items-center justify-center transition-all transform hover:scale-105 
    bg-black hover:bg-gray-800
    `}
    title={ 'Take Photo'}
   >
    <Camera className="h-7 w-7 text-white" />
    
   </button>

  


   <PermissionModal
    isOpen={showPermissionModal}
    onClose={() => setShowPermissionModal(false)}
    onGrantPermission={handlePermissionGranted}
    permissionType={permissionType}
   />
  </div>
 );
}