import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Share2, Copy, MessageCircle, Mail, Calendar, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CalendarEvent } from '../types/event';
import { toast } from 'sonner';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEvent;
}

export default function ShareModal({ isOpen, onClose, event }: ShareModalProps) {
  const { t } = useTranslation();

  const formatEventText = () => {
    const date = new Date(event.date).toLocaleDateString();
    const time = event.startTime ? ` at ${event.startTime}` : '';
    const location = event.location ? ` at ${event.location}` : '';
    
    return `📅 ${event.title}\n🗓️ ${date}${time}${location}\n\n${event.description || ''}`;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(formatEventText());
      toast.success('Event details copied to clipboard');
      onClose();
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const shareViaWhatsApp = () => {
    const text = encodeURIComponent(formatEventText());
    window.open(`https://wa.me/?text=${text}`, '_blank');
    onClose();
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Event: ${event.title}`);
    const body = encodeURIComponent(formatEventText());
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
    onClose();
  };

  const shareViaMessages = () => {
    const text = encodeURIComponent(formatEventText());
    window.open(`sms:?body=${text}`, '_blank');
    onClose();
  };

  const downloadAsICS = () => {
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Photo2Calendar//Event//EN
BEGIN:VEVENT
UID:${event.id}@photo2calendar.app
DTSTART:${event.date.replace(/-/g, '')}T${event.startTime?.replace(':', '') || '0000'}00
DTEND:${event.date.replace(/-/g, '')}T${event.endTime?.replace(':', '') || '2359'}00
SUMMARY:${event.title}
DESCRIPTION:${event.description || ''}
LOCATION:${event.location || ''}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.title.replace(/[^a-z0-9]/gi, '_')}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Event downloaded as ICS file');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Share2 className="h-5 w-5" />
            <span>Share Event</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="font-semibold text-gray-900">{event.title}</h4>
            <p className="text-sm text-gray-600">
              {new Date(event.date).toLocaleDateString()}
              {event.startTime && ` at ${event.startTime}`}
            </p>
            {event.location && (
              <p className="text-sm text-gray-600">{event.location}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={copyToClipboard}
              variant="outline"
              className="flex items-center space-x-2 h-12"
            >
              <Copy className="h-4 w-4" />
              <span>Copy</span>
            </Button>

            <Button
              onClick={shareViaWhatsApp}
              variant="outline"
              className="flex items-center space-x-2 h-12 bg-green-50 hover:bg-green-100"
            >
              <MessageCircle className="h-4 w-4 text-green-600" />
              <span>WhatsApp</span>
            </Button>

            <Button
              onClick={shareViaEmail}
              variant="outline"
              className="flex items-center space-x-2 h-12 bg-blue-50 hover:bg-blue-100"
            >
              <Mail className="h-4 w-4 text-blue-600" />
              <span>Email</span>
            </Button>

            <Button
              onClick={shareViaMessages}
              variant="outline"
              className="flex items-center space-x-2 h-12 bg-purple-50 hover:bg-purple-100"
            >
              <MessageCircle className="h-4 w-4 text-purple-600" />
              <span>Messages</span>
            </Button>
          </div>

          <Button
            onClick={downloadAsICS}
            className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white"
          >
            <Download className="mr-2 h-4 w-4" />
            Download Calendar File
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}