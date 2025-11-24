import { toast } from 'sonner';

// Safely import Capacitor modules
let Camera: any = null;
let Filesystem: any = null;
let Device: any = null;
let Share: any = null;
let Capacitor: any = null;

// Dynamic imports to avoid build errors when Capacitor is not available
const loadCapacitorModules = async () => {
  try {
    const capacitorModule = await import('@capacitor/core');
    Capacitor = capacitorModule.Capacitor;
    
    if (Capacitor.isNativePlatform()) {
      try {
        const cameraModule = await import('@capacitor/camera');
        Camera = cameraModule.Camera;
        
        const filesystemModule = await import('@capacitor/filesystem');
        Filesystem = filesystemModule.Filesystem;
        
        const deviceModule = await import('@capacitor/device');
        Device = deviceModule.Device;

        const shareModule = await import('@capacitor/share');
        Share = shareModule.Share;
      } catch (error) {
        console.log('Some Capacitor plugins not available:', error);
      }
    }
  } catch (error) {
    console.log('Capacitor not available, using web fallbacks');
  }
};

// Initialize on module load
loadCapacitorModules();

export class DeviceService {
  /**
   * Check if running on native platform
   */
  static isNative(): boolean {
    return Capacitor && Capacitor.isNativePlatform();
  }

  /**
   * Get device information
   */
  static async getDeviceInfo() {
    try {
      if (this.isNative() && Device) {
        const info = await Device.getInfo();
        return {
          platform: info.platform,
          model: info.model,
          operatingSystem: info.operatingSystem,
          osVersion: info.osVersion,
          manufacturer: info.manufacturer,
          isVirtual: info.isVirtual,
          isMobile: true,
          hasCamera: true,
          hasFileAPI: true
        };
      } else {
        return {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
          hasCamera: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
          hasFileAPI: !!(window.File && window.FileReader && window.FileList && window.Blob)
        };
      }
    } catch (error) {
      console.error('Error getting device info:', error);
      return { platform: 'unknown', isMobile: false, hasCamera: false, hasFileAPI: false };
    }
  }

  /**
   * Request camera permission
   */
  static async requestCameraPermission(): Promise<boolean> {
    try {
      if (this.isNative()) {
        // For native platforms, permissions are handled automatically by Capacitor
        return true;
      } else {
        // Web API permission check
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          return false;
        }

        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach(track => track.stop());
          return true;
        } catch (error) {
          console.error('Camera permission denied:', error);
          return false;
        }
      }
    } catch (error) {
      console.error('Camera permission request failed:', error);
      return false;
    }
  }

  /**
   * Request storage permission
   */
  static async requestStoragePermission(): Promise<boolean> {
    try {
      if (this.isNative()) {
        // For native platforms, permissions are handled automatically by Capacitor
        return true;
      } else {
        // Web storage is always available
        return true;
      }
    } catch (error) {
      console.error('Storage permission request failed:', error);
      return false;
    }
  }

  /**
   * Check camera permission status
   */
  static async checkCameraPermission(): Promise<'granted' | 'denied' | 'prompt'> {
    try {
      if (this.isNative()) {
        // On native platforms, assume permissions are handled by Capacitor
        return 'granted';
      } else {
        // Web API doesn't have a direct way to check permissions without requesting
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach(track => track.stop());
          return 'granted';
        } catch (error) {
          return 'denied';
        }
      }
    } catch (error) {
      console.error('Error checking camera permission:', error);
      return 'denied';
    }
  }

  /**
   * Take a photo using native camera or web camera
   */
  static async takePhoto(): Promise<File | null> {
    try {
      // Check and request camera permission first
      const hasPermission = await this.requestCameraPermission();
      if (!hasPermission) {
        throw new Error('Camera permission denied. Please allow camera access in settings.');
      }

      if (this.isNative() && Camera) {
        // Use Capacitor Camera API for native platforms
        const { CameraResultType, CameraSource,CameraDirection } = await import('@capacitor/camera');
        
        const image = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.Uri,
          source: CameraSource.Camera,
          saveToGallery: true,
          direction: CameraDirection.Back
        });

        if (image.webPath) {
          // Convert to File object
          const response = await fetch(image.webPath);
          const blob = await response.blob();
          const file = new File([blob], `photo-${Date.now()}.jpg`, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          return file;
        }
        return null;
      } else {
        // Fallback to Web API
        return this.takePhotoWeb();
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('User cancelled')) {
          return null; // User cancelled, don't show error
        } else if (error.message.includes('permission')) {
          throw new Error('Camera permission denied. Please allow camera access in settings.');
        }
      }
      
      throw new Error('Failed to access camera. Please try again.');
    }
  }

  /**
   * Web fallback for taking photos
   */
  private static async takePhotoWeb(): Promise<File | null> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported in this environment');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      // Create a modal with video preview and capture button
      return new Promise((resolve, reject) => {
        const modal = document.createElement('div');
        modal.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.9);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 10000;
        `;

        const video = document.createElement('video');
        video.srcObject = stream;
        video.autoplay = true;
        video.playsInline = true;
        video.style.cssText = `
          max-width: 90%;
          max-height: 70%;
          border-radius: 8px;
        `;

        const controls = document.createElement('div');
        controls.style.cssText = `
          margin-top: 20px;
          display: flex;
          gap: 20px;
        `;

        const captureBtn = document.createElement('button');
        captureBtn.textContent = 'Capture';
        captureBtn.style.cssText = `
          padding: 12px 24px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 16px;
          cursor: pointer;
        `;

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.style.cssText = `
          padding: 12px 24px;
          background: #6c757d;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 16px;
          cursor: pointer;
        `;

        const cleanup = () => {
          stream.getTracks().forEach(track => track.stop());
          document.body.removeChild(modal);
        };

        captureBtn.onclick = () => {
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d')!;
          
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          context.drawImage(video, 0, 0);
          
          canvas.toBlob((blob) => {
            cleanup();
            if (blob) {
              const file = new File([blob], `photo-${Date.now()}.jpg`, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(file);
            } else {
              resolve(null);
            }
          }, 'image/jpeg', 0.9);
        };

        cancelBtn.onclick = () => {
          cleanup();
          resolve(null);
        };

        controls.appendChild(captureBtn);
        controls.appendChild(cancelBtn);
        modal.appendChild(video);
        modal.appendChild(controls);
        document.body.appendChild(modal);
      });
    } catch (error) {
      console.error('Web camera error:', error);
      throw error;
    }
  }

  /**
   * Select image from gallery using native or web API
   */
  static async selectFromGallery(): Promise<File | null> {
    try {
      // Check and request storage permission first
      const hasPermission = await this.requestStoragePermission();
      if (!hasPermission) {
        throw new Error('Storage permission denied. Please allow photo access in settings.');
      }

      if (this.isNative() && Camera) {
        // Use Capacitor Camera API for gallery access
        const { CameraResultType, CameraSource } = await import('@capacitor/camera');
        
        const image = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.Uri,
          source: CameraSource.Photos
        });

        if (image.webPath) {
          const response = await fetch(image.webPath);
          const blob = await response.blob();
          const fileName = `gallery-${Date.now()}.jpg`;
          const file = new File([blob], fileName, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          return file;
        }
        return null;
      } else {
        // Fallback to Web API
        return this.selectFromGalleryWeb();
      }
    } catch (error) {
      console.error('Error selecting from gallery:', error);
      
      if (error instanceof Error && error.message.includes('User cancelled')) {
        return null;
      }
      
      throw new Error('Failed to access gallery. Please try again.');
    }
  }

  /**
   * Web fallback for gallery selection
   */
  private static selectFromGalleryWeb(): Promise<File | null> {
    return new Promise((resolve, reject) => {
      try {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.multiple = false;
        
        input.onchange = (event) => {
          const target = event.target as HTMLInputElement;
          const file = target.files?.[0];
          
          if (file) {
            if (!file.type.startsWith('image/')) {
              reject(new Error('Please select a valid image file.'));
              return;
            }
            
            if (file.size > 10 * 1024 * 1024) {
              reject(new Error('Image file is too large. Please select an image under 10MB.'));
              return;
            }
            
            resolve(file);
          } else {
            resolve(null);
          }
        };
        
        input.onerror = () => {
          reject(new Error('Failed to select image from gallery.'));
        };
        
        input.click();
      } catch (error) {
        reject(new Error('Failed to access gallery. Please try again.'));
      }
    });
  }

  /**
   * Select files from device storage
   */
  static async selectFromFiles(): Promise<File | null> {
    try {
      if (this.isNative() && Filesystem) {
        // For native platforms, use file picker through web fallback for now
        return this.selectFromFilesWeb();
      } else {
        return this.selectFromFilesWeb();
      }
    } catch (error) {
      console.error('Error selecting files:', error);
      throw new Error('Failed to access files. Please try again.');
    }
  }

  /**
   * Web fallback for file selection
   */
  private static selectFromFilesWeb(): Promise<File | null> {
    return new Promise((resolve, reject) => {
      try {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,application/pdf,.txt,.doc,.docx';
        
        input.onchange = (event) => {
          const target = event.target as HTMLInputElement;
          const file = target.files?.[0];
          
          if (file) {
            if (file.size > 20 * 1024 * 1024) {
              reject(new Error('File is too large. Please select a file under 20MB.'));
              return;
            }
            
            const allowedTypes = [
              'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
              'application/pdf',
              'text/plain',
              'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ];
            
            if (!allowedTypes.includes(file.type)) {
              reject(new Error('Unsupported file type. Please select an image, PDF, or text file.'));
              return;
            }
            
            resolve(file);
          } else {
            resolve(null);
          }
        };
        
        input.onerror = () => {
          reject(new Error('Failed to select file.'));
        };
        
        input.click();
      } catch (error) {
        reject(new Error('Failed to access file system. Please try again.'));
      }
    });
  }

  /**
   * Share content using native share or web share API
   */
  static async shareContent(options: {
    title?: string;
    text?: string;
    url?: string;
    files?: File[];
  }): Promise<boolean> {
    try {
      if (this.isNative() && Share) {
        // Use Capacitor Share API
        const shareOptions: any = {
          title: options.title,
          text: options.text,
          url: options.url
        };

        await Share.share(shareOptions);
        return true;
      } else {
        // Use Web Share API if available
        if (navigator.share) {
          const shareData: ShareData = {};
          
          if (options.title) shareData.title = options.title;
          if (options.text) shareData.text = options.text;
          if (options.url) shareData.url = options.url;
          if (options.files && options.files.length > 0) {
            shareData.files = options.files;
          }

          await navigator.share(shareData);
          return true;
        } else {
          // Fallback: Copy to clipboard and show toast
          const textToShare = [options.title, options.text, options.url]
            .filter(Boolean)
            .join('\n');
          
          if (textToShare) {
            await navigator.clipboard.writeText(textToShare);
            toast.success('Content copied to clipboard!');
            return true;
          }
          
          throw new Error('Nothing to share');
        }
      }
    } catch (error) {
      console.error('Error sharing content:', error);
      
      if (error instanceof Error && error.message.includes('AbortError')) {
        return false; // User cancelled
      }
      
      // Fallback: Copy to clipboard
      try {
        const textToShare = [options.title, options.text, options.url]
          .filter(Boolean)
          .join('\n');
        
        if (textToShare) {
          await navigator.clipboard.writeText(textToShare);
          toast.success('Content copied to clipboard!');
          return true;
        }
      } catch (clipboardError) {
        console.error('Clipboard fallback failed:', clipboardError);
      }
      
      return false;
    }
  }

  /**
   * Check if camera is available
   */
  static async isCameraAvailable(): Promise<boolean> {
    try {
      if (this.isNative()) {
        // On native platforms, assume camera is available
        const deviceInfo = await this.getDeviceInfo();
        return deviceInfo.hasCamera || true;
      } else {
        // Web API check
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
          return false;
        }

        const devices = await navigator.mediaDevices.enumerateDevices();
        return devices.some(device => device.kind === 'videoinput');
      }
    } catch (error) {
      console.error('Error checking camera availability:', error);
      return false;
    }
  }

  /**
   * Save file to device storage
   */
  static async saveFile(fileName: string, data: string, mimeType: string = 'text/plain'): Promise<boolean> {
    try {
      if (this.isNative() && Filesystem) {
        const { Directory, Encoding } = await import('@capacitor/filesystem');
        
        await Filesystem.writeFile({
          path: fileName,
          data: data,
          directory: Directory.Documents,
          encoding: Encoding.UTF8
        });
        
        toast.success('File saved to Documents folder');
        return true;
      } else {
        // Web fallback - trigger download
        const blob = new Blob([data], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        toast.success('File downloaded');
        return true;
      }
    } catch (error) {
      console.error('Error saving file:', error);
      toast.error('Failed to save file');
      return false;
    }
  }

  /**
   * Show native toast (if available)
   */
  static showToast(message: string): void {
    toast.success(message);
  }

  /**
   * Vibrate device (native only)
   */
  static vibrate(duration: number = 100): void {
    try {
      if (this.isNative()) {
        // Use Capacitor Haptics plugin if available
        if ('vibrate' in navigator) {
          navigator.vibrate(duration);
        }
      } else {
        // Web vibration API
        if ('vibrate' in navigator) {
          navigator.vibrate(duration);
        }
      }
    } catch (error) {
      console.error('Vibration not supported:', error);
    }
  }
}

// Export singleton instance for convenience
export const deviceService = new DeviceService();
export default deviceService;