import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Mail, Shield, Info, Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'about' | 'privacy' | 'terms' | 'contact' | 'support';
}

export default function InfoModal({ isOpen, onClose, type }: InfoModalProps) {
  const { t } = useTranslation();

  const getIcon = () => {
    switch (type) {
      case 'about':
        return <Info className="h-6 w-6 text-blue-600" />;
      case 'privacy':
        return <Shield className="h-6 w-6 text-green-600" />;
      case 'terms':
        return <Shield className="h-6 w-6 text-purple-600" />;
      case 'contact':
        return <Mail className="h-6 w-6 text-orange-600" />;
      case 'support':
        return <Heart className="h-6 w-6 text-red-600" />;
      default:
        return <Info className="h-6 w-6 text-blue-600" />;
    }
  };

  const getContent = () => {
    switch (type) {
      case 'about':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Photo2Calendar</h3>
              <p className="text-sm text-gray-600 mb-4">Version 1.0.0</p>
            </div>
            
            <div className="space-y-3 text-sm text-gray-700">
              <p>{t('info.about.description')}</p>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">{t('info.about.features')}</h4>
                <ul className="space-y-1 ml-4">
                  <li>• {t('info.about.feature1')}</li>
                  <li>• {t('info.about.feature2')}</li>
                  <li>• {t('info.about.feature3')}</li>
                  <li>• {t('info.about.feature4')}</li>
                  <li>• {t('info.about.feature5')}</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">{t('info.about.developer')}</h4>
                <p>{t('info.about.developerInfo')}</p>
              </div>
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-4 text-sm text-gray-700">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">{t('info.privacy.dataCollection')}</h4>
              <p>{t('info.privacy.dataCollectionText')}</p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">{t('info.privacy.dataUsage')}</h4>
              <p>{t('info.privacy.dataUsageText')}</p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">{t('info.privacy.dataStorage')}</h4>
              <p>{t('info.privacy.dataStorageText')}</p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">{t('info.privacy.thirdParty')}</h4>
              <p>{t('info.privacy.thirdPartyText')}</p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">{t('info.privacy.userRights')}</h4>
              <p>{t('info.privacy.userRightsText')}</p>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-blue-800 text-xs">{t('info.privacy.lastUpdated')}</p>
            </div>
          </div>
        );

      case 'terms':
        return (
          <div className="space-y-4 text-sm text-gray-700">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">{t('info.terms.acceptance')}</h4>
              <p>{t('info.terms.acceptanceText')}</p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">{t('info.terms.serviceDescription')}</h4>
              <p>{t('info.terms.serviceDescriptionText')}</p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">{t('info.terms.userResponsibilities')}</h4>
              <ul className="space-y-1 ml-4">
                <li>• {t('info.terms.responsibility1')}</li>
                <li>• {t('info.terms.responsibility2')}</li>
                <li>• {t('info.terms.responsibility3')}</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">{t('info.terms.limitations')}</h4>
              <p>{t('info.terms.limitationsText')}</p>
            </div>

            <div className="bg-yellow-50 p-3 rounded-lg">
              <p className="text-yellow-800 text-xs">{t('info.terms.lastUpdated')}</p>
            </div>
          </div>
        );

      case 'contact':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('info.contact.title')}</h3>
              <p className="text-sm text-gray-600">{t('info.contact.subtitle')}</p>
            </div>

            <div className="space-y-3">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">{t('info.contact.email')}</h4>
                <p className="text-blue-700 text-sm">support@photo2calendar.com</p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">{t('info.contact.responseTime')}</h4>
                <p className="text-green-700 text-sm">{t('info.contact.responseTimeText')}</p>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-semibold text-purple-900 mb-2">{t('info.contact.feedback')}</h4>
                <p className="text-purple-700 text-sm">{t('info.contact.feedbackText')}</p>
              </div>
            </div>
          </div>
        );

      case 'support':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('info.support.title')}</h3>
              <p className="text-sm text-gray-600">{t('info.support.subtitle')}</p>
            </div>

            <div className="space-y-3">
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-semibold text-red-900 mb-2">{t('info.support.coffee')}</h4>
                <p className="text-red-700 text-sm mb-3">{t('info.support.coffeeText')}</p>
                <Button className="w-full bg-red-500 hover:bg-red-600 text-white">
                  ☕ {t('info.support.buyCoffee')}
                </Button>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-semibold text-yellow-900 mb-2">{t('info.support.premium')}</h4>
                <p className="text-yellow-700 text-sm mb-3">{t('info.support.premiumText')}</p>
                <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-white">
                  ⭐ {t('info.support.upgradePremium')}
                </Button>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">{t('info.support.share')}</h4>
                <p className="text-blue-700 text-sm">{t('info.support.shareText')}</p>
              </div>
            </div>
          </div>
        );

      default:
        return <div>{t('info.default')}</div>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {getIcon()}
            <span>{t(`info.${type}.title`)}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          {getContent()}
        </div>

        <div className="flex justify-end mt-6">
          <Button onClick={onClose} variant="outline">
            {t('buttons.close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}