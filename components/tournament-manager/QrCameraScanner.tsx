import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, AlertCircle } from 'lucide-react';

interface QrCameraScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export function QrCameraScanner({ onScan, onClose }: QrCameraScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const scannerId = 'qr-reader-element';
    const html5Qrcode = new Html5Qrcode(scannerId);
    scannerRef.current = html5Qrcode;

    const startScanner = async () => {
      try {
        await html5Qrcode.start(
          { facingMode: 'user' }, // Front webcam on laptop
          {
            fps: 10,
            qrbox: { width: 220, height: 220 },
          },
          (decodedText) => {
            onScan(decodedText);
            stopScanner();
          },
          () => {
            // Ignore scan failure logs to avoid noise
          }
        );
        setIsInitializing(false);
      } catch (err) {
        console.error('Camera startup error:', err);
        setError('Không thể khởi động Camera. Hãy đảm bảo bạn đã cấp quyền truy cập Camera cho trình duyệt.');
        setIsInitializing(false);
      }
    };

    startScanner();

    return () => {
      stopScanner();
    };
  }, []);

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.error('Failed to stop scanner:', err);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl border border-border p-1.5 text-muted-foreground hover:bg-muted/50 transition"
        >
          <X className="h-4 w-4" />
        </button>

        <h3 className="text-sm font-black text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
          <Camera className="h-4 w-4 text-primary" />
          Quét mã QR qua Camera
        </h3>

        {error ? (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-center text-red-600 dark:text-red-400">
            <AlertCircle className="h-6 w-6 mx-auto mb-2" />
            <p className="text-xs font-semibold">{error}</p>
            <button
              onClick={onClose}
              className="mt-4 rounded-xl bg-red-600 hover:bg-red-500 text-white px-4 py-2 text-xs font-bold transition shadow-md"
            >
              Đóng lại
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-xl border border-border bg-black aspect-square max-w-[280px] mx-auto flex items-center justify-center">
              {isInitializing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white bg-black/80">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <span className="text-[10px] font-bold">Đang kết nối Camera...</span>
                </div>
              )}
              <div id="qr-reader-element" className="w-full h-full" />
            </div>
            <p className="text-[11px] text-center text-muted-foreground leading-relaxed">
              Hướng mã QR của thí sinh vào khung ngắm để hệ thống tự động quét và nhận diện.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
