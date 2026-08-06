import React, { useState, useRef } from 'react';
import { 
  downloadBulkTemplateAPI, 
  previewBulkUploadAPI, 
  commitBulkUploadAPI 
} from '../../api/inventoryApi';
import { useNavigate } from 'react-router-dom';
import Toast, { useToast } from '../../components/Toast';

export default function BulkUploadWizardPage() {
  const { toast, showToast, hideToast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [commitResult, setCommitResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleDownloadTemplate = async () => {
    try {
      const res = await downloadBulkTemplateAPI();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'inventory-bulk-upload-template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      showToast('error', 'Failed to download template. Please try again.');
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handlePreview = async () => {
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const fd = new FormData();
      fd.append('file', file);
      
      const res = await previewBulkUploadAPI(fd);
      setPreviewData(res.data);
      setStep(2);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Failed to preview file.';
      setError(msg);
      showToast('error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCommit = async () => {
    if (!previewData || !previewData.rows) return;
    try {
      setLoading(true);
      setError(null);
      
      const payload = {
        rows: previewData.rows.filter(r => r.isValid)
      };
      
      const res = await commitBulkUploadAPI(payload);
      setCommitResult(res.data);
      setStep(3);
      showToast('success', `Successfully imported ${res.data?.createdCount || 0} items.`);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Failed to commit upload.';
      setError(msg);
      showToast('error', msg);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep(1);
    setFile(null);
    setPreviewData(null);
    setCommitResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <Toast toast={toast} onClose={hideToast} />
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Bulk Upload Wizard</h1>
          <p className="text-slate-500 mt-1 font-medium">Upload multiple items at once using an Excel template</p>
        </div>
        <button
          onClick={() => navigate('/admin/inventory/items')}
          className="text-slate-500 hover:text-slate-700 font-bold bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 transition-colors"
        >
          Back to Items
        </button>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center mb-8 relative">
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-100 -z-10 -translate-y-1/2 rounded-full"></div>
        <div className="absolute top-1/2 left-0 h-1 bg-indigo-500 -z-10 -translate-y-1/2 rounded-full transition-all duration-500" style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}></div>
        
        <div className="flex-1 flex flex-col items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg mb-2 transition-colors ${step >= 1 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-200 text-slate-400'}`}>1</div>
          <span className={`text-xs font-bold uppercase tracking-wider ${step >= 1 ? 'text-indigo-700' : 'text-slate-400'}`}>Upload</span>
        </div>
        <div className="flex-1 flex flex-col items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg mb-2 transition-colors ${step >= 2 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-200 text-slate-400'}`}>2</div>
          <span className={`text-xs font-bold uppercase tracking-wider ${step >= 2 ? 'text-indigo-700' : 'text-slate-400'}`}>Preview</span>
        </div>
        <div className="flex-1 flex flex-col items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg mb-2 transition-colors ${step >= 3 ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-slate-200 text-slate-400'}`}>3</div>
          <span className={`text-xs font-bold uppercase tracking-wider ${step >= 3 ? 'text-emerald-600' : 'text-slate-400'}`}>Complete</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 font-semibold flex items-start gap-3">
          <svg className="w-6 h-6 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p>{error}</p>
            {step === 2 && <button onClick={reset} className="mt-2 text-sm underline text-red-700">Start over</button>}
          </div>
        </div>
      )}

      {/* Step 1: Upload */}
      {step === 1 && (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 animate-in fade-in zoom-in-95 duration-300">
          <div className="text-center max-w-lg mx-auto mb-8">
            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Download Template</h2>
            <p className="text-slate-500 mb-6">First, download our official Excel template. Fill it out carefully following the column headers.</p>
            <p className="text-xs text-slate-400 mb-4 px-4">Headers: name, categoryName, itemTypes, unit, currentStock, minStockLevel, storageLocation, sellingPrice, securityDepositAmount, availableForSale, vendorName, vendorContact</p>
            <button 
              onClick={handleDownloadTemplate}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold transition-colors shadow-sm inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Template
            </button>
          </div>
          
          <div className="border-t border-slate-100 pt-8 max-w-lg mx-auto text-center">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Upload Completed File</h2>
            <div 
              className={`border-2 border-dashed rounded-2xl p-8 transition-colors ${file ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'}`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx, .xls, .csv"
                className="hidden" 
              />
              {file ? (
                <div>
                  <svg className="w-10 h-10 text-indigo-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="font-bold text-indigo-700 text-lg">{file.name}</p>
                  <p className="text-indigo-500 text-sm mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                  <button className="text-slate-500 underline text-sm mt-4">Change file</button>
                </div>
              ) : (
                <div className="cursor-pointer">
                  <svg className="w-10 h-10 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="font-bold text-slate-700">Click to browse or drag file here</p>
                  <p className="text-slate-400 text-sm mt-1">Supports .xlsx, .xls</p>
                </div>
              )}
            </div>
            
            <button 
              disabled={!file || loading}
              onClick={handlePreview}
              className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-200 border-t-white"></div>
                  Parsing...
                </>
              ) : (
                'Preview Data'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Preview */}
      {step === 2 && previewData && (
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 animate-in fade-in zoom-in-95 duration-300">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-6 border-b border-slate-100 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Preview Data</h2>
              <p className="text-slate-500 mt-1">Found {previewData.totalRows} rows in the file.</p>
            </div>
            <div className="flex gap-4">
              <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl font-bold text-center">
                <span className="block text-2xl">{previewData.validCount || 0}</span>
                <span className="text-xs uppercase tracking-wider">Valid</span>
              </div>
              <div className={`px-4 py-2 rounded-xl font-bold text-center ${previewData.errorCount > 0 ? 'bg-red-50 text-red-700' : 'bg-slate-50 text-slate-500'}`}>
                <span className="block text-2xl">{previewData.errorCount || 0}</span>
                <span className="text-xs uppercase tracking-wider">Errors</span>
              </div>
            </div>
          </div>

          {previewData.errorCount > 0 && (
            <div className="bg-red-50 p-4 rounded-xl mb-6 border border-red-100">
              <h3 className="font-bold text-red-800 flex items-center gap-2 mb-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                Please fix the following errors and re-upload:
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-sm text-red-700 font-medium">
                {previewData.rows?.filter(r => !r.isValid).map((errRow, i) => (
                  <li key={i}>Row {errRow.rowNumber}: {errRow.errors?.join(', ')}</li>
                ))}
              </ul>
            </div>
          )}

          {previewData.validCount > 0 && (
            <div className="mb-6">
              <h3 className="font-bold text-slate-700 mb-3">Preview of Valid Rows (First 5)</h3>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                    <tr>
                      <th className="p-3">Name</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Item Types</th>
                      <th className="p-3 text-center">Stock</th>
                      <th className="p-3 text-right">Price (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewData.rows?.filter(r => r.isValid).slice(0, 5).map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="p-3 font-semibold text-slate-800">{row.name}</td>
                        <td className="p-3 text-slate-500">{row.categoryName}</td>
                        <td className="p-3">
                          <span className="px-2 py-1 bg-slate-100 rounded text-xs font-bold text-slate-600">{row.itemTypes}</span>
                        </td>
                        <td className="p-3 text-center text-slate-500">{row.currentStock}</td>
                        <td className="p-3 text-right font-semibold text-slate-800">₹{row.sellingPrice || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-4 border-t border-slate-100">
            <button 
              onClick={reset}
              className="flex-1 px-6 py-4 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Cancel & Start Over
            </button>
            <button 
              disabled={previewData.errorCount > 0 || loading}
              onClick={handleCommit}
              className="flex-1 px-6 py-4 rounded-xl font-bold text-white bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-200 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {loading ? (
                 <div className="animate-spin rounded-full h-5 w-5 border-2 border-emerald-200 border-t-white"></div>
              ) : 'Commit Upload'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Complete */}
      {step === 3 && commitResult && (
        <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-100 text-center animate-in zoom-in-95 duration-500">
          <div className="w-24 h-24 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-800 mb-2">Upload Successful!</h2>
          <p className="text-lg text-slate-500 mb-8 font-medium">
            Successfully imported <span className="text-slate-900 font-bold">{commitResult.createdCount || 0}</span> items into the inventory.
          </p>
          <div className="flex justify-center gap-4">
            <button 
              onClick={reset}
              className="px-6 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Upload Another File
            </button>
            <button 
              onClick={() => navigate('/admin/inventory/items')}
              className="px-6 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition-colors"
            >
              View Items
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
