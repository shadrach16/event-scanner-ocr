import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Menu, Calendar, Clock, MapPin, Trash2, Download, Plus, Share2, Home, History,Check } from 'lucide-react';
import { CalendarEvent } from '../types/event';
import { CalendarService } from '../services/calendarService';
import { toast } from 'sonner';
import ShareModal from '../components/ShareModal';
import { useTheme } from '../contexts/ThemeContext'; // Assuming you can access the theme context here

interface EventsHistoryProps {
  onViewChange?: (view: 'home' | 'history') => void;
}

export default function EventsHistory({ onViewChange }: EventsHistoryProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // Assume useTheme is available to handle Dark Mode consistency
  const { isDark } = useTheme(); 
  
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [shareEvent, setShareEvent] = useState<CalendarEvent | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    // Load events from local storage
    const savedEvents = localStorage.getItem('photo2calendar-history');
    if (savedEvents) {
      setEvents(JSON.parse(savedEvents));
    }
  }, []);

  const toggleEventSelection = (eventId: string) => {
    const newSelected = new Set(selectedEvents);
    if (newSelected.has(eventId)) {
      newSelected.delete(eventId);
    } else {
      newSelected.add(eventId);
    }
    setSelectedEvents(newSelected);
  };

  const deleteSelectedEvents = () => {
    const remainingEvents = events.filter(event => !selectedEvents.has(event.id));
    setEvents(remainingEvents);
    localStorage.setItem('photo2calendar-history', JSON.stringify(remainingEvents));
    setSelectedEvents(new Set());
    toast.success(t('messages.eventsDeleted', { count: selectedEvents.size }));
  };

  const exportSelectedEvents = async () => {
    const eventsToExport = events.filter(event => selectedEvents.has(event.id));
    if (eventsToExport.length === 0) return;

    try {
      // NOTE: CalendarService.generateICSFile is assumed to exist
      const icsContent = CalendarService.generateICSFile(eventsToExport); 
      const blob = new Blob([icsContent], { type: 'text/calendar' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `events-${new Date().toISOString().split('T')[0]}.ics`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t('messages.eventsExported'));
    } catch (error) {
      toast.error(t('messages.exportFailed'));
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(t('app.locale') || 'en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeStr: string) => {
    const time = new Date(`2000-01-01T${timeStr}`);
    return time.toLocaleTimeString(t('app.locale') || 'en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getFilteredEvents = () => {
    const now = new Date();
    // Use the event's date, startDate, or endDate for comparison
    const todayBoundary = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return events.filter(event => {
      // Use the most reliable date field for filtering
      const eventDateStr = event.startDate || event.date || event.endDate;
      if (!eventDateStr) return false;
      
      const eventDateTime = new Date(eventDateStr);
      const isToday = eventDateTime >= todayBoundary && eventDateTime < new Date(todayBoundary.getTime() + 24 * 60 * 60 * 1000);
      const isUpcoming = eventDateTime > todayBoundary;
      const isPast = eventDateTime < todayBoundary;

      switch (activeTab) {
        case 'today':
          return isToday;
        case 'upcoming':
          // Include today's events if they haven't passed yet, but the simpler comparison works fine here
          return isUpcoming; 
        case 'past':
          return isPast;
        default:
          return events; // 'all' tab returns all events
      }
    });
  };

  const filteredEvents = getFilteredEvents();

  const handleMenuClick = () => {
    navigate('/settings');
  };

  const handleViewChange = (view: 'home' | 'history') => {
    if (onViewChange) {
      onViewChange(view);
    } else if (view === 'home') {
      navigate('/');
    }
  };

  // --- JSX RENDER: NO EVENTS ---
  const EmptyState = (
    <div className={`flex flex-col items-center justify-center p-6 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
      <div className="text-center space-y-6 max-w-sm mt-20">
        <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <Calendar className={`h-8 w-8 ${isDark ? 'text-purple-400' : 'text-blue-500'}`} />
        </div>
        <div className="space-y-2">
          <h2 className={`text-xl font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('history.noEvents')}</h2>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {t('history.noEventsDescription')}
          </p>
        </div>
        <Button
          onClick={() => handleViewChange('home')}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl shadow-lg"
        >
          <Plus className="mr-2 h-4 w-4" />
          {t('history.createFirstEvent')}
        </Button>
      </div>
    </div>
  );


  // --- MAIN RENDER ---
  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      
      {/* Header */}
      <div className={`sticky top-0 z-10 flex items-center justify-between p-4 border-b ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-md`}>
        <div className="flex items-center space-x-3">
          <button onClick={handleMenuClick} className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}>
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-bold">{t('history.title')}</h1>
        </div>
        <div className={`text-sm font-semibold px-3 py-1 rounded-full ${isDark ? 'bg-purple-600 text-white' : 'bg-blue-500 text-white'}`}>
          {events.length}
        </div>
      </div>
      
      {/* If no events, show empty state and stop */}
      {events.length === 0 && EmptyState}

      {events.length > 0 && (
        <div className="max-w-md mx-auto px-4 pt-4 pb-24">
          
          {/* Filter Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className={`grid w-full grid-cols-4 p-1 rounded-xl h-10 mb-4 shadow-inner ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
              <TabsTrigger value="all" className={`text-xs font-medium rounded-lg transition-all ${isDark ? 'data-[state=active]:bg-gray-900 data-[state=active]:text-purple-400 data-[state=active]:shadow-lg' : 'data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md'}`}>
                {t('history.all')}
              </TabsTrigger>
              <TabsTrigger value="today" className={`text-xs font-medium rounded-lg transition-all ${isDark ? 'data-[state=active]:bg-gray-900 data-[state=active]:text-purple-400 data-[state=active]:shadow-lg' : 'data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md'}`}>
                {t('history.today')}
              </TabsTrigger>
              <TabsTrigger value="upcoming" className={`text-xs font-medium rounded-lg transition-all ${isDark ? 'data-[state=active]:bg-gray-900 data-[state=active]:text-purple-400 data-[state=active]:shadow-lg' : 'data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md'}`}>
                {t('history.upcoming')}
              </TabsTrigger>
              <TabsTrigger value="past" className={`text-xs font-medium rounded-lg transition-all ${isDark ? 'data-[state=active]:bg-gray-900 data-[state=active]:text-purple-400 data-[state=active]:shadow-lg' : 'data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md'}`}>
                {t('history.past')}
              </TabsTrigger>
            </TabsList>

            {/* Bulk Action Bar (Fixed at the bottom of the visible area when active) */}
            {selectedEvents.size > 0 && (
              <div className={`sticky bottom-20 z-20 flex justify-center p-3 rounded-xl shadow-2xl transition-all duration-300 ${isDark ? 'bg-gray-700' : 'bg-white'}`}>
                <div className="flex space-x-3 w-full max-w-sm">
                  <Button
                    onClick={exportSelectedEvents}
                    size="sm"
                    variant="outline"
                    className={`flex-1 h-10 text-sm font-semibold ${isDark ? 'border-gray-600 text-purple-400 hover:bg-gray-600' : 'border-gray-300 hover:bg-blue-50 text-blue-600'}`}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {t('buttons.export')} ({selectedEvents.size})
                  </Button>
                  <Button
                    onClick={deleteSelectedEvents}
                    size="sm"
                    className="flex-1 h-10 text-sm font-semibold bg-red-500 hover:bg-red-600 text-white shadow-md"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t('buttons.delete')} ({selectedEvents.size})
                  </Button>
                </div>
              </div>
            )}

            {/* Event List Content */}
            <TabsContent value={activeTab} className="space-y-4">
              {filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className={`border rounded-xl p-4 transition-all duration-200 cursor-pointer shadow-md ${
                    isDark 
                      ? selectedEvents.has(event.id) ? 'bg-purple-900/40 border-purple-600 shadow-purple-900/50' : 'bg-gray-800 border-gray-700 hover:border-purple-500'
                      : selectedEvents.has(event.id) ? 'bg-blue-50 border-blue-300 shadow-blue-100' : 'bg-white border-gray-200 hover:shadow-lg'
                  }`}
                  onClick={() => toggleEventSelection(event.id)}
                >
                  <div className="flex items-start justify-between">
                    {/* Checkbox/Selection Indicator */}
                    <div className={`w-5 h-5 mr-3 mt-0.5 rounded-full border flex-shrink-0 flex items-center justify-center transition-all ${
                        selectedEvents.has(event.id) 
                            ? 'bg-blue-500 border-blue-700' 
                            : isDark ? 'border-gray-500' : 'border-gray-400'
                    }`}>
                        {selectedEvents.has(event.id) && <Check className="h-3 w-3 text-white" />}
                    </div>
                    
                    <div className="flex-1 min-w-0 space-y-1">
                      <h3 className={`font-semibold text-base leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {event.title}
                      </h3>
                      
                      <div className="space-y-1">
                        {/* Date and Time Line */}
                        <div className={`flex items-center text-xs font-medium ${isDark ? 'text-purple-300' : 'text-blue-600'}`}>
                          <Calendar className="mr-1 h-3 w-3" />
                          <span>{formatDate(event.startDate || event.date || event.endDate)}</span>
                          {event.startTime && (
                            <>
                              <Clock className="ml-3 mr-1 h-3 w-3" />
                              <span>{formatTime(event.startTime)}</span>
                              {event.endTime && (
                                <span> - {formatTime(event.endTime)}</span>
                              )}
                            </>
                          )}
                        </div>
                        
                        {/* Location Line */}
                        {event.location && (
                          <div className={`flex items-center text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            <MapPin className="mr-1 h-3 w-3" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        )}
                        
                        {/* Description (Truncated) */}
                        {event.description && (
                          <p className={`text-xs line-clamp-2 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {event.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Share Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShareEvent(event);
                      }}
                      className={`ml-3 p-2 rounded-full transition-colors flex-shrink-0 ${isDark ? 'text-gray-400 hover:bg-gray-600' : 'text-gray-500 hover:bg-gray-100'}`}
                      title={t('buttons.share')}
                    >
                      <Share2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              {filteredEvents.length === 0 && (
                <div className={`text-center py-12 border-2 border-dashed rounded-xl ${isDark ? 'border-gray-700 text-gray-500' : 'border-gray-300 text-gray-600'}`}>
                  <Calendar className="h-10 w-10 mx-auto mb-3" />
                  <p className="text-sm">{t('history.noEventsInCategory')}</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Bottom Navigation (Fixed) */}
      <div className={`fixed bottom-0 left-0 right-0 border-t ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-2xl`}>
        <div className="max-w-md mx-auto px-4 py-2">
          <div className="flex items-center justify-around">
            <button
              onClick={() => handleViewChange('home')}
              className={`flex flex-col items-center space-y-1 p-3 rounded-lg transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-blue-600'}`}
            >
              <Home className="h-5 w-5" />
              <span className="text-xs font-medium">{t('navigation.events')}</span>
            </button>
            
            <button
              className={`flex flex-col items-center space-y-1 p-3 rounded-lg transition-colors ${isDark ? 'bg-purple-900/50 text-purple-300' : 'bg-gradient-to-br from-blue-50 to-purple-50 text-blue-600'}`}
            >
              <History className="h-5 w-5" />
              <span className="text-xs font-medium">{t('navigation.history')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {shareEvent && (
        <ShareModal
          isOpen={!!shareEvent}
          onClose={() => setShareEvent(null)}
          event={shareEvent}
        />
      )}
    </div>
  );
}