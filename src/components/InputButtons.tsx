import { Camera, Image, FileText, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface InputButtonsProps {
  onCameraClick: () => void;
  onGalleryClick: () => void;
  onFileClick: () => void;
  onTextClick: () => void;
}

export default function InputButtons({ onCameraClick, onGalleryClick, onFileClick, onTextClick }: InputButtonsProps) {
  return (
    <div className="space-y-4 w-full max-w-sm">
      {/* Primary Input Methods */}
      <div className="space-y-3">
        <Button
          onClick={onCameraClick}
          className="w-full h-16 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white"
          size="lg"
        >
          <Camera className="mr-3 h-6 w-6" />
          Take a photo
        </Button>
        
        <Button
          onClick={onGalleryClick}
          className="w-full h-16 text-lg font-semibold bg-green-600 hover:bg-green-700 text-white"
          size="lg"
        >
          <Image className="mr-3 h-6 w-6" />
          Select from gallery
        </Button>
        
        <Button
          onClick={onFileClick}
          className="w-full h-16 text-lg font-semibold bg-purple-600 hover:bg-purple-700 text-white"
          size="lg"
        >
          <FileText className="mr-3 h-6 w-6" />
          Select from files
        </Button>
      </div>
      
      {/* Secondary Input Method */}
      <div className="pt-4 border-t border-gray-200">
        <Button
          onClick={onTextClick}
          variant="outline"
          className="w-full h-14 text-base font-medium"
          size="lg"
        >
          <Type className="mr-3 h-5 w-5" />
          Add text
        </Button>
      </div>
    </div>
  );
}