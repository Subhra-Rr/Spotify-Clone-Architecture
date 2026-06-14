import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProfilePhotoEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadFile: (file: File) => Promise<void>;
}

export function ProfilePhotoEditModal({ isOpen, onClose, onUploadFile }: ProfilePhotoEditModalProps) {
  const [mode, setMode] = useState<'options' | 'camera'>('options');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopStream();
      setMode('options');
    }
  }, [isOpen]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setStream(mediaStream);
      setMode('camera');
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error("Failed to access camera", err);
      alert("Could not access the camera. Please check your permissions.");
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to file
        canvas.toBlob(async (blob) => {
          if (blob) {
            const file = new File([blob], `camera-${Date.now()}.png`, { type: 'image/png' });
            setIsUploading(true);
            try {
              await onUploadFile(file);
              onClose();
            } catch (err) {
              console.error(err);
            } finally {
              setIsUploading(false);
            }
          }
        }, 'image/png');
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md bg-[#282828] rounded-xl shadow-2xl border border-[#3f3f3f] overflow-hidden"
          >
            <div className="flex justify-between items-center p-4 border-b border-[#3f3f3f]">
              <h2 className="text-xl font-bold text-white">Update Profile Picture</h2>
              <button onClick={onClose} className="text-[#b3b3b3] hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {mode === 'options' && (
                <div className="flex flex-col gap-4">
                  <button
                    onClick={() => document.getElementById('modal-profile-upload')?.click()}
                    className="flex items-center justify-center gap-3 w-full bg-[#1db954] text-black font-bold py-4 rounded-full hover:scale-105 active:scale-95 transition-transform"
                  >
                    <Upload className="w-5 h-5" />
                    Upload from Files
                  </button>
                  <input
                    id="modal-profile-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      if (e.target.files && e.target.files[0]) {
                        setIsUploading(true);
                        try {
                          await onUploadFile(e.target.files[0]);
                          onClose();
                        } catch (err) {
                           console.error(err);
                        } finally {
                          setIsUploading(false);
                        }
                      }
                    }}
                  />

                  <div className="text-center text-[#b3b3b3] text-sm my-2">OR</div>

                  <button
                    onClick={startCamera}
                    className="flex items-center justify-center gap-3 w-full border border-[#b3b3b3] text-white font-bold py-4 rounded-full hover:border-white hover:text-white transition-colors hover:scale-105 active:scale-95"
                  >
                    <Camera className="w-5 h-5" />
                    Take a Photo
                  </button>
                </div>
              )}

              {mode === 'camera' && (
                <div className="flex flex-col items-center">
                  <div className="relative w-full aspect-square bg-black rounded-lg overflow-hidden mb-6">
                     <video 
                        ref={videoRef} 
                        autoPlay
                        playsInline 
                        muted
                        className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]" 
                     />
                     <canvas ref={canvasRef} className="hidden" />
                  </div>
                  
                  {isUploading ? (
                     <div className="text-white font-bold animate-pulse">Uploading...</div>
                  ) : (
                     <div className="flex gap-4">
                        <button 
                           onClick={() => {
                              stopStream();
                              setMode('options');
                           }}
                           className="px-6 py-2 rounded-full border border-[#b3b3b3] text-white font-bold hover:scale-105 transition-transform"
                        >
                           Cancel
                        </button>
                        <button 
                           onClick={capturePhoto}
                           className="px-6 py-2 rounded-full bg-[#1db954] text-black font-bold hover:scale-105 transition-transform"
                        >
                           Capture
                        </button>
                     </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
