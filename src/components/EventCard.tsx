import { CalendarEvent } from '../types/event';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, FileText } from 'lucide-react';

interface EventCardProps {
  event: CalendarEvent;
  onToggle: (eventId: string) => void;
  onEdit?: (event: CalendarEvent) => void;
}

export default function EventCard({ event, onToggle, onEdit }: EventCardProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <Card className={`w-full transition-all duration-200 ${event.selected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Checkbox
              checked={event.selected}
              onCheckedChange={() => onToggle(event.id)}
              className="mt-1"
            />
            <CardTitle className="text-lg font-semibold text-gray-900">
              {event.title}
            </CardTitle>
          </div>
          {onEdit && (
            <button
              onClick={() => onEdit(event)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Edit
            </button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-3">
        <div className="flex items-center text-gray-600">
          <Calendar className="h-4 w-4 mr-2" />
          <span className="text-sm">{formatDate(event.date)}</span>
        </div>
        
        <div className="flex items-center text-gray-600">
          <Clock className="h-4 w-4 mr-2" />
          <span className="text-sm">
            {formatTime(event.startTime)}
            {event.endTime && ` - ${formatTime(event.endTime)}`}
          </span>
        </div>
        
        {event.location && (
          <div className="flex items-center text-gray-600">
            <MapPin className="h-4 w-4 mr-2" />
            <span className="text-sm">{event.location}</span>
          </div>
        )}
        
        {event.description && (
          <div className="flex items-start text-gray-600">
            <FileText className="h-4 w-4 mr-2 mt-0.5" />
            <span className="text-sm">{event.description}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}