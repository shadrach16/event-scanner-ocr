export interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string; // YYYY-MM-DD format
  startTime: string; // HH:MM format
  endDate: string;   // YYYY-MM-DD format
  endTime: string;   // HH:MM format
  location: string;
  isAllDay: boolean;
  reminder: number;  // minutes before event
  calendar: string;  // calendar name/category
  createdAt?: string; // ISO string
  updatedAt?: string; // ISO string
  source?: 'manual' | 'ai' | 'import'; // how the event was created
  status?: 'pending' | 'confirmed' | 'cancelled'; // event status
  attendees?: string[]; // list of attendee emails
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: string;
    count?: number;
  };
  tags?: string[]; // event tags for categorization
  priority?: 'low' | 'medium' | 'high'; // event priority
  color?: string; // hex color for display
}

export interface UserSettings {
  defaultCalendar: string;
  defaultReminder: number;
  language: string;
  isPremium: boolean;
  theme?: 'light' | 'dark' | 'auto';
  notifications?: boolean;
  autoSync?: boolean;
  defaultEventDuration?: number; // minutes
  workingHours?: {
    start: string; // HH:MM
    end: string;   // HH:MM
  };
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 1 = Monday, etc.
  dateFormat?: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  timeFormat?: '12h' | '24h';
  aiApiKey?: string; // Google AI API key
}

export interface ProcessingHistory {
  id: string;
  timestamp: string;
  source: 'image' | 'text' | 'file';
  fileName?: string;
  eventsFound: number;
  events: Event[];
  processingTime: number; // milliseconds
  success: boolean;
  error?: string;
}

export interface CalendarIntegration {
  id: string;
  name: string;
  type: 'google' | 'outlook' | 'apple' | 'other';
  isConnected: boolean;
  lastSync?: string;
  syncEnabled: boolean;
  accessToken?: string;
  refreshToken?: string;
}

export interface AppStatistics {
  totalEventsCreated: number;
  totalImagesProcessed: number;
  totalTextsProcessed: number;
  averageEventsPerSession: number;
  mostUsedCalendar: string;
  lastUsed: string;
  appVersion: string;
}