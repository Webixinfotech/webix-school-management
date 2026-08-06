// src/components/shared/SignatureUploader.jsx
//
// Reusable signature widget used by CertificateStudio, LeavingCertificateForm,
// and ExperienceCertificateForm. Signature is uploaded once per user and
// reused across documents — this component always shows whatever is
// currently saved on the user's account, with a "Change Signature" option.

import { useState, useEffect, useRef, useCallback } from 'react';
import { PenLine, Loader2, RefreshCw } from 'lucide-react';
import { documentsAPI } from '../../api/documents.api';

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function SignatureUploader({ value, onChange, label = 'Signature' }) {
  const [signatureUrl, setSignatureUrl] = useState(value || null);
  const [loading, setLoading] = useState(!value);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const syncValue = useCallback(
    (url) => {
      setSignatureUrl(url);
      onChange?.(url);
    },
    [onChange]
  );

  useEffect(() => {
    if (value) {
      setSignatureUrl(value);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await documentsAPI.getMySignature();
        if (!cancelled) syncValue(res?.data?.signatureUrl || null);
      } catch (err) {
        if (!cancelled) setError('Could not load saved signature.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const base64 = await fileToBase64(file);
      const res = await documentsAPI.uploadSignature(base64);
      syncValue(res?.data?.signatureUrl || null);
    } catch (err) {
      setError(err?.response?.data?.message || 'Signature upload failed.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-[#4a4458] flex items-center gap-1.5">
        <PenLine size={13} /> {label}
      </label>

      <div className="flex items-center gap-3 border border-[#EDE8DC] rounded-xl p-3 bg-white">
        <div className="w-28 h-14 rounded-lg border border-dashed border-[#D9D2C4] flex items-center justify-center overflow-hidden bg-[#FBFAF6] shrink-0">
          {loading ? (
            <Loader2 size={16} className="animate-spin text-[#9a92a8]" />
          ) : signatureUrl ? (
            <img src={signatureUrl} alt="Signature" className="max-w-full max-h-full object-contain" />
          ) : (
            <span className="text-[10px] text-[#9a92a8] text-center px-1">No signature yet</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#C9A24B]/50 text-[#8a6d1f] hover:bg-[#FBF3DF] transition-colors flex items-center gap-1.5 disabled:opacity-60"
          >
            {uploading ? (
              <Loader2 size={12} className="animate-spin" />
            ) : signatureUrl ? (
              <RefreshCw size={12} />
            ) : (
              <PenLine size={12} />
            )}
            {signatureUrl ? 'Change Signature' : 'Upload Signature'}
          </button>
          {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
          <p className="text-[10px] text-[#9a92a8] mt-1">
            Uploaded once, reused on every document you create.
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>
    </div>
  );
}
