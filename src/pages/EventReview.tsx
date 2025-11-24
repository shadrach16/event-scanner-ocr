import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowLeft, Calendar, Clock, MapPin, FileText, Trash2, Plus, Loader2, Check, Bell } from 'lucide-react';
import { CalendarEvent, UserSettings } from '../types/event';
import { CalendarService } from '../services/calendarService';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'sonner';
import {StudioStepper} from '../components/StudioStepper';

export default function EventReview() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useTheme();
  
  // --- State Declarations ---
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [editingEvent, setEditingEvent] = useState<string | null>(null);
  const [isAddingToCalendar, setIsAddingToCalendar] = useState(false);
  const [openAccordions, setOpenAccordions] = useState<string[]>([]);
  const [settings, setSettings] = useState<UserSettings>({
    defaultCalendar: t('settings.calendars.personal'),
    defaultReminder: 15,
    language: 'en',
    isPremium: false
  });

  // --- Effects ---
  useEffect(() => {
    const stateEvents = location.state?.events;
    if (stateEvents && Array.isArray(stateEvents)) {
      setEvents(stateEvents);
      // setOpenAccordions(stateEvents.length > 0 ? [stateEvents[0].id] : []); 
    } else {
      navigate('/');
    }
    const savedSettings = localStorage.getItem('photo2calendar-settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, [location.state, navigate]);

  // --- Event Handlers ---
  const handleEventUpdate = (eventId: string, field: keyof CalendarEvent, value: string | boolean) => {
    setEvents(prevEvents =>
      prevEvents.map(event =>
        event.id === eventId ? { ...event, [field]: value } : event
      )
    );
  };

  const handleDeleteEvent = (eventId: string) => {
    setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
    setOpenAccordions(prev => prev.filter(id => id !== eventId));
    toast.success(t('eventDeleted') || 'Event deleted.');
  };

  const handleAddToCalendar = async () => {
    if (events.length === 0) {
      toast.error(t('noEventsToAdd') || 'No events to add.');
      return;
    }
   
      setIsAddingToCalendar(true);
    try {
      const success = await CalendarService.addMultipleToCalendar(events);
      
      if (success) {
        // Update history (assuming StorageService manages history well)
        const existingHistory = JSON.parse(localStorage.getItem('photo2calendar-history') || '[]');
        const updatedHistory = [...existingHistory, ...events];
        localStorage.setItem('photo2calendar-history', JSON.stringify(updatedHistory));

        toast.success(t('messages.eventsAddedSuccess') || 'Events successfully added to calendar!', { duration: 2500 });
        
        setTimeout(() => {
          navigate('/');
        }, 1500);
      } else {
        toast.error(t('review.failedToAddEvents') || 'Failed to add events.');
      }
    } catch (error) {
      console.error('Error adding events to calendar:', error);
      toast.error(t('calendarIntegrationFailed') || 'Calendar integration failed.');
    } finally {
      setIsAddingToCalendar(false);
    }
 
  
  };

  const formatEventSummary = (event: CalendarEvent) => {
    const parts = [];
    if (event.startDate) {
      const date = new Date(event.startDate);
      // Use the settings language for localization
      parts.push(date.toLocaleDateString(settings.language, { month: 'short', day: 'numeric', year: 'numeric' }));
    }
    if (event.startTime) parts.push(`${t('review.at')} ${event.startTime}`);
    if (event.location) parts.push(`• ${event.location}`);
    return parts.join(' ').slice(0,35)+'...';
  };
  
  // Helper to format reminder text
  const formatReminder = (reminder: number) => {
    if (reminder === 0) return t('settings.reminders.none');
    if (reminder === 5) return t('settings.reminders.5m');
    if (reminder === 15) return t('settings.reminders.15m');
    if (reminder === 30) return t('settings.reminders.30m');
    if (reminder === 60) return t('settings.reminders.1h');
    if (reminder === 1440) return t('settings.reminders.1d');
    return `${reminder} ${t('review.minutesBefore')}`;
  };


  // --- JSX RENDER: EMPTY STATE ---
  if (events.length === 0) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className={`text-center p-8 rounded-xl shadow-2xl max-w-sm ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <Calendar className={`h-16 w-16 mx-auto mb-4 ${isDark ? 'text-purple-400' : 'text-blue-500'}`} />
          <h2 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('review.noEventsTitle') || 'No events found'}</h2>
          <p className={`mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('review.noEventsSub') || 'Return home to try processing new content.'}</p>
          <Button onClick={() => navigate('/')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg mt-2">
            <ArrowLeft className="h-4 w-4 mr-2" /> {t('buttons.backToHome') || 'Back to Home'}
          </Button>
        </div>
      </div>
    );
  }

  // --- MAIN RENDER ---
  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      
      {/* Header (Sticky and Professional) */}
      <div className={`border-b backdrop-blur-sm sticky top-0 z-20 shadow-sm ${
        isDark ? 'bg-gray-800/95 border-gray-700' : 'bg-white/95 border-gray-200'
      }`}>
        <div className="max-w-2xl mx-auto flex items-center justify-between py-4 px-3">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/')}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('review.title') || 'Review Events'}</h1>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('review.subtitle') || 'Adjust details before saving'}</p>
            </div>
          </div>
          <span className={`text-sm px-3 py-1 font-semibold rounded-full ${
            isDark ? 'text-white bg-purple-600' : 'text-white bg-blue-500'
          }`}>
            {t('review.countLabel', { count: events.length })}
          </span>
        </div>
      </div>

<StudioStepper activeState={ 'results'} />

      {/* Events Accordion (Editing Area) */}
      <div className="max-w-2xl mx-auto p-4  ">
        


        <Accordion 
          type="multiple" 
          value={openAccordions}
          onValueChange={setOpenAccordions}
          className="space-y-4"
        >
          {events.map((event, index) => (
            <AccordionItem 
              key={event.id} 
              value={event.id}
              className={`border-2 rounded-xl shadow-sm transition-all duration-300 overflow-scroll ${
                isDark ? 'bg-gray-800 border-gray-700 hover:border-purple-500' : 'bg-white border-gray-300 hover:border-blue-400'
              }`}
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center justify-between w-full mr-4">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                      isDark ? 'bg-purple-600 text-white' : 'bg-blue-500 text-white'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="text-left truncate w-[100%] ">
                      <h3 className={`font-bold text-base truncate w-[98%] ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {event.title?.slice(0,40) || t('review.untitledEvent') || 'Untitled Event'}...
                      </h3>
                      <p className={`text-sm font-medium truncate max-w-[95vw] ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {formatEventSummary(event)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteEvent(event.id);
                    }}
                    className={`p-2 rounded-full transition-colors flex-shrink-0 ${
                      isDark ? 'text-gray-500 hover:text-red-400 hover:bg-gray-700' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                    }`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </AccordionTrigger>
              
              {/* Event Edit Content */}
              <AccordionContent className="px-4 pb-10 border-t border-dashed" style={{ borderColor: isDark ? '#4a5568' : '#e2e8f0' }}>
                <div className="space-y-5 pt-3 overflow-scroll">
                  
                  {/* Title */}
                  <div className="space-y-1">
                    <label className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('review.eventTitle')}</label>
                    <Input
                      value={event.title}
                      onChange={(e) => handleEventUpdate(event.id, 'title', e.target.value)}
                      placeholder={t('review.titlePlaceholder')}
                      className={`font-semibold ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                    />
                  </div>

                  {/* Date, Start Time, End Time */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1 col-span-3 sm:col-span-1">
                      <label className={`flex items-center text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        <Calendar className="mr-1 h-4 w-4 text-purple-500" /> {t('review.date')}
                      </label>
                      <Input
                        type="date"
                        value={event.startDate || event.endDate || ''}
                        onChange={(e) => handleEventUpdate(event.id, 'startDate', e.target.value)}
                        className={isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}
                      />
                    </div>
                 

                  </div>

                   <div className="grid grid-cols-2 gap-4">
                    
                    <div className="space-y-1  ">
                      <label className={`flex items-center text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        <Clock className="mr-1 h-4 w-4 text-teal-500" /> {t('review.start')}
                      </label>
                      <Input type="time" value={event.startTime || ''} onChange={(e) => handleEventUpdate(event.id, 'startTime', e.target.value)} className={isDark ? 'bg-gray-700 border-gray-600 text-white' : ''} />
                    </div>
                    
                    <div className="space-y-1 ">
                      <label className={`flex items-center  text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        <Clock className="mr-1 h-4 w-4 text-teal-500" /> {t('review.end')}</label>
                      <Input type="time" value={event.endTime || ''} onChange={(e) => handleEventUpdate(event.id, 'endTime', e.target.value)} className={isDark ? 'bg-gray-700 border-gray-600 text-white' : ''} />
                    </div>
                    </div>


                  {/* Location and Calendar */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className={`flex items-center text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        <MapPin className="mr-1 h-4 w-4 text-red-500" /> {t('review.location')}
                      </label>
                      <Input value={event.location || ''} onChange={(e) => handleEventUpdate(event.id, 'location', e.target.value)} placeholder={t('review.locationPlaceholder')} className={isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : ''} />
                    </div>

                    <div className="space-y-1">
                      <label className={`flex items-center text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                         <Bell className="mr-1 h-4 w-4 text-orange-500" /> {t('review.reminder')}
                      </label>
                      <Select
                        value={event.reminder.toString() || settings.defaultReminder.toString()}
                        onValueChange={(value) => handleEventUpdate(event.id, 'reminder', parseInt(value, 10))}
                      >
                        <SelectTrigger className={isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}>
                          <SelectValue placeholder={t('review.selectReminder')} />
                        </SelectTrigger>
                        <SelectContent className={isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'}>
                          <SelectItem value="0">{t('settings.reminders.none')}</SelectItem>
                          <SelectItem value="5">{t('settings.reminders.5m')}</SelectItem>
                          <SelectItem value="15">{t('settings.reminders.15m')}</SelectItem>
                          <SelectItem value="30">{t('settings.reminders.30m')}</SelectItem>
                          <SelectItem value="60">{t('settings.reminders.1h')}</SelectItem>
                          <SelectItem value="1440">{t('settings.reminders.1d')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Calendar Selection (Full Width) */}
                  <div className="space-y-1">
                    <label className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('review.calendar')}</label>
                    <Select
                      value={event.calendar || settings.defaultCalendar}
                      onValueChange={(value) => handleEventUpdate(event.id, 'calendar', value)}
                    >
                      <SelectTrigger className={isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}>
                        <SelectValue placeholder={t('review.selectCalendar')} />
                      </SelectTrigger>
                      <SelectContent className={isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'}>
                        <SelectItem value="Personal">{t('settings.calendars.personal')}</SelectItem>
                        <SelectItem value="Work">{t('settings.calendars.work')}</SelectItem>
                        <SelectItem value="Family">{t('settings.calendars.family')}</SelectItem>
                        <SelectItem value="Other">{t('settings.calendars.other')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>


                  {/* Description */}
                  <div className="space-y-1 pb-10">
                    <label className={`flex items-center text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      <FileText className="mr-1 h-4 w-4 text-yellow-500" /> {t('review.description')}
                    </label>
                    <Textarea
                      value={event.description || ''}
                      onChange={(e) => handleEventUpdate(event.id, 'description', e.target.value)}
                      placeholder={t('review.descriptionPlaceholder')}
                      rows={6}
                      className={isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400  ' : ' '}
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* Bottom Actions (Fixed Bar) */}
      <div className={`fixed bottom-0 left-0 right-0 z-30 border-t p-4 transition-colors duration-300 shadow-2xl ${
        isDark ? 'bg-gray-800/95 border-gray-700' : 'bg-white/95 border-gray-200 shadow-blue-200'
      }`}>
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className={`font-semibold ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-600 hover:bg-gray-100'}`}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('buttons.backToHome') || 'Back to Home'}
          </Button>
          
          <Button
            onClick={handleAddToCalendar}
            disabled={isAddingToCalendar || events.length === 0}
            className="h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg transition-all"
          >
            {isAddingToCalendar ? (
              <div className="flex items-center">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                {t('review.adding') || 'Adding...'}
              </div>
            ) : (
              <div className="flex items-center">
                <Plus className="mr-2 h-4 w-4" />
                {t('review.addToCalendar', { count: events.length }) || `Add to Calendar (${events.length})`}
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}