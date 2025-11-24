import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Camera,
  Upload,
  RotateCcw,
  X,
  Check,
  AlertCircle,
  CheckCircle,
  Loader2,
  Image as ImageIcon, // Kept for consistency
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import Webcam from 'react-webcam';
import { useNavigate } from 'react-router-dom';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import {
  Camera as CapacitorCamera,
  CameraResultType,
  CameraSource,
} from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

interface CameraUploadProps {
  onPhotoSelect: (file: File, mimeType: string) => void;
  onClearPhoto: () => void;
  selectedPhoto: File | null;
  isDark: string | null;
}

// --- HELPER FUNCTIONS ---

const triggerHapticFeedback = (style: ImpactStyle) => {
  if (window.Capacitor) {
    Haptics.impact({ style });
  }
};

const dataURLtoFile = (dataurl: string, filename: string, mimeType: string) => {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || mimeType;
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

// --- MAIN COMPONENT ---

export default function CameraUpload({
  onPhotoSelect,
  onClearPhoto,
  selectedPhoto,
  isDark,
}: CameraUploadProps) {
  // 💡 Mode 'upload' is no longer used for UI
  const [mode, setMode] = useState<'choice' | 'camera'>('choice');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  // 💡 dragActive is no longer needed
  // const [dragActive, setDragActive] = useState(false); 
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();

  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine the environment once
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    localStorage.setItem('studio_status', 'landing');
  }, []);

  // --- CORE LOGIC FUNCTIONS ---

  const simulateUpload = useCallback(
    (file: File, mimeType: string) => {
      setIsUploading(true);
      setUploadProgress(0);

      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsUploading(false);
            onPhotoSelect(file, mimeType); // This will trigger the 'selectedPhoto' prop
            return 100;
          }
          return prev + Math.random() * 4; // Simulated progress
        });
      }, 50); // Faster interval for smoother demo
    },
    [onPhotoSelect],
  );

  const capturePhoto = useCallback(async () => {
    setCameraError(null);
    triggerHapticFeedback(ImpactStyle.Medium);

    if (isNative) {
      // --- NATIVE CAMERA PATH ---
      try {
        const photo = await CapacitorCamera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Camera, // Use the Camera
          direction: facingMode === 'user' ? 'front' : 'rear',
        });

        if (photo.dataUrl && photo.format) {
          setImageSrc(photo.dataUrl);
          setImageMimeType(`image/${photo.format}`);
        }
      } catch (error) {
        console.error('Native Camera Error:', error);
        setCameraError('Camera access denied or operation cancelled.');
        setMode('choice'); // Go back if user cancels
      }
    } else {
      // --- WEB/DESKTOP CAMERA PATH ---
      const image = webcamRef.current?.getScreenshot();
      if (image) {
        setImageSrc(image);
        setImageMimeType('image/jpeg');
      }
    }
  }, [isNative, webcamRef, facingMode]);

  const confirmCapture = useCallback(() => {
    if (imageSrc) {
      triggerHapticFeedback(ImpactStyle.Light);
      const file = dataURLtoFile(
        imageSrc,
        `selfie-${Date.now()}.jpeg`,
        imageMimeType || 'image/jpeg',
      );
      if (file) {
        simulateUpload(file, 'image/jpeg');
        setImageSrc(null);
        setImageMimeType(null);
      }
    }
  }, [imageSrc, simulateUpload, imageMimeType]);

  const confirmUpload = () => {
    if (imageSrc && imageMimeType) {
      triggerHapticFeedback(ImpactStyle.Light);
      const file = dataURLtoFile(
        imageSrc,
        `upload-${Date.now()}.jpg`,
        imageMimeType,
      );
      simulateUpload(file, imageMimeType);
      setImageSrc(null);
      setImageMimeType(null);
    }
  };

  const handlePhotoFile = useCallback((file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageSrc(reader.result as string);
        setImageMimeType(file.type);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const switchCamera = useCallback(() => {
    triggerHapticFeedback(ImpactStyle.Light);
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  }, []);

  // --- NAVIGATION & STATE RESET ---

  const handleCameraClick = () => {
    triggerHapticFeedback(ImpactStyle.Light);
    setMode('camera');
    if (isNative) {
      // On native, immediately launch the camera
      capturePhoto();
    }
    // On web, this just switches to the <Webcam> component view
  };

  // 💡 UPDATED FUNCTION
  // This function now handles both native gallery and web/PC file picker
  const handleUploadClick = async () => {
    triggerHapticFeedback(ImpactStyle.Light);
    setCameraError(null);
    // 💡 We no longer setMode('upload'). We stay in 'choice' mode.

    if (isNative) {
      // --- NATIVE GALLERY/PHOTOS PATH ---
      try {
        const photo = await CapacitorCamera.getPhoto({
          quality: 90,
          allowEditing: false, 
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Photos, // <-- This opens the gallery
        });

        if (photo.dataUrl && photo.format) {
          setImageSrc(photo.dataUrl);
          setImageMimeType(`image/${photo.format}`);
          // The component will now show the 'Preview' state (// 3.)
        } else {
          // User cancelled from the native gallery, go back to choice
          setMode('choice');
        }
      } catch (error) {
        console.error('Native Gallery Error:', error);
        // User cancelled or a permissions error occurred
        setMode('choice'); // Go back to the choice screen
      }
    } else {
      // --- WEB/PC UPLOAD PATH ---
      // 💡 NEW: Immediately click the hidden file input
      fileInputRef.current?.click();
      // The input's `onChange` will trigger `handleFileSelect`,
      // which sets the imageSrc and shows the preview screen.
    }
  };

  // Resets component to the initial 'choice' screen
  const resetState = () => {
    triggerHapticFeedback(ImpactStyle.Light);
    setImageSrc(null);
    setImageMimeType(null);
    setCameraError(null);
    onClearPhoto(); // Clears parent state
    setMode('choice');
  };

  // Clears the preview to return to camera/upload
  const clearPreview = () => {
    triggerHapticFeedback(ImpactStyle.Light);
    setImageSrc(null);
    setImageMimeType(null);
    setCameraError(null);
    // If we were in native camera mode, we must re-launch the camera
    if (mode === 'camera' && isNative) {
      capturePhoto();
    }
    // 💡 If we came from a file upload, just go back to choice
    setMode('choice');
  };

  // --- DRAG & DROP HANDLERS (No longer used, but harmless to keep) ---
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  // --- This function is still critical! ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e && e.target && e.target.files && e.target.files[0]) {
      handlePhotoFile(e.target.files[0]);
    }
  };

  // --- RENDER STATES ---

  // 1. SUCCESS SCREEN (Photo is selected and processed)
  if (selectedPhoto) {
    return (
      <Card className="w-full max-w-lg mx-auto shadow-2xl shadow-amber-100 overflow-hidden border-2 border-amber-200">
        <CardContent className="p-6 sm:p-8 text-center">
          <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2">
            Photo Ready!
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mb-6">
            Your photo is uploaded and ready for the transformation.
          </p>
          <div className="relative group w-40 h-40 sm:w-48 h-48 mx-auto rounded-full overflow-hidden border-4 border-white shadow-lg">
            <img
              src={URL.createObjectURL(selectedPhoto)}
              alt="Selected"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col space-y-3 sm:space-y-2">
            <Button
              onClick={resetState} // This now goes back to 'choice'
              variant="outline"
              className="mt-8 w-full h-12 text-base"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Choose a Different Photo
            </Button>
            <Button
              onClick={() => {
                navigate('/?studio_status=ready');
              }}
              className="w-full bg-amber-600 text-white h-12 text-base hover:bg-amber-700" // Styled to match theme
            >
              Continue to Gallery
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 2. UPLOADING/PROCESSING STATE
  if (isUploading) {
    return (
      <div className="w-full max-w-lg mx-auto p-6 sm:p-8 flex flex-col items-center justify-center text-center min-h-[60vh] sm:min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-amber-600 animate-spin mb-4" />
        <h3 className="text-xl font-semibold text-slate-800 mb-2">
          Uploading...
        </h3>
        <Progress value={uploadProgress} className="w-3/4 max-w-xs" />
        <p className="text-sm text-slate-500 mt-2">
          {Math.round(uploadProgress)}%
        </p>
      </div>
    );
  }

  // 3. PREVIEW STATE (Photo taken/selected, awaiting confirmation)
  if (imageSrc) {
    return (
      <Card className="w-full max-w-lg mx-auto rounded-none sm:rounded-2xl shadow-2xl shadow-amber-100 overflow-hidden border-amber-200">
        <CardContent className="p-0">
          <div className="relative aspect-square w-full">
            <img
              src={imageSrc}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-4 sm:bottom-6 p-4 flex flex-col items-center justify-end gap-3 sm:gap-4">
              <Button
                onClick={() =>
                  // 💡 This logic is simplified: 'camera' mode means it came from webcam.
                  // Anything else ('choice' mode) must have come from a file upload.
                  mode === 'camera' ? confirmCapture() : confirmUpload()
                }
                size="lg"
                className="w-full bg-amber-600 hover:bg-amber-700 h-14 text-base" // Styled to match theme
              >
                <Check className="w-5 h-5 mr-2" /> Use this Photo
              </Button>
              <Button
                onClick={clearPreview} // Returns to camera/upload
                size="lg"
                variant="secondary"
                className="w-full bg-white/90 hover:bg-white h-14 text-base"
              >
                <X className="w-5 h-5 mr-2" /> Try Again
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 4. INITIAL CHOICE SCREEN (The new design)
  if (mode === 'choice') {
    return (
      <div className="w-full max-w-lg mx-auto  px-3 ">
        {/* 💡 ADDED: The hidden file input is now rendered here */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        <h1 className={`sm:text-3xl text-2xl font-serif font-bold ${isDark ? 'text-gray-100': 'text-slate-900'} mb-2`}>
          Scan Event to Calendar
        </h1>
        <p className={` text-md sm:text-lg text-base ${isDark ? 'text-gray-300': 'text-slate-600'} mb-8`}>
          Snap a flyer or upload an image to add events.
        </p>
        <div className="grid grid-cols-2 gap-2 sm:gap-6">
          {/* Library Button Card */}
        <button
    onClick={handleUploadClick}
    className=" mr-1 flex flex-col items-center space-y-5 justify-center pt-6 sm:p-10   aspect-square rounded-2xl 
    bg-amber-50 text-amber-800 hover:bg-amber-100
    transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
    
    style={{
       
        backgroundImage: "url(\"data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='16' ry='16' stroke='%23fcd34d' stroke-width='2' stroke-dasharray='12 7'/%3e%3c/svg%3e\")",
        '--hover-svg': "url(\"data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='16' ry='16' stroke='%23fbbf24' stroke-width='2' stroke-dasharray='12 7'/%3e%3c/svg%3e\")"
    }}
    onMouseOver={e => e.currentTarget.style.backgroundImage = e.currentTarget.style.getPropertyValue('--hover-svg')}
    onMouseOut={e => e.currentTarget.style.backgroundImage = ''}
>
    <ImageIcon className="w-10 h-10 sm:w-12 sm:h-12 mb-3" />
    <span className="text-md font-semibold">Library</span>
</button>
          {/* Camera Button Card */}
          <button
            onClick={handleCameraClick}
            className="flex flex-col items-center space-y-5 justify-center pt-6 sm:p-10   aspect-square rounded-2xl  border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 hover:border-amber-400 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
            
    style={{
       
        backgroundImage: "url(\"data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='16' ry='16' stroke='%23fcd34d' stroke-width='2' stroke-dasharray='12 7'/%3e%3c/svg%3e\")",
        '--hover-svg': "url(\"data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='16' ry='16' stroke='%23fbbf24' stroke-width='2' stroke-dasharray='12 7'/%3e%3c/svg%3e\")"
    }}
    onMouseOver={e => e.currentTarget.style.backgroundImage = e.currentTarget.style.getPropertyValue('--hover-svg')}
    onMouseOut={e => e.currentTarget.style.backgroundImage = ''}

          >
            <Camera className="w-10 h-10 sm:w-12 sm:h-12 mb-3" />
            <span className="text-md font-semibold">Camera</span>
          </button>
        </div>
      </div>
    );
  }

  // 5. CAMERA VIEW (Web Only)
  // 💡 This block now ONLY handles mode === 'camera'
  return (
    <Card className="w-full max-w-lg mx-auto rounded-none sm:rounded-2xl shadow-amber-100 overflow-hidden">
      <CardContent className="px-4 sm:p-6 bg-white   min-h-[60vh] sm:min-h-[50vh]">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 text-slate-600 hover:text-slate-900"
          onClick={() => {
            setMode('choice');
            setCameraError(null);
          }}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to choices
        </Button>

        {/* The main content area */}
        <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
          {/* RENDER CAMERA VIEW (Web only) */}
          <>
            {!isNative ? (
              // WebCamera view
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{ facingMode }}
                onUserMediaError={() =>
                  setCameraError(
                    'Camera access denied. Please enable permissions in your browser settings.',
                  )
                }
                className="w-full h-full object-cover"
              />
            ) : (
              // Mobile Capacitor Placeholder (Camera opens instantly)
              <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-slate-200">
                <Camera className="w-16 h-16 text-slate-500 mb-3" />
                <p className="text-slate-600 font-medium">Opening Camera...</p>
                <p className="text-sm text-slate-500 mt-1">
                  Accept permissions to continue.
                </p>
              </div>
            )}
            {/* Face Outline */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-3/4 h-5/6 border-2 border-white/50 border-dashed rounded-lg" />
            </div>
            {/* Web-only camera controls */}
            {!isNative && (
              <div className="absolute inset-x-0 bottom-4 sm:bottom-6 flex justify-center items-center gap-6 sm:gap-4">
                <Button
                  onClick={switchCamera}
                  variant="secondary"
                  size="icon"
                  className="w-14 h-14 rounded-full bg-white/80 backdrop-blur-sm shadow-md"
                >
                  <RotateCcw className="w-6 h-6" />
                </Button>
                <Button
                  onClick={capturePhoto}
                  className="w-20 h-20 rounded-full bg-amber-600 p-0 shadow-xl border-4 border-white hover:bg-amber-700" // Styled
                >
                  <div className="w-16 h-16 rounded-full bg-white/80" />
                </Button>
                <div className="w-14 h-14" /> {/* Spacer */}
              </div>
            )}
          </>

          {/* 💡 REMOVED: The 'mode === "upload"' block is no longer needed */}
          
        </div>

        {cameraError && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{cameraError}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}