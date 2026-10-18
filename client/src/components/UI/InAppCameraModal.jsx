/**
 * components/UI/InAppCameraModal.jsx - Chụp ảnh trực tiếp trong ứng dụng bằng WebRTC
 * Không điều hướng ra ứng dụng máy ảnh gốc của Android, giữ trình duyệt luôn ở foreground
 * Triệt tiêu hoàn toàn nguy cơ bị Android LMK (Low Memory Killer) tắt tab trên Samsung Galaxy Tab A9
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, X, RefreshCw, AlertCircle, Sparkles, Check, Image as ImageIcon } from 'lucide-react';

export default function InAppCameraModal({ isOpen, onClose, onCapture, onFallbackToFile }) {
  const [stream, setStream] = useState(null);
  const [cameraError, setCameraError] = useState('');
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (sau) hoặc 'user' (trước)
  const [isCapturing, setIsCapturing] = useState(false);
  const [flashEffect, setFlashEffect] = useState(false);
  const videoRef = useRef(null);

  // Khởi động luồng camera
  const startCamera = useCallback(async (mode) => {
    setCameraError('');
    // Dừng luồng cũ nếu có
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Trình duyệt không hỗ trợ truy cập máy ảnh trực tiếp hoặc kết nối không bảo mật (yêu cầu HTTPS/localhost).');
      return;
    }

    try {
      const constraints = {
        audio: false,
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920, max: 2560 },
          height: { ideal: 1080, max: 1440 }
        }
      };
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.warn('Lỗi mở camera:', err);
      let msg = 'Không thể mở máy ảnh. Vui lòng cấp quyền truy cập máy ảnh trong cài đặt trình duyệt.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Quyền sử dụng máy ảnh đã bị từ chối. Vui lòng nhấn vào biểu tượng ổ khóa cạnh thanh địa chỉ để cấp quyền.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'Không tìm thấy thiết bị máy ảnh trên máy tính bảng/điện thoại này.';
      }
      setCameraError(msg);
    }
  }, [stream]);

  useEffect(() => {
    if (isOpen) {
      startCamera(facingMode);
    } else {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen, facingMode]);

  // Đổi giữa camera sau và camera trước
  const handleToggleFacing = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Chụp ảnh từ khung hình video hiện tại
  const handleTakePhoto = async () => {
    if (!videoRef.current || isCapturing) return;

    try {
      setIsCapturing(true);
      setFlashEffect(true);
      setTimeout(() => setFlashEffect(false), 200);

      const video = videoRef.current;
      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Không thể khởi tạo canvas 2D');

      // Nếu là camera trước, lật ảnh theo phương ngang để tự nhiên như gương
      if (facingMode === 'user') {
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
      }

      ctx.drawImage(video, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          canvas.width = 0;
          canvas.height = 0;
          if (!blob) {
            alert('Không thể tạo file ảnh từ camera.');
            setIsCapturing(false);
            return;
          }

          const fileName = `camera_floral_${Date.now()}.jpg`;
          const photoFile = new File([blob], fileName, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });

          // Tắt camera ngay để giải phóng phần cứng
          if (stream) {
            stream.getTracks().forEach(t => t.stop());
            setStream(null);
          }

          setIsCapturing(false);
          onCapture(photoFile);
          onClose();
        },
        'image/jpeg',
        0.88
      );
    } catch (err) {
      console.error('Lỗi khi chụp khung hình:', err);
      setIsCapturing(false);
      alert('Chụp ảnh thất bại: ' + err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: '#09090b',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        userSelect: 'none',
        touchAction: 'manipulation'
      }}
    >
      {/* Flash effect overlay */}
      {flashEffect && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: '#ffffff',
            zIndex: 100000,
            pointerEvents: 'none',
            opacity: 0.85,
            transition: 'opacity 0.2s ease-out'
          }}
        />
      )}

      {/* Top Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.85), transparent)',
          zIndex: 10
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ffffff' }}>
          <Camera size={20} color="#f43f5e" />
          <span style={{ fontWeight: 600, fontSize: 16 }}>Chụp Ảnh Hoa Mẫu</span>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.18)',
            border: 'none',
            color: '#ffffff',
            width: 40,
            height: 40,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
          title="Đóng"
        >
          <X size={20} />
        </button>
      </div>

      {/* Main Viewfinder */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          background: '#000'
        }}
      >
        {cameraError ? (
          <div
            style={{
              padding: 24,
              textAlign: 'center',
              color: '#ffffff',
              maxWidth: 420,
              background: 'rgba(24, 24, 27, 0.95)',
              borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.1)',
              margin: '0 16px'
            }}
          >
            <div style={{ display: 'inline-flex', padding: 12, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.2)', marginBottom: 12 }}>
              <AlertCircle size={32} color="#ef4444" />
            </div>
            <h4 style={{ fontSize: 16, marginBottom: 8, fontWeight: 700 }}>Không Thể Mở Camera Trực Tiếp</h4>
            <p style={{ fontSize: 13.5, color: '#a1a1aa', lineHeight: 1.5, marginBottom: 20 }}>
              {cameraError}
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  onClose();
                  if (onFallbackToFile) onFallbackToFile();
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '10px 18px',
                  fontSize: 14
                }}
              >
                <ImageIcon size={16} />
                <span>Chọn Ảnh Từ Máy / Thư Viện</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                transform: facingMode === 'user' ? 'scaleX(-1)' : 'none'
              }}
            />

            {/* Viewfinder Guide Overlay with crosshairs */}
            <div
              style={{
                position: 'absolute',
                inset: '24px',
                border: '2px dashed rgba(255,255,255,0.35)',
                borderRadius: 18,
                pointerEvents: 'none',
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.25)'
              }}
            >
              <div style={{ position: 'absolute', top: 12, left: 12, width: 24, height: 24, borderTop: '3px solid #f43f5e', borderLeft: '3px solid #f43f5e' }} />
              <div style={{ position: 'absolute', top: 12, right: 12, width: 24, height: 24, borderTop: '3px solid #f43f5e', borderRight: '3px solid #f43f5e' }} />
              <div style={{ position: 'absolute', bottom: 12, left: 12, width: 24, height: 24, borderBottom: '3px solid #f43f5e', borderLeft: '3px solid #f43f5e' }} />
              <div style={{ position: 'absolute', bottom: 12, right: 12, width: 24, height: 24, borderBottom: '3px solid #f43f5e', borderRight: '3px solid #f43f5e' }} />
            </div>
          </>
        )}
      </div>

      {/* Bottom Controls */}
      {!cameraError && (
        <div
          style={{
            padding: '24px 20px 32px',
            background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            zIndex: 10
          }}
        >
          {/* Fallback to gallery */}
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onFallbackToFile) onFallbackToFile();
            }}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              color: '#ffffff',
              borderRadius: '50%',
              width: 48,
              height: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            title="Chọn từ thư viện ảnh"
          >
            <ImageIcon size={20} />
          </button>

          {/* Shutter Button */}
          <button
            type="button"
            disabled={isCapturing}
            onClick={handleTakePhoto}
            style={{
              width: 74,
              height: 74,
              borderRadius: '50%',
              background: 'transparent',
              border: '4px solid #ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 4,
              cursor: isCapturing ? 'not-allowed' : 'pointer',
              outline: 'none',
              transform: isCapturing ? 'scale(0.92)' : 'scale(1)',
              transition: 'transform 0.15s ease'
            }}
            title="Chụp ảnh ngay"
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                background: '#f43f5e',
                boxShadow: '0 0 16px rgba(244, 63, 94, 0.6)'
              }}
            />
          </button>

          {/* Switch Camera Button (Front/Back) */}
          <button
            type="button"
            onClick={handleToggleFacing}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              color: '#ffffff',
              borderRadius: '50%',
              width: 48,
              height: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            title="Đổi camera trước / sau"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
