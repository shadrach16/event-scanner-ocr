import { Loader2, Sparkles } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
  isPremium?: boolean;
}

export default function LoadingScreen({ 
  message = "Analyzing your content...", 
  isPremium = false 
}: LoadingScreenProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="text-center space-y-6 max-w-sm">
        {/* Loading Animation */}
        <div className="relative">
          <div className="w-20 h-20 mx-auto">
            <Loader2 className="w-full h-full text-blue-600 animate-spin" />
          </div>
          {isPremium && (
            <div className="absolute -top-2 -right-2">
              <Sparkles className="w-8 h-8 text-yellow-500" />
            </div>
          )}
        </div>
        
        {/* Loading Message */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900">
            {isPremium ? "Premium Processing" : "Processing"}
          </h2>
          <p className="text-gray-600">
            {message}
          </p>
          {isPremium && (
            <p className="text-sm text-yellow-600 font-medium">
              Faster and more accurate detection
            </p>
          )}
        </div>
        
        {/* Progress Indicator */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
        </div>
      </div>
    </div>
  );
}