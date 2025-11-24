import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar, Shield, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGrantPermission: () => void;
  permissionType: 'calendar' | 'camera' | 'storage';
}

export default function PermissionModal({ isOpen, onClose, onGrantPermission, permissionType }: PermissionModalProps) {
  const { t } = useTranslation();

  const getPermissionInfo = () => {
    switch (permissionType) {
      case 'calendar':
        return {
          icon: <Calendar className="h-12 w-12 text-yellow-600" />,
          title: 'Calendar Access Required',
          description: 'Photo2Calendar needs access to your calendar to add events automatically. This allows you to save detected events directly to your preferred calendar.',
          benefits: [
            'Automatically add events to your calendar',
            'Choose which calendar to use',
            'Set custom reminders for events',
            'Sync across all your devices'
          ]
        };
      case 'camera':
        return {
          icon: <Shield className="h-12 w-12 text-yellow-600" />,
          title: 'Camera Access Required',
          description: 'Photo2Calendar needs camera access to capture photos of event details like flyers, invitations, or documents.',
          benefits: [
            'Take photos of event flyers',
            'Capture invitation details',
            'Scan documents with event info',
            'Quick photo-to-calendar conversion'
          ]
        };
      case 'storage':
        return {
          icon: <Shield className="h-12 w-12 text-yellow-600" />,
          title: 'Storage Access Required',
          description: 'Photo2Calendar needs storage access to read photos and documents from your device gallery.',
          benefits: [
            'Select photos from gallery',
            'Access saved documents',
            'Import event screenshots',
            'Process multiple file types'
          ]
        };
      default:
        return {
          icon: <Shield className="h-12 w-12 text-yellow-600" />,
          title: 'Permission Required',
          description: 'This permission is required for the app to function properly.',
          benefits: []
        };
    }
  };

  const info = getPermissionInfo();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center">
              {info.icon}
            </div>
            <DialogTitle className="text-xl font-bold text-gray-900">
              {info.title}
            </DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">

          <div className="space-y-3">
            <Button
              onClick={onGrantPermission}
              className="w-full h-12 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold rounded-xl"
            >
              Grant Permission
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full h-10 rounded-xl"
            >
              Not Now
            </Button>
          </div>

          <p className="text-xs text-center text-gray-500">
            You can change this permission anytime in your device settings.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}