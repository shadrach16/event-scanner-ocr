import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScanHistory } from '../types/event';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, History as HistoryIcon, Calendar, Camera, Image, FileText, Type, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function History() {
  const navigate = useNavigate();
  const [history, setHistory] = useState<ScanHistory[]>([]);

  useEffect(() => {
    const savedHistory = localStorage.getItem('photo2calendar-history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'camera': return <Camera className="h-4 w-4" />;
      case 'gallery': return <Image className="h-4 w-4" />;
      case 'file': return <FileText className="h-4 w-4" />;
      case 'text': return <Type className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'camera': return 'Camera';
      case 'gallery': return 'Gallery';
      case 'file': return 'File';
      case 'text': return 'Text';
      default: return 'Unknown';
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const clearHistory = () => {
    localStorage.removeItem('photo2calendar-history');
    setHistory([]);
    toast.success('History cleared');
  };

  const reviewEvents = (scanHistory: ScanHistory) => {
    navigate('/review', { 
      state: { 
        events: scanHistory.events,
        source: scanHistory.source 
      } 
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back
            </button>
            <h1 className="text-lg font-semibold flex items-center">
              <HistoryIcon className="h-5 w-5 mr-2" />
              History
            </h1>
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto p-4">
        {history.length === 0 ? (
          <div className="text-center py-12">
            <HistoryIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No History Yet</h3>
            <p className="text-gray-600 mb-6">
              Your scanned events will appear here after you process them.
            </p>
            <Button onClick={() => navigate('/')}>
              Start Scanning
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Scans
              </h2>
              <Badge variant="secondary">
                {history.length} scan{history.length !== 1 ? 's' : ''}
              </Badge>
            </div>

            {history.map((scan) => (
              <Card key={scan.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getSourceIcon(scan.source)}
                      <CardTitle className="text-base">
                        {getSourceLabel(scan.source)} Scan
                      </CardTitle>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {scan.events.length} event{scan.events.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    {formatDate(scan.timestamp)}
                  </p>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-2 mb-4">
                    {scan.events.slice(0, 2).map((event) => (
                      <div key={event.id} className="text-sm">
                        <p className="font-medium text-gray-900">{event.title}</p>
                        <p className="text-gray-600">
                          {new Date(event.date).toLocaleDateString()} at {event.startTime}
                        </p>
                      </div>
                    ))}
                    {scan.events.length > 2 && (
                      <p className="text-sm text-gray-500">
                        +{scan.events.length - 2} more event{scan.events.length - 2 !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                  
                  <Button 
                    onClick={() => reviewEvents(scan)}
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Review Events
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}