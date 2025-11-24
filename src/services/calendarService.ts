import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';
import { DeviceService } from './deviceService'; 
import { CapacitorCalendar, CalendarPermissionScope, CreateEventOptions } from '@ebarooni/capacitor-calendar';
import { CalendarEvent } from '../types/event'; 

const CalendarPlugin: any = CapacitorCalendar;

let CapacitorModule: any = null;
const loadCapacitorModules = async () => {
    try {
        const capacitorModule = await import('@capacitor/core');
        CapacitorModule = capacitorModule.Capacitor;
    } catch (error) {
        // Suppress error in web environment
    }
};
loadCapacitorModules();


export class CalendarService {
    
    static isNative(): boolean {
        return CapacitorModule && CapacitorModule.isNativePlatform();
    }

    // --- PERMISSION METHODS ---

    /**
     * Requests full access to the device calendar using check/request pattern.
     * This is the function the UI component should call to trigger the prompt.
     */
    static async requestCalendarPermission(): Promise<boolean> {
        if (!this.isNative()) return true;

        try {
            // 1. Check current status first
            let status = await this.checkPermissionsInternal();

            if (status.writeCalendar === 'granted') {
                return true; // Already granted
            }

            // 2. Request permissions
            // const permissionsToRequest = {
            //     permissions: [CalendarPermissionScope.READ_CALENDAR, CalendarPermissionScope.WRITE_CALENDAR],
            // };
            
            const result = await CalendarPlugin.requestAllPermissions();
            console.log('new ajon',JSON.stringify(status))

            // 3. Verify final status after the prompt
            return result.writeCalendar === 'granted';

        } catch (error) {
            console.error('Native Calendar Permission Request Failed:', error);
            return false;
        }
    }

    /**
     * Internal helper to check permission status for both scopes (Read and Write).
     */
    private static async checkPermissionsInternal() {
        return await CalendarPlugin.checkAllPermissions();
    }

    /**
     * Checks current calendar permission status without prompting the user.
     * Used by the UI component to determine whether to show a grant button.
     */
    static async checkCalendarPermission(): Promise<boolean> {
        if (!this.isNative()) return true;
        
        try {
            const status = await this.checkPermissionsInternal();
            // We need both read and write to create an event
            return status.readCalendar === 'granted' && status.writeCalendar === 'granted';
        } catch (error) {
            console.warn('Could not check calendar permission status:', error);
            return false;
        }
    }

    // --- CORE EVENT CREATION (Remains the same) ---
    private static async createNativeEvent(event: CalendarEvent): Promise<boolean> {
        if (!this.isNative()) return false;

        try {
            const startDate = new Date(`${event.startDate}T${event.startTime}:00`);
            const endDate = new Date(`${event.endDate}T${event.endTime}:00`);
            
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                throw new Error("Invalid date/time format for calendar event.");
            }
            
            const reminderMinutesOffset = event.reminder > 0 ? -event.reminder : 0;  
            
            const pluginEvent: CreateEventOptions = {
                id: event.id,
                title: event.title,
                location: event.location || '',
                description: event.description || '',
                startDate: startDate.getTime(), 
                endDate: endDate.getTime(), 
                isAllDay: event.isAllDay,
                alerts: [reminderMinutesOffset],
            };

            const result = await CalendarPlugin.createEvent(pluginEvent);
            console.log('Events created', event.id)

            return !!result.id;

        } catch (error) {
            console.error('Error creating native event via plugin:', error);
            return false;
        }
    }

    // --- BULK ACTION (Remains the same) ---
    static async addMultipleToCalendar(events: CalendarEvent[]): Promise<boolean> {
        if (!this.isNative()) {
            toast.error("Calendar functionality is only available on mobile apps.");
            return false;
        }

        try {
            let successCount = 0;
            
            const creationPromises = events.map(event => this.createNativeEvent(event));
            const results = await Promise.all(creationPromises);
            
            results.forEach(success => {
                if (success) {
                    successCount++;
                }
            });
            
            if (successCount === events.length) {
                toast.success(`All ${events.length} events added to calendar!`);
                DeviceService.vibrate(50);
                return true;
            } else if (successCount > 0) {
                toast.warn(`${successCount} out of ${events.length} events added. Some events failed.`);
                DeviceService.vibrate(50);
                return true;
            } else {
                toast.error('Could not add any events to the native calendar.');
                return false;
            }
        } catch (error) {
            console.error('Critical error during bulk event addition:', error);
            return false;
        }
    }

    // --- LEGACY/PLACEHOLDER FUNCTIONS (Remains the same) ---
    static async addToCalendar(event: CalendarEvent): Promise<boolean> {
        return this.addMultipleToCalendar([event]);
    }

    static getCalendarInfo(): { supported: boolean; method: string; description: string; isAutomatic: boolean; } {
        return {
            supported: this.isNative(),
            method: 'Native App Calendar',
            description: 'Events are automatically created via native plugin access.',
            isAutomatic: this.isNative(),
        };
    }
}