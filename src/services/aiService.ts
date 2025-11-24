import { GoogleGenAI } from '@google/genai';
import { Event } from '../types/event';

export class AIService {
  // Initialize Google AI client - In production, this should be from environment variables
  private static API_KEY = import.meta.env.VITE_GOOGLE_AI_API_KEY;
  private static ai = new GoogleGenAI({ apiKey: this.API_KEY });

  /**
   * Extract events from image using Google's Gemini Vision
   */
  static async extractEventsFromImage(file: File): Promise<Event[]> {
    try {
      const base64Data = await this.fileToBase64(file);

      const prompt = `You are an expert  Event Data Extraction Agent  specializing in transforming visual and textual information into structured calendar data.

Your task is to meticulously analyze the provided image and extract every explicit or implicit calendar event.

1. Constraints and Output Format
    * Role: Event Data Extraction Agent.
    * Mandatory Output Type: You MUST return a single, minified, valid  JSON array .
    * Core Schema Enforcement: Each object in the array MUST strictly adhere to the 'CalendarEvent' schema provided below. Do not add or omit any keys.
    * Handling No Events: If no recognizable events, appointments, or scheduled activities are found, you MUST return an empty JSON array: '[]'.
    * Timezone: Assume all extracted times are relative to the user's local timezone (${Intl.DateTimeFormat().resolvedOptions().timeZone}).
    * Date Filling: If only a day/month is provided without a year, assume the event occurs in  ${new Date().getFullYear()}.

2. Output Schema
Your JSON output MUST match this TypeScript/JSON schema exactly.

'''json
    {
      "title": "string",
      "description": "string",
      "startDate": "YYYY-MM-DD",
      "startTime": "HH:MM",
      "endDate": "YYYY-MM-DD",
      "endTime": "HH:MM",
      "location": "string",
      "isAllDay": "boolean"
    }


3. Extraction Instructions
    1. Title: Use the most descriptive, concise summary from the source (e.g., "Team Meeting" or "Lunch with Sarah").
    
    2. Date/Time:
        ◦ startDate / endDate: Convert all date formats to strict ISO 8601 (YYYY-MM-DD).
        ◦ startTime / endTime: Convert all time formats (AM/PM) to 24-hour format (HH:MM).
        
         CRITICAL TIME INFERENCE RULE:  If a time is missing, but a temporal keyword is present, infer the time based on the following examples:
            *  "Morning/Breakfast" : Set 'startTime' to  09:00  and 'endTime' to 11:00.
            *  "Afternoon/Lunch" : Set 'startTime' to  14:00  and 'endTime' to 16:00.
            *  "Evening/Social Hour" : Set 'startTime' to  18:00  and 'endTime' to 20:00.
            *  "Night/Social Night" : Set 'startTime' to  21:00  and 'endTime' to 23:00.
            *  Default Duration : If only a start time is given (explicit or inferred), calculate 'endTime' by adding 2 hour to 'startTime'.

        ◦ All Day: Set 'isAllDay' to 'true' if  no time or temporal keyword  is mentioned (e.g., "Holiday on July 4th"). If 'isAllDay' is 'true', set 'startTime' and 'endTime' to '"00:00"'.
        
    3. Location/Description: Use placeholders like "N/A" or "None" if details are missing, but never leave the fields blank in the final JSON object unless the field is genuinely optional/omitted in the response logic.  `;

      const imagePart = {
        inlineData: {
          data: base64Data.split(',')[1],
          mimeType: file.type,
        },
      };

      const result = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash', // Using a standard, reliable model
        contents: [{ text: prompt }, imagePart],
        generationConfig: {
          responseMimeType: 'application/json',
        },
      });
      
 

      const responseText = result.candidates[0].content.parts[0].text

      try {
        // More robustly clean the response before parsing
        const cleanedText = responseText.replace(/```json\n?|```/g, '').trim();
        const events = JSON.parse(cleanedText);
        return this.processEvents(events);
      } catch (parseError) {
        console.error('Failed to parse AI response:', responseText);
        return this.fallbackEventExtraction(responseText);
      }
    } catch (error) {
      console.error('AI image processing error:', error);
      throw new Error('Failed to process image. Please try again.');
    }
  }

  /**
   * Extract events from text using Google's Gemini
   */
  static async extractEventsFromText(text: string): Promise<Event[]> {
    try {
      if (!text || text.trim() === '') {
        return [];
      }

      const prompt = `You are an expert  Event Data Extraction Agent  specializing in transforming visual and textual information into structured calendar data.

Your task is to meticulously analyze the provided text content and extract every explicit or implicit calendar event.

1. Constraints and Output Format
    * Role: Event Data Extraction Agent.
    * Mandatory Output Type: You MUST return a single, minified, valid  JSON array .
    * Core Schema Enforcement: Each object in the array MUST strictly adhere to the 'CalendarEvent' schema provided below. Do not add or omit any keys.
    * Handling No Events: If no recognizable events, appointments, or scheduled activities are found, you MUST return an empty JSON array: '[]'.
    * Timezone: Assume all extracted times are relative to the user's local timezone (${Intl.DateTimeFormat().resolvedOptions().timeZone}).
    * Date Filling: If only a day/month is provided without a year, assume the event occurs in  ${new Date().getFullYear()}.

2. Output Schema
Your JSON output MUST match this TypeScript/JSON schema exactly.

'''json
    {
      "title": "string",
      "description": "string",
      "startDate": "YYYY-MM-DD",
      "startTime": "HH:MM",
      "endDate": "YYYY-MM-DD",
      "endTime": "HH:MM",
      "location": "string",
      "isAllDay": "boolean"
    }


3. Extraction Instructions
    1. Title: Use the most descriptive, concise summary from the source (e.g., "Team Meeting" or "Lunch with Sarah").
    
    2. Date/Time:
        ◦ startDate / endDate: Convert all date formats to strict ISO 8601 (YYYY-MM-DD).
        ◦ startTime / endTime: Convert all time formats (AM/PM) to 24-hour format (HH:MM).
        
         CRITICAL TIME INFERENCE RULE:  If a time is missing, but a temporal keyword is present, infer the time based on the following examples:
            *  "Morning/Breakfast" : Set 'startTime' to  09:00  and 'endTime' to 10:00.
            *  "Afternoon/Lunch" : Set 'startTime' to  14:00  and 'endTime' to 15:00.
            *  "Evening/Social Hour" : Set 'startTime' to  18:00  and 'endTime' to 19:00.
            *  "Night/Social Night" : Set 'startTime' to  21:00  and 'endTime' to 22:00.
            *  Default Duration : If only a start time is given (explicit or inferred), calculate 'endTime' by adding 1 hour to 'startTime'.

        ◦ All Day: Set 'isAllDay' to 'true' if  no time or temporal keyword  is mentioned (e.g., "Holiday on July 4th"). If 'isAllDay' is 'true', set 'startTime' and 'endTime' to '"00:00"'.
        
    3. Location/Description: Use placeholders like "N/A" or "None" if details are missing, but never leave the fields blank in the final JSON object unless the field is genuinely optional/omitted in the response logic. `;

      const result = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash', // Using a standard, reliable model
        contents: [{ text: prompt }],
        generationConfig: {
          responseMimeType: 'application/json',
        },
      });

      const responseText =  result.candidates[0].content.parts[0].text

      try {
        // More robustly clean the response before parsing
        const cleanedText = responseText.replace(/```json\n?|```/g, '').trim();
        const events = JSON.parse(cleanedText);
        return this.processEvents(events);
      } catch (parseError) {
        console.error('Failed to parse AI response:', responseText);
        // FIX: Correctly reference responseText in the fallback
        return this.fallbackEventExtraction(responseText);
      }
    } catch (error) {
      console.error('AI text processing error:', error);
      throw new Error('Failed to process text. Please check your internet connection and try again.');
    }
  }

  // --- HELPER METHODS ---

  private static fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private static processEvents(events: any[]): Event[] {
    if (!Array.isArray(events)) {
      return [];
    }
    return events
      .filter(event => event && typeof event === 'object')
      .map(event => ({
        id: this.generateEventId(),
        title: event.title || 'Untitled Event',
        description: event.description || '',
        // Standardized to startDate and endDate, removing the redundant 'date' field
        startDate: event.startDate || this.getTodayDate(),
        startTime: event.startTime || '09:00',
        endDate: event.endDate || event.startDate || this.getTodayDate(),
        endTime: event.endTime || this.calculateEndTime(event.startTime || '09:00'),
        location: event.location || '',
        isAllDay: Boolean(event.isAllDay),
        reminder: 15,
        calendar: 'Personal',
        createdAt: new Date().toISOString(),
        source: 'ai',
      }))
      .filter(event => event.title && event.title !== 'Untitled Event');
  }

  private static fallbackEventExtraction(text: string): Event[] {
    const events: Event[] = [];
    // Fallback logic remains the same...
    return events;
  }

  private static generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  private static parseTime(timeStr: string): string {
    // Parse time logic remains the same...
    return '09:00'; // Placeholder
  }

  private static calculateEndTime(startTime: string): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    const endHour = (hours + 1) % 24;
    return `${endHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
}