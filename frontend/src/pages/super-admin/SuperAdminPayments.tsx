import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { Search, MoreVertical, X, AlertTriangle, Settings } from 'lucide-react';
import useBodyScrollLock from '../../hooks/useBodyScrollLock';
import SystemConfigPage from './SystemConfig';

const SuperAdminPayments: React.FC = () => {
  const { data: payments, isLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: () => api.get('/payments').then((r) => r.data),
  });

  const { data: orgPayments, isLoading: orgPaymentsLoading } = useQuery({
    queryKey: ['org-payments'],
    queryFn: () => api.get('/payments/org/all').then((r) => r.data),
  });

  const [activeTab, setActiveTab] = useState<'transactions' | 'orgPayments' | 'invoices' | 'settings'>('transactions');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<any | null>(null);
  
  // Professional Action Modal State
  const [actionModal, setActionModal] = useState<{type: 'reject' | 'revoke', paymentId: number, isOrgPayment?: boolean} | null>(null);
  const [actionReason, setActionReason] = useState('');

  useBodyScrollLock(!!selected || !!actionModal);

  const queryClient = useQueryClient();

  const confirmPaymentMutation = useMutation({
    mutationFn: (paymentId: number) => api.put(`/payments/${paymentId}/confirm`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setSelected(null);
      alert('Payment confirmed and user plan updated!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Error confirming payment');
    }
  });

  const confirmOrgPaymentMutation = useMutation({
    mutationFn: (paymentId: number) => api.put(`/payments/org/${paymentId}/confirm`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setSelected(null);
      alert('Organization payment confirmed!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Error confirming organization payment');
    }
  });

  const rejectOrgPaymentMutation = useMutation({
    mutationFn: (data: { paymentId: number; reason: string }) =>
      api.put(`/payments/org/${data.paymentId}/reject`, { reason: data.reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setActionModal(null);
      setActionReason('');
      setSelected(null);
      alert('Organization payment rejected.');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Error rejecting organization payment');
    }
  });

  const rejectPaymentMutation = useMutation({
    mutationFn: (data: { paymentId: number; reason: string }) => 
      api.put(`/payments/${data.paymentId}/reject`, { reason: data.reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setActionModal(null);
      setActionReason('');
      setSelected(null);
      alert('Payment rejected successfully.');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Error rejecting payment');
    }
  });

  const revokePaymentMutation = useMutation({
    mutationFn: (data: { paymentId: number; reason: string }) => 
      api.put(`/payments/${data.paymentId}/revoke`, { reason: data.reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setActionModal(null);
      setActionReason('');
      setSelected(null);
      alert('Payment revoked and user downgraded successfully.');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Error revoking payment');
    }
  });

  const filtered = useMemo(() => {
    let list = payments ?? [];
    
    // Default: Hide rejected and revoked payments unless they specifically search for them
    const term = q.trim().toLowerCase();
    if (!term) {
        list = list.filter((p: any) => p.status !== 'rejected' && p.status !== 'revoked');
    }

    if (!term) return list;
    
    return list.filter((p: any) => {
      const plan = p.plan?.name ?? '';
      const member = p.user?.name ?? p.user_id ?? '';
      const tx = p.transaction_id ?? '';
      const status = p.status ?? '';
      return (
        String(plan).toLowerCase().includes(term) ||
        String(member).toLowerCase().includes(term) ||
        String(tx).toLowerCase().includes(term) ||
        String(status).toLowerCase().includes(term)
      );
    });
  }, [payments, q]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Payments &amp; Subscriptions</h1>
        <p className="text-sm text-slate-500">Organization plans and payment activity</p>
      </div>

      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2 text-sm font-bold border-b-2 ${
            activeTab === 'transactions'
              ? 'text-sky-600 border-sky-600'
              : 'text-slate-500 border-transparent'
          }`}
        >
          User Payments
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('orgPayments')}
          className={`px-4 py-2 text-sm font-bold border-b-2 ${
            activeTab === 'orgPayments'
              ? 'text-sky-600 border-sky-600'
              : 'text-slate-500 border-transparent'
          }`}
        >
          Organization Payments
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('invoices')}
          className={`px-4 py-2 text-sm font-medium border-b-2 ${
            activeTab === 'invoices' ? 'border-sky-600 text-sky-600' : 'border-transparent text-slate-500'
          }`}
        >
          Invoices &amp; Receipts
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 text-sm font-bold border-b-2 ${
            activeTab === 'settings'
              ? 'text-sky-600 border-sky-600'
              : 'text-slate-500 border-transparent'
          }`}
        >
          <div className="flex items-center gap-2">
            <Settings size={16} />
            Payment Settings
          </div>
        </button>
      </div>

      {activeTab === 'settings' ? (
        <SystemConfigPage />
      ) : (
        <>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              placeholder="Search…"
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-sm"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {activeTab === 'transactions' ? (
                    <>
                      <th className="text-left p-3 font-bold text-slate-600">Plan</th>
                      <th className="text-left p-3 font-bold text-slate-600">Amount</th>
                      <th className="text-left p-3 font-bold text-slate-600">Billing</th>
                      <th className="text-left p-3 font-bold text-slate-600">Member</th>
                    </>
                  ) : activeTab === 'orgPayments' ? (
                    <>
                      <th className="text-left p-3 font-bold text-slate-600">Organization</th>
                      <th className="text-left p-3 font-bold text-slate-600">Plan</th>
                      <th className="text-left p-3 font-bold text-slate-600">Amount</th>
                      <th className="text-left p-3 font-bold text-slate-600">Method</th>
                      <th className="text-left p-3 font-bold text-slate-600">Status</th>
                    </>
                  ) : (
                    <>
                      <th className="text-left p-3 font-bold text-slate-600">Invoice</th>
                      <th className="text-left p-3 font-bold text-slate-600">Member</th>
                      <th className="text-left p-3 font-bold text-slate-600">Amount</th>
                      <th className="text-left p-3 font-bold text-slate-600">Method</th>
                    </>
                  )}
                  <th className="w-10 p-3" />
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      Loading…
                    </td>
                  </tr>
                ) : !filtered?.length ? (
                  <tr>
                    <td colSpan={activeTab === 'orgPayments' ? 5 : 5} className="p-8 text-center text-slate-500">
                      No payments yet
                    </td>
                  </tr>
                ) : activeTab === 'orgPayments' ? (
                  orgPayments?.map((p: any) => (
                    <tr key={p.id} className="border-t border-slate-100">
                      <td className="p-3 font-medium">{p.user?.organization_name || p.payer_id || '—'}</td>
                      <td className="p-3 text-slate-600">{p.plan?.name ?? '—'}</td>
                      <td className="p-3">${p.amount ?? 0}</td>
                      <td className="p-3 text-slate-600">{p.payment_method ?? '—'}</td>
                      <td className="p-3">
                        <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                          p.status === 'pending' ? 'bg-amber-50 text-amber-800'
                          : p.status === 'rejected' ? 'bg-red-50 text-red-800'
                          : 'bg-emerald-50 text-emerald-800'}`}>
                          {p.status}
                        </span>
                        {p.status === 'pending' && (
                          <div className="flex gap-2 mt-1">
                            <button
                              onClick={() => confirmOrgPaymentMutation.mutate(p.id)}
                              disabled={confirmOrgPaymentMutation.isPending}
                              className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-200"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setActionModal({ type: 'reject', paymentId: p.id })}
                              className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  filtered.map((p: any) => (
                    <tr key={p.id} className="border-t border-slate-100">
                      {activeTab === 'transactions' ? (
                        <>
                          <td className="p-3 font-medium">{p.plan?.name ?? '—'}</td>
                          <td className="p-3">${p.amount ?? 0}</td>
                          <td className="p-3 text-slate-600">{p.plan?.billing_cycle ?? '—'}</td>
                          <td className="p-3 text-slate-600">{p.user?.name ?? p.user_id ?? '—'}</td>
                        </>
                      ) : (
                        <>
                          <td className="p-3 font-medium">{p.transaction_id ?? '—'}</td>
                          <td className="p-3 text-slate-600">{p.user?.name ?? p.user_id ?? '—'}</td>
                          <td className="p-3">${p.amount ?? 0}</td>
                          <td className="p-3 text-slate-600">{p.payment_method ?? '—'}</td>
                        </>
                      )}
                      <td className="p-3">
                        <button
                          type="button"
                          className="p-1 text-slate-400 hover:text-slate-600"
                          aria-label="Payment actions"
                          onClick={() => setSelected(p)}
                        >
                          <MoreVertical size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {selected ? (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900">Payment details</p>
                <p className="text-xs text-slate-500">
                  {selected.transaction_id ? `Invoice: ${selected.transaction_id}` : 'Invoice: —'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="p-2 rounded hover:bg-gray-50"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-slate-600">Member</span>
                <span className="font-semibold text-slate-900">
                  {selected.user?.name ?? selected.user_id ?? '—'}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-600">Plan</span>
                <span className="font-semibold text-slate-900">{selected.plan?.name ?? '—'}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-600">Amount</span>
                <span className="font-semibold text-slate-900">${selected.amount ?? 0}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-600">Billing</span>
                <span className="font-semibold text-slate-900">
                  {selected.plan?.billing_cycle ?? '—'}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-600">Payment method</span>
                <span className="font-semibold text-slate-900">{selected.payment_method ?? '—'}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-600">Status</span>
                <span className="font-semibold text-slate-900">{selected.status ?? '—'}</span>
              </div>
              {selected.createdAt ? (
                <div className="flex justify-between gap-4">
                  <span className="text-slate-600">Created</span>
                  <span className="font-semibold text-slate-900">
                    {new Date(selected.createdAt).toLocaleString()}
                  </span>
                </div>
              ) : null}

              {/* ACTION BUTTONS */}
              {(selected.status === 'pending' || selected.status === 'completed') && (
                <div className="pt-4 mt-4 border-t border-slate-100 flex flex-col gap-3">
                  {selected.receipt_url && (
                    <a
                      href={`/uploads/${selected.receipt_url.replace(/\\/g, '/').replace(/^uploads[\/\\]/, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full text-center py-2 bg-blue-50 text-blue-700 font-bold rounded hover:bg-blue-100"
                    >
                      View Uploaded Receipt
                    </a>
                  )}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setActionModal({ type: selected.status === 'completed' ? 'revoke' : 'reject', paymentId: selected.id })}
                      className={`flex-1 py-2 font-bold rounded ${selected.status === 'completed' ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                    >
                      {selected.status === 'completed' ? 'Revoke Payment & Downgrade' : 'Reject'}
                    </button>
                    
                    {selected.status === 'pending' && (
                      <button
                        onClick={() => confirmPaymentMutation.mutate(selected.id)}
                        disabled={confirmPaymentMutation.isPending}
                        className="flex-1 py-2 bg-emerald-600 text-white font-bold rounded hover:bg-emerald-500 disabled:opacity-50"
                      >
                        {confirmPaymentMutation.isPending ? 'Confirming...' : 'Confirm'}
                      </button>
                    )}
                    {selected.payer_type === 'organization' && selected.status === 'pending' && (
                      <>
                        <button
                          onClick={() => confirmOrgPaymentMutation.mutate(selected.id)}
                          disabled={confirmOrgPaymentMutation.isPending}
                          className="flex-1 py-2 bg-emerald-600 text-white font-bold rounded hover:bg-emerald-500 disabled:opacity-50"
                        >
                          {confirmOrgPaymentMutation.isPending ? 'Confirming...' : 'Confirm Org Payment'}
                        </button>
                        <button
                          onClick={() => setActionModal({ type: 'reject', paymentId: selected.id, isOrgPayment: true })}
                          className="flex-1 py-2 bg-red-100 text-red-700 font-bold rounded hover:bg-red-200"
                        >
                          Reject Org Payment
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* ACTION MODAL FOR REJECT / REVOKE */}
      {actionModal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-[60]"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">
            <div className={`p-6 border-b ${actionModal.type === 'revoke' ? 'bg-red-50/50' : 'bg-gray-50/50'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${actionModal.type === 'revoke' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                   <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900">
                    {actionModal.type === 'revoke' ? 'Revoke Payment' : 'Reject Payment'}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {actionModal.type === 'revoke' 
                      ? "This will cancel the user's active plan." 
                      : "The user will be notified of this rejection."}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
               <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Reason for {actionModal.type === 'revoke' ? 'revocation' : 'rejection'}
               </label>
               <textarea
                  autoFocus
                  rows={3}
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder={actionModal.type === 'revoke' ? "e.g., Fraudulent transaction detected..." : "e.g., Receipt is blurry..."}
                  className="w-full rounded-xl border border-gray-300 p-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none"
               />
            </div>

            <div className="p-4 bg-gray-50 flex gap-3 border-t border-gray-100">
               <button
                  type="button"
                  onClick={() => {
                      setActionModal(null);
                      setActionReason('');
                  }}
                  className="flex-1 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition-colors"
               >
                  Cancel
               </button>
               <button
                  type="button"
                  disabled={!actionReason.trim() || rejectPaymentMutation.isPending || revokePaymentMutation.isPending}
                  onClick={() => {
                      if (actionModal?.type === 'revoke') {
                          revokePaymentMutation.mutate({ paymentId: actionModal.paymentId, reason: actionReason.trim() });
                      } else if (actionModal?.isOrgPayment) {
                          rejectOrgPaymentMutation.mutate({ paymentId: actionModal.paymentId, reason: actionReason.trim() });
                      } else {
                          rejectPaymentMutation.mutate({ paymentId: actionModal.paymentId, reason: actionReason.trim() });
                      }
                  }}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-white transition-colors disabled:opacity-50 ${actionModal.type === 'revoke' ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700'}`}
               >
                  {actionModal.type === 'revoke' 
                     ? (revokePaymentMutation.isPending ? 'Revoking...' : 'Confirm Revoke')
                     : (rejectPaymentMutation.isPending ? 'Rejecting...' : 'Confirm Reject')}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminPayments;
