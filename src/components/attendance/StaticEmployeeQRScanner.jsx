import { useState, useRef, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, ScanLine, CheckCircle2, AlertCircle, Loader2, User } from 'lucide-react';
import { scanEmployeeIdCard } from '../../api/employeeAttendance';

// Cooldown key is per scanned QR string, distinct from the self-scan
// 'staff_last_scan_time' key — repeated proxy scans of the SAME employee's
// ID card within this window are treated as an accidental double-tap.
const COOLDOWN_MS = 2 * 60 * 1000;
const cooldownKey = (qr) => `proxy_scan_cooldown_${qr}`;

const getCurrentLocation = () =>
  new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 5000 },
    );
  });

/**
 * Camera scanner for an EMPLOYEE'S STATIC ID-CARD QR (Teacher.qrCode) —
 * marks attendance for whoever's card gets scanned, not the person holding
 * the phone. Meant for staff without a phone: an admin, or a teacher with
 * canScanEmployeeQR permission, scans the ID card on the employee's behalf.
 *
 * Usage:
 *   <StaticEmployeeQRScanner embedded onSuccess={...} />              // dedicated page
 *   <StaticEmployeeQRScanner onClose={...} onSuccess={...} />          // modal
 */
const StaticEmployeeQRScanner = ({ onClose, onSuccess, embedded = false }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [result, setResult] = useState(null); // { type: 'success'|'error', message, data? }

  const scannerRef = useRef(null);
  const isScanningRef = useRef(false);

  useEffect(() => {
    startCamera();
    return () => { stopCamera(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCamera = async () => {
    setCameraError('');
    await new Promise((r) => setTimeout(r, 150));
    const readerEl = document.getElementById('proxy-reader');
    if (!readerEl) { setCameraError('Scanner element not found. Please refresh.'); return; }
    try {
      const html5QrCode = new Html5Qrcode('proxy-reader');
      scannerRef.current = html5QrCode;
      const cfg = { fps: 10, qrbox: { width: 230, height: 230 }, aspectRatio: 1 };
      try {
        await html5QrCode.start({ facingMode: 'environment' }, cfg, handleScan, () => {});
      } catch {
        await html5QrCode.start({ facingMode: 'user' }, cfg, handleScan, () => {});
      }
    } catch (err) {
      const msg = err?.message || '';
      if (msg.includes('Permission') || msg.includes('NotAllowed')) {
        setCameraError('Camera permission denied. Allow camera access in browser settings and try again.');
      } else if (msg.includes('NotFound') || msg.includes('DevicesNotFound')) {
        setCameraError('No camera found on this device.');
      } else {
        setCameraError('Could not start camera. Please check browser settings.');
      }
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState?.();
        if (state === 2 || state === 3) await scannerRef.current.stop();
        scannerRef.current = null;
      } catch { scannerRef.current = null; }
    }
  };

  const handleScan = async (decodedText) => {
    if (isScanningRef.current) return;

    const key = cooldownKey(decodedText);
    const lastScan = localStorage.getItem(key);
    if (lastScan) {
      const diff = Date.now() - parseInt(lastScan, 10);
      if (diff < COOLDOWN_MS) {
        const secsLeft = Math.ceil((COOLDOWN_MS - diff) / 1000);
        setResult({ type: 'error', message: `This ID card was just scanned. Please wait ${secsLeft}s before scanning it again.` });
        setTimeout(() => setResult(null), 3000);
        return;
      }
    }

    isScanningRef.current = true;
    setIsScanning(true);
    setResult(null);

    try {
      const location = await getCurrentLocation();
      const response = await scanEmployeeIdCard(decodedText, location);

      if (response?.success) {
        localStorage.setItem(key, Date.now().toString());
        setResult({ type: 'success', message: response.message, data: response });
        onSuccess?.(response);
        setTimeout(() => {
          setResult(null);
          isScanningRef.current = false;
        }, 3000);
      }
    } catch (err) {
      const errorMsg = err?.response?.data?.error || err?.response?.data?.message || 'Scan failed. Please try again.';
      setResult({ type: 'error', message: errorMsg });
      setTimeout(() => {
        setResult(null);
        isScanningRef.current = false;
      }, 3000);
    } finally {
      setIsScanning(false);
    }
  };

  const handleClose = async () => {
    await stopCamera();
    onClose?.();
  };

  const content = (
    <div className={embedded ? '' : 'bg-white rounded-2xl shadow-xl w-full max-w-md mx-auto'}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <ScanLine className="w-5 h-5 text-cyan-600" />
          <h3 className="font-semibold text-slate-800">Scan Employee ID Card</h3>
        </div>
        {onClose && (
          <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        )}
      </div>

      <div className="p-5">
        <p className="text-sm text-slate-500 mb-4">
          Point the camera at the employee's ID card QR code to mark their attendance.
        </p>

        {cameraError ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <AlertCircle className="w-10 h-10 text-rose-500" />
            <p className="text-sm text-rose-600">{cameraError}</p>
            <button
              onClick={startCamera}
              className="px-4 py-2 rounded-lg bg-cyan-600 text-white text-sm font-medium hover:bg-cyan-700"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="relative rounded-xl overflow-hidden bg-slate-900">
            <div id="proxy-reader" style={{ width: '100%' }} />
            {isScanning && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            )}
          </div>
        )}

        {result && (
          <div
            className={`mt-4 rounded-xl p-4 flex items-start gap-3 ${
              result.type === 'success' ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200'
            }`}
          >
            {result.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div>
              {result.data?.employeeName && (
                <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-0.5">
                  <User className="w-3.5 h-3.5" /> {result.data.employeeName}
                </div>
              )}
              <p className={`text-sm ${result.type === 'success' ? 'text-emerald-700' : 'text-rose-700'}`}>
                {result.message}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (embedded) return content;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      {content}
    </div>
  );
};

export default StaticEmployeeQRScanner;
