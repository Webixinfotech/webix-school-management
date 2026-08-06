import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import feeService from '../../../services/feeService';

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;
const formatDate = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const ParentWallet = () => {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        setLoading(true);
        const res = await feeService.getMyWallet();
        if (res.success) {
          setWallets(res.data || []);
        } else {
          setError(res.error || 'Failed to load wallet');
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Network error');
      } finally {
        setLoading(false);
      }
    };
    fetchWallet();
  }, []);

  if (loading) return <div className="p-6 text-sm text-slate-500">Loading wallet details…</div>;
  if (error) return (
    <div className="p-6">
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
        <p className="font-semibold">We could not load the wallet right now.</p>
        <p className="mt-1">{error}</p>
        <p className="mt-2">If you made an offline payment, it may appear after admin confirmation.</p>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Wallet Balance</h1>
        <p className="mt-2 text-sm text-slate-500">Your child's fee wallet shows advance balance, payments already received, and how much has been used for invoices.</p>
        <p className="mt-2 rounded-full bg-[#FFF7ED] px-4 py-2 text-xs font-semibold text-[#92400E]">
          Online payment is not available here. Please contact the school office to make payments.
        </p>
      </div>
      {wallets.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
          <p className="text-3xl mb-3">💳</p>
          <p className="font-semibold text-slate-900">No advance balance</p>
          <p className="mt-2 text-sm">Your child's wallet will show an advance balance once fee payments are recorded by the school.</p>
          <Link to="/parent/fee/invoices" className="mt-4 inline-flex items-center justify-center rounded-full bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-700">
            View Invoices
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {wallets.map((wallet) => {
            const current = wallet.balance ?? 0;
            const totalReceived = wallet.totalReceived ?? 0;
            const totalSettled = wallet.totalSettled ?? 0;
            const advanceBalance = Math.max(0, totalReceived - totalSettled);

            return (
              <div key={wallet.studentId || wallet.id || wallet._id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Child Wallet</p>
                    <h2 className="mt-2 text-2xl font-bold text-slate-900">{wallet.studentName || wallet.student || 'Child'}</h2>
                    <p className="mt-2 text-sm text-slate-500">Student ID: {wallet.studentAdmNo || wallet.studentId || wallet.id || 'N/A'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500">Current balance</p>
                    <p className="mt-2 text-4xl font-semibold text-emerald-600">{formatCurrency(current)}</p>
                    {current > 0 && (
                      <p className="mt-1 text-xs text-slate-500">This amount will be automatically adjusted against future invoices.</p>
                    )}
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3 text-sm text-slate-700">
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <p className="text-slate-500">Total Received</p>
                    <p className="mt-2 text-xl font-semibold text-slate-900">{formatCurrency(totalReceived)}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <p className="text-slate-500">Used for Fees</p>
                    <p className="mt-2 text-xl font-semibold text-slate-900">{formatCurrency(totalSettled)}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <p className="text-slate-500">Advance Balance</p>
                    <p className="mt-2 text-xl font-semibold text-slate-900">{formatCurrency(advanceBalance)}</p>
                  </div>
                </div>

                <div className="mt-6 rounded-3xl border border-slate-100 bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-slate-900">Wallet Summary</p>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm text-slate-500">Current Balance</p>
                      <p className="mt-2 text-lg font-semibold text-slate-900">{formatCurrency(current)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Total Received</p>
                      <p className="mt-2 text-lg font-semibold text-slate-900">{formatCurrency(totalReceived)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Used for Fees</p>
                      <p className="mt-2 text-lg font-semibold text-slate-900">{formatCurrency(totalSettled)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Advance Balance</p>
                      <p className="mt-2 text-lg font-semibold text-slate-900">{formatCurrency(advanceBalance)}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-slate-500">Transaction history is not available in this view. If you made an offline payment, the balance will update after school confirmation. For detailed payment records, please check the admin portal.</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ParentWallet;
