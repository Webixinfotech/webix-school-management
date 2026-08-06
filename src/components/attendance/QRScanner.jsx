import { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { markAttendanceByQR } from '../../api/attendance';
import { ATTENDANCE_STATUS } from '../../utils/attendanceConstants';
import Toast from '../photos/Toast';

const QRScanner = ({ classId, onAttendanceMarked, onClose }) => {
  const [scanResult, setScanResult] = useState('');
  const [isScanning, setIsScanning] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const scannerRef = useRef(null);
  const scannerInstanceRef = useRef(null);

  useEffect(() => {
    if (isScanning && !scannerInstanceRef.current) {
      initializeScanner();
    }

    return () => {
      if (scannerInstanceRef.current) {
        scannerInstanceRef.current.clear().catch(console.error);
        scannerInstanceRef.current = null;
      }
    };
  }, [isScanning]);

  const initializeScanner = () => {
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
      showTorchButtonIfSupported: true,
      showZoomSliderIfSupported: true,
      defaultZoomValueIfSupported: 2,
    };

    scannerInstanceRef.current = new Html5QrcodeScanner(
      'qr-reader',
      config,
      false
    );

    scannerInstanceRef.current.render(onScanSuccess, onScanError);
  };

  const onScanSuccess = async (decodedText) => {
    if (isProcessing) return;

    setScanResult(decodedText);
    setIsScanning(false);
    setIsProcessing(true);

    try {
      // Stop the scanner
      if (scannerInstanceRef.current) {
        await scannerInstanceRef.current.clear();
        scannerInstanceRef.current = null;
      }

      // Process the QR code
      const qrData = {
        qrCode: decodedText,
        classId: classId,
        timestamp: new Date().toISOString()
      };

      const result = await markAttendanceByQR(qrData);

      setToast({
        show: true,
        message: `Attendance marked successfully for ${result.student?.name || 'Student'}`,
        type: 'success'
      });

      // Call the callback
      if (onAttendanceMarked) {
        onAttendanceMarked(result);
      }

      // Auto close after success
      setTimeout(() => {
        onClose && onClose();
      }, 2000);

    } catch (error) {
      console.error('QR Scan Error:', error);
      setToast({
        show: true,
        message: error.message || 'Failed to mark attendance. Please try again.',
        type: 'error'
      });

      // Resume scanning on error
      setIsProcessing(false);
      setIsScanning(true);
    }
  };

  const onScanError = (error) => {
    // Ignore scan errors, they're usually just "No QR code found"
    console.debug('QR Scan Error:', error);
  };

  const handleManualRetry = () => {
    setScanResult('');
    setIsScanning(true);
    setIsProcessing(false);
  };

  const handleClose = () => {
    if (scannerInstanceRef.current) {
      scannerInstanceRef.current.clear().catch(console.error);
      scannerInstanceRef.current = null;
    }
    onClose && onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">QR Attendance Scanner</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Scanner Container */}
          <div className="mb-4">
            {isScanning ? (
              <div id="qr-reader" className="w-full"></div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-gray-600 mb-2">QR Code Scanned Successfully!</p>
                <p className="text-sm text-gray-500 break-all">{scanResult}</p>
              </div>
            )}
          </div>

          {/* Status */}
          {isProcessing && (
            <div className="text-center py-4">
              <div className="inline-flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                Processing attendance...
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {!isScanning && !isProcessing && (
              <button
                onClick={handleManualRetry}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Scan Another
              </button>
            )}
            <button
              onClick={handleClose}
              className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>

          {/* Instructions */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Instructions:</strong> Point your camera at the student's QR code.
              Make sure the code is well-lit and in focus for best results.
            </p>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </div>
  );
};

export default QRScanner;