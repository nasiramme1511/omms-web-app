import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Plan } from '../types';
import { CheckCircle, Plus, X, Search, UploadCloud, ArrowLeft, CreditCard, Smartphone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import OrgAdminPageHeader from '../components/org-admin/OrgAdminPageHeader';
import useBodyScrollLock from '../hooks/useBodyScrollLock';
import { useLocation, useNavigate } from 'react-router-dom';

/** Must match UpgradePlan.tsx — survives React Strict Mode remounts. */
const PAYMENTS_UPGRADE_FLAG = 'omms_payments_open_upgrade';
const PAYMENTS_UPGRADE_PLAN = 'omms_payments_upgrade_plan_id';

const Payments: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'subscription' | 'members'>('subscription');
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [editPhoneValue, setEditPhoneValue] = useState('');

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [paymentMode, setPaymentMode] = useState<'direct' | 'manual' | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'telebirr' | 'cbe_birr' | 'ebirr' | 'chapa' | null>(null);
  const [directPhone, setDirectPhone] = useState('');
  const [directAmount, setDirectAmount] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isChapaLoaded, setIsChapaLoaded] = useState(!!((window as any).Chapa || (window as any).chapa || (window as any).ChapaCheckout));
  const [isChapaFormInitializing, setIsChapaFormInitializing] = useState(false);

  const [requiresManualEntry, setRequiresManualEntry] = useState(false);
  const [manualTransactionId, setManualTransactionId] = useState('');
  const [ocrErrorMsg, setOcrErrorMsg] = useState('');

  const queryClient = useQueryClient();
  useBodyScrollLock(isUpgradeModalOpen);

  const clearUpgradeDeepLink = useCallback(() => {
    try {
      sessionStorage.removeItem(PAYMENTS_UPGRADE_FLAG);
      sessionStorage.removeItem(PAYMENTS_UPGRADE_PLAN);
    } catch {
      /* private mode */
    }
  }, []);

  const resetUpgradeWizardFields = useCallback(() => {
    setSelectedPlanId(null);
    setPaymentMode(null);
    setPaymentMethod(null);
    setReceiptFile(null);
    setDirectPhone('');
    setDirectAmount('');
    setRequiresManualEntry(false);
    setManualTransactionId('');
    setOcrErrorMsg('');
  }, []);

  const closeUpgradeModal = useCallback(() => {
    setIsUpgradeModalOpen(false);
    resetUpgradeWizardFields();
    clearUpgradeDeepLink();
  }, [resetUpgradeWizardFields, clearUpgradeDeepLink]);

  const openUpgradeModal = useCallback(() => {
    clearUpgradeDeepLink();
    resetUpgradeWizardFields();
    setIsUpgradeModalOpen(true);
  }, [clearUpgradeDeepLink, resetUpgradeWizardFields]);

  useEffect(() => {
    const state = location.state as { autoOpenUpgrade?: boolean; selectedPlanId?: string } | null;
    if (state?.autoOpenUpgrade) {
      try {
        sessionStorage.setItem(PAYMENTS_UPGRADE_FLAG, '1');
        if (state.selectedPlanId != null && state.selectedPlanId !== '') {
          sessionStorage.setItem(PAYMENTS_UPGRADE_PLAN, String(state.selectedPlanId));
        }
      } catch {
        /* ignore */
      }
      navigate(location.pathname, { replace: true });
      return;
    }

    try {
      if (sessionStorage.getItem(PAYMENTS_UPGRADE_FLAG) === '1') {
        setIsUpgradeModalOpen(true);
        const pid = sessionStorage.getItem(PAYMENTS_UPGRADE_PLAN);
        if (pid) setSelectedPlanId(pid);
      }
    } catch {
      /* ignore */
    }
  }, [location.pathname, location.state, navigate]);

  const { data: payments, isLoading: paymentsLoading } = useQuery<any[]>({
    queryKey: ['payments'],
    queryFn: () => api.get('/payments/org/all').then((res) => res.data),
  });

  const {
    data: plans,
    isLoading: plansLoading,
    isError: plansError,
    refetch: refetchPlans,
  } = useQuery<Plan[]>({
    queryKey: ['plans'],
    queryFn: () => api.get('/plans').then((res) => res.data),
  });

  const { data: config } = useQuery({
    queryKey: ['systemConfig'],
    queryFn: () => api.get('/admin/system-config').then((res) => res.data),
  });

  const { data: organization } = useQuery({
    queryKey: ['myOrganization'],
    queryFn: () => api.get('/organizations/me').then(r => r.data),
    enabled: user?.role === 'orgAdmin'
  });

  const updatePhoneMutation = useMutation({
    mutationFn: (phone: string) => api.put('/organizations/me', { payment_phone: phone }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myOrganization'] });
      alert('Payment phone updated!');
    }
  });

  const filtered = useMemo(() => {
    const list = payments ?? [];
    
    const tabFiltered = list.filter((p: any) => {
      if (activeTab === 'subscription') {
        return p.payer_type === 'organization' || !p.payer_type;
      } else {
        return p.payer_type === 'member';
      }
    });

    const q = searchTerm.trim().toLowerCase();
    if (!q) return tabFiltered;
    return tabFiltered.filter((p: any) => {
      const planName = p.plan?.name?.toLowerCase() ?? '';
      const method = p.payment_method?.toLowerCase() ?? '';
      const tid = p.transaction_id?.toLowerCase() ?? '';
      const refId = p.reference_id?.toLowerCase() ?? '';
      const memberName = p.user?.name?.toLowerCase() ?? '';
      return planName.includes(q) || method.includes(q) || tid.includes(q) || refId.includes(q) || memberName.includes(q);
    });
  }, [payments, searchTerm, activeTab]);

  const confirmMemberPaymentMutation = useMutation({
    mutationFn: (paymentId: string) => api.put(`/payments/member-to-org/${paymentId}/confirm`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      alert('Member payment confirmed!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Error confirming member payment');
    }
  });

  const rejectMemberPaymentMutation = useMutation({
    mutationFn: (paymentId: string) => api.put(`/payments/member-to-org/${paymentId}/reject`, { reason: 'Rejected by admin' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      alert('Member payment rejected!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Error rejecting member payment');
    }
  });

  const upgradeMutation = useMutation({
    mutationFn: (planId: string) =>
      api.post('/payments', {
        plan_id: planId,
        amount: plans?.find((p) => p.id === planId)?.price || 0,
        payment_method: 'Credit Card',
        transaction_id: 'TRX-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['auth', 'profile'] });
      closeUpgradeModal();
      alert('Plan upgraded successfully!');
    },
  });

  const chapaMutation = useMutation({
    mutationFn: async (data: { planId: string; phoneNumber?: string }) => {
      const res = await api.post('/chapa/initialize/plan', { 
        planId: data.planId,
        phoneNumber: data.phoneNumber,
        mode: (window as any).ChapaCheckout ? 'inline' : 'standard'
      });
      return res.data;
    },
    onSuccess: (data) => {
      console.log('Payment initialization success, response data:', data);
      if (data.status === 'success') {
        const startPay = () => {
          const chapa = (window as any).Chapa || (window as any).chapa || (window as any).ChapaCheckout;
          const publicKey = import.meta.env.VITE_CHAPA_PUBLIC_KEY;
          
          console.log('Chapa SDK detection:', { 
            Chapa: !!(window as any).Chapa, 
            chapa: !!(window as any).chapa, 
            ChapaCheckout: !!(window as any).ChapaCheckout,
            keyLoaded: !!publicKey,
            keyPrefix: publicKey?.substring(0, 12)
          });

          // INLINE EMBEDDED: Use the ChapaCheckout class to render in-platform
          if (chapa && publicKey) {
            const plan = plans?.find(p => String(p.id) === String(selectedPlanId));
            const finalAmount = plan?.price || 0;

            if (finalAmount <= 0) {
              console.error('Invalid amount for Chapa initialization:', finalAmount);
              if (data.data?.checkout_url) window.location.href = data.data.checkout_url;
              return;
            }

            console.log('Initializing Chapa Embedded Form with key:', publicKey.substring(0, 10) + '...');
            setIsChapaFormInitializing(true);
            
            const checkoutOptions = {
              public_key: publicKey.trim(), // Use snake_case
              publicKey: publicKey.trim(),  // Try camelCase too
              key: publicKey.trim(),        // Try just 'key'
              tx_ref: data.tx_ref,
              txRef: data.tx_ref,
              amount: String(finalAmount),
              currency: 'ETB',
              email: user?.email || '',
              first_name: user?.name?.split(' ')[0] || 'User',
              firstName: user?.name?.split(' ')[0] || 'User',
              last_name: user?.name?.split(' ').slice(1).join(' ') || 'Name',
              lastName: user?.name?.split(' ').slice(1).join(' ') || 'Name',
              callback_url: `${import.meta.env.VITE_API_URL}/chapa/webhook`,
              callbackUrl: `${import.meta.env.VITE_API_URL}/chapa/webhook`,
              return_url: `${window.location.origin}/org-admin/payments?tx_ref=${data.tx_ref}`,
              returnUrl: `${window.location.origin}/org-admin/payments?tx_ref=${data.tx_ref}`,
              customization: {
                title: 'Plan Upgrade',
                description: `Upgrade to ${plan?.name || 'Plan'}`,
              },
              customizations: {
                title: 'Plan Upgrade',
                description: `Upgrade to ${plan?.name || 'Plan'}`,
              },
              onSuccessfulPayment: (res: any) => {
                console.log('Chapa: Payment successful', res);
                closeUpgradeModal();
                queryClient.invalidateQueries({ queryKey: ['payments'] });
              },
              onClose: () => {
                console.log('Chapa: Form closed');
                setPaymentMode(null);
              },
              onPaymentFailure: (err: any) => {
                console.error('Chapa Payment Error (Full Object):', err);
                if (typeof err === 'string') {
                    alert('Chapa Error: ' + err);
                } else if (err?.message) {
                    alert('Chapa Error: ' + err.message);
                } else {
                    alert('Chapa Error: Charge failed to initiate. Check console for details.');
                }
              }
            };

            try {
              const attemptInit = (attempts = 0) => {
                const container = document.getElementById('chapa-inline-form');
                if (container) {
                  container.innerHTML = ''; // Clear container before init
                  const CheckoutClass = (window as any).ChapaCheckout || chapa;
                  if (!CheckoutClass) {
                    console.error('Chapa SDK not loaded');
                    setIsChapaFormInitializing(false);
                    if (data.data?.checkout_url) {
                      window.location.href = data.data.checkout_url;
                    } else {
                      alert('Chapa SDK not loaded');
                    }
                    return;
                  }
                  if (typeof CheckoutClass === 'function') {
                    const checkout = new CheckoutClass(checkoutOptions);
                    try {
                      checkout.initialize('chapa-inline-form');
                      setIsChapaFormInitializing(false);
                    } catch (initErr) {
                      console.error('SDK Initialization Call Failed:', initErr);
                      setIsChapaFormInitializing(false);
                      if (data.data?.checkout_url) {
                        window.location.href = data.data.checkout_url;
                      } else {
                        alert('Failed to initialize payment form. Please try again.');
                      }
                    }
                  }
                } else if (attempts < 20) {
                  setTimeout(() => attemptInit(attempts + 1), 100);
                } else {
                  console.error('chapa-inline-form container not found');
                  setIsChapaFormInitializing(false);
                  alert('Payment container could not be loaded.');
                }
              };
              attemptInit();
              return;
            } catch (e) {
              console.error('Embedded form logic error:', e);
            }
          }

          // REDIRECT FALLBACK: If embedded form fails or SDK is missing
          if (data.data?.checkout_url) {
            console.log('Redirecting to Chapa checkout...');
            window.location.href = data.data.checkout_url;
          } else {
            alert('Payment initialization failed.');
            setPaymentMode(null);
          }
        };

        // Try to start immediately
        startPay();
      } else {
        setPaymentMode(null);
        alert(data.message || 'Chapa initialization failed.');
      }
    },
    onError: (error: any) => {
      setPaymentMode(null);
      alert(error.response?.data?.message || error.message || 'Failed to initialize Chapa payment');
    }
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: (paymentId: number) => api.put(`/payments/${paymentId}/confirm`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      alert('Payment confirmed and user plan updated!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Error confirming payment');
    }
  });

  const orgPlanPaymentMutation = useMutation({
    mutationFn: (data: { planId: string; method: string; transactionId: string }) =>
      api.post('/payments/org-plan', {
        plan_id: data.planId,
        payment_method: data.method,
        manual_transaction_id: data.transactionId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      closeUpgradeModal();
      alert('Organization plan payment submitted! It will be confirmed by SuperAdmin shortly.');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Error submitting organization payment');
    }
  });

  const uploadReceiptMutation = useMutation({
    mutationFn: (data: { planId: string; file: File; method: string; manualTxnId?: string }) => {
      const formData = new FormData();
      formData.append('plan_id', data.planId.toString());
      formData.append('receipt', data.file);
      formData.append('payment_method', data.method);
      if (data.manualTxnId) {
        formData.append('manual_transaction_id', data.manualTxnId);
      }
      return api.post('/payments/upload-receipt', formData);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      closeUpgradeModal();
      alert('Receipt uploaded successfully!');
    },
    onError: (error: any) => {
      const errResponse = error.response?.data;
      if (errResponse?.requiresManualEntry) {
         setRequiresManualEntry(true);
         setOcrErrorMsg(errResponse.message || 'We could not automatically read your receipt. Please enter the Transaction ID manually.');
      } else {
         alert(errResponse?.message || 'Error uploading receipt');
      }
    }
  });

  const selectedPlan = useMemo(
    () => plans?.find((p) => String(p.id) === String(selectedPlanId)),
    [plans, selectedPlanId]
  );

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanId || !receiptFile || !paymentMethod) return;

    if (requiresManualEntry && !manualTransactionId.trim()) {
        alert("Please enter the Transaction ID manually.");
        return;
    }

    uploadReceiptMutation.mutate({
        planId: selectedPlanId,
        file: receiptFile,
        method: paymentMethod,
        manualTxnId: requiresManualEntry ? manualTransactionId : undefined
    });
  };

  const handleOrgPlanPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanId || !paymentMethod || !manualTransactionId.trim()) return;

    orgPlanPaymentMutation.mutate({
      planId: selectedPlanId,
      method: paymentMethod,
      transactionId: manualTransactionId
    });
  };

  return (
    <div className="space-y-6 font-poppins">
      <OrgAdminPageHeader
        title="Payments"
        subtitle="View subscription charges and payment history"
      />

      {user?.role === 'orgAdmin' && (
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-gray-200">
          <div className="flex min-w-0">
            <button
              type="button"
              className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${
                activeTab === 'subscription'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('subscription')}
            >
              My Subscription
            </button>
            <button
              type="button"
              className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${
                activeTab === 'members'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('members')}
            >
              Member Payments
            </button>
          </div>
          <button
            type="button"
            onClick={openUpgradeModal}
            className="mb-0.5 inline-flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-indigo-500 sm:px-5 sm:py-2.5"
          >
            <Plus size={18} />
            Upgrade plan
          </button>
        </div>
      )}

      {activeTab === 'members' && organization && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Receiving Phone Number</h3>
            <p className="text-xs text-gray-500 mt-1">This is the phone number your members will send money to.</p>
          </div>
          <div className="flex items-center gap-3">
            {isEditingPhone ? (
              <>
                <input
                  type="text"
                  value={editPhoneValue}
                  onChange={(e) => setEditPhoneValue(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                  placeholder="+251..."
                />
                <button
                  onClick={() => {
                    updatePhoneMutation.mutate(editPhoneValue);
                    setIsEditingPhone(false);
                  }}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold shadow-sm transition"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditingPhone(false)}
                  className="px-3 py-1.5 text-gray-500 hover:bg-gray-100 rounded-lg text-sm font-bold transition"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <span className="font-mono font-bold text-gray-800 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                  {organization.payment_phone || 'Not set'}
                </span>
                <button
                  onClick={() => {
                    setEditPhoneValue(organization.payment_phone || '');
                    setIsEditingPhone(true);
                  }}
                  className="text-indigo-600 text-sm font-bold hover:underline px-2"
                >
                  Edit
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="search"
          placeholder="Search by plan, method, or transaction ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Payment history</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/80 text-gray-500 text-[11px] font-bold uppercase tracking-wider">
              <tr>
                {user?.role === 'SuperAdmin' && <th className="px-4 py-3">Organization</th>}
                {activeTab === 'members' && <th className="px-4 py-3">Member</th>}
                <th className="px-4 py-3">{activeTab === 'members' ? 'Reference' : 'Plan'}</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Transaction ID</th>
                {activeTab === 'members' && <th className="px-4 py-3">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paymentsLoading ? (
                <tr>
                  <td
                    colSpan={user?.role === 'SuperAdmin' ? 7 : 6}
                    className="px-4 py-10 text-center text-gray-400"
                  >
                    Loading payments...
                  </td>
                </tr>
              ) : filtered?.length === 0 ? (
                <tr>
                  <td
                    colSpan={user?.role === 'SuperAdmin' ? 7 : (activeTab === 'members' ? 8 : 6)}
                    className="px-4 py-10 text-center text-gray-400"
                  >
                    No payment history found
                  </td>
                </tr>
              ) : (
                filtered?.map((payment: any) => (
                  <tr key={payment.id} className="hover:bg-gray-50/80">
                    {user?.role === 'SuperAdmin' && (
                      <td className="px-4 py-4 text-sm font-medium text-gray-900">
                        {payment.user?.organization_name || payment.user?.name}
                      </td>
                    )}
                    {activeTab === 'members' && (
                      <td className="px-4 py-4 text-sm font-medium text-gray-900">
                        {payment.user?.name}
                      </td>
                    )}
                    <td className="px-4 py-4 font-bold text-gray-900">
                      {activeTab === 'members' ? payment.reference_id : payment.plan?.name}
                    </td>
                    <td className="px-4 py-4 text-gray-800 font-semibold">
                      ETB {Number(payment.amount).toFixed(2)}
                    </td>
                    <td className="px-4 py-4 text-gray-600">{payment.payment_method}</td>
                    <td className="px-4 py-4 text-gray-600 whitespace-nowrap">
                      {new Date(payment.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                            <span
                              className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide
                              ${payment.status === 'pending' ? 'bg-amber-50 text-amber-800'
                                : payment.status === 'rejected' ? 'bg-red-50 text-red-800'
                                : 'bg-emerald-50 text-emerald-800'}`}
                            >
                              <CheckCircle size={12} />
                              {payment.status}
                            </span>
                            {(user?.role === 'SuperAdmin' || (user?.role === 'orgAdmin' && activeTab === 'members')) && payment.status === 'pending' && (
                              <div className="flex gap-2 mt-2 flex-wrap">
                                {payment.receipt_url && (
                                  <a
                                    href={`/uploads/${payment.receipt_url.replace(/\\/g, '/').replace(/^uploads[\/\\]/, '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100"
                                  >
                                    View Receipt
                                  </a>
                                )}
                                {activeTab === 'members' ? (
                                  <>
                                    <button
                                      onClick={() => confirmMemberPaymentMutation.mutate(payment.id)}
                                      disabled={confirmMemberPaymentMutation.isPending}
                                      className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-200"
                                    >
                                      Confirm
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (window.confirm('Are you sure you want to reject this payment?')) {
                                          rejectMemberPaymentMutation.mutate(payment.id);
                                        }
                                      }}
                                      disabled={rejectMemberPaymentMutation.isPending}
                                      className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
                                    >
                                      Reject
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => confirmPaymentMutation.mutate(payment.id)}
                                    disabled={confirmPaymentMutation.isPending}
                                    className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-200"
                                  >
                                    Confirm
                                  </button>
                                )}
                              </div>
                            )}
                        </div>
                        {payment.status === 'rejected' && payment.rejection_reason && (
                            <p className="text-[10px] text-red-600 font-medium">
                                Reason: {payment.rejection_reason}
                            </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-[10px] font-mono text-gray-400 uppercase">
                      {payment.transaction_id}
                    </td>
                    {activeTab === 'members' && <td className="px-4 py-4"></td>}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isUpgradeModalOpen &&
        createPortal(
          <div
            className="fixed inset-0 flex items-center justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm z-[9999]"
            onClick={(e) => { if (e.target === e.currentTarget) closeUpgradeModal(); }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="upgrade-plan-dialog-title"
          >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto border border-gray-100 animate-in fade-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                {(selectedPlanId || paymentMode) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (paymentMethod) setPaymentMethod(null);
                      else if (paymentMode) setPaymentMode(null);
                      else setSelectedPlanId(null);
                    }}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                    aria-label="Go back"
                  >
                    <ArrowLeft size={20} />
                  </button>
                )}
                <h3 id="upgrade-plan-dialog-title" className="text-xl font-black text-gray-900">
                  {!selectedPlanId 
                    ? 'Choose Your Plan' 
                    : paymentMode === 'direct'
                    ? 'Redirecting to Payment'
                    : !paymentMethod 
                      ? 'Choose Payment Method' 
                      : 'Upload Payment Receipt'}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeUpgradeModal}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8">
              {plansLoading && !selectedPlanId ? (
                <div className="text-center py-16 text-gray-400">Loading available plans...</div>
              ) : plansError && !selectedPlanId ? (
                <div className="mx-auto max-w-md rounded-2xl border border-rose-100 bg-rose-50/80 px-6 py-8 text-center">
                  <p className="text-sm font-bold text-rose-900">We couldn’t load the plan list</p>
                  <p className="mt-2 text-xs leading-relaxed text-rose-800/90">
                    Your browser couldn’t get the list of plans from the server (often the server is off, offline, or
                    the address is wrong). Try again in a moment.
                  </p>
                  <button
                    type="button"
                    onClick={() => refetchPlans()}
                    className="mt-5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-500"
                  >
                    Try again
                  </button>
                </div>
              ) : !plansLoading && !selectedPlanId && (!plans || plans.length === 0) ? (
                <div className="mx-auto max-w-md rounded-2xl border border-amber-100 bg-amber-50/80 px-6 py-8 text-center text-sm text-amber-950">
                  <p className="font-bold">There are no plans to choose from</p>
                  <p className="mt-2 text-xs leading-relaxed text-amber-900/90">
                    Upgrading works by picking a plan (like Basic or Pro). Right now the system returned an empty list,
                    so there is nothing to pick. Someone who controls this app needs to create plans on the server
                    before you can upgrade.
                  </p>
                </div>
              ) : selectedPlanId ? (
                paymentMode === 'direct' ? (
                  <div className="animate-in fade-in duration-500">
                     <div className="relative min-h-[400px]">
                        {/* Loader overlay - separate from the Chapa container to avoid React DOM conflicts */}
                        {isChapaFormInitializing && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center py-12 bg-white/80 z-20 rounded-3xl">
                              <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6"></div>
                              <h3 className="text-xl font-black text-slate-900">Initializing Secure Checkout...</h3>
                              <p className="text-sm text-slate-500 mt-2 text-center px-4">
                                Preparing the payment form. Please wait.
                              </p>
                          </div>
                        )}
                        
                        {/* This container will hold the Chapa Inline form rendered by their SDK */}
                        <div id="chapa-inline-form" className="min-h-[400px] border border-slate-100 rounded-3xl p-4 bg-slate-50/30"></div>
                     </div>
                     
                     {!chapaMutation.isSuccess && (
                        <div className="flex justify-center mt-6">
                           <button 
                             onClick={() => { setPaymentMode(null); setPaymentMethod(null); }}
                             className="text-slate-500 text-sm font-bold hover:text-slate-700 transition-colors"
                           >
                             Cancel and go back
                           </button>
                        </div>
                     )}
                  </div>
                ) : !paymentMethod ? (
                  <div className="space-y-6">
                    {!paymentMode ? (
                      <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <button
                          type="button"
                          disabled={chapaMutation.isPending}
                          onClick={() => {
                            setPaymentMode('direct');
                            setPaymentMethod('chapa');
                            if (selectedPlanId) chapaMutation.mutate({ planId: selectedPlanId });
                          }}
                          className="flex flex-col items-center p-8 rounded-3xl border-2 border-slate-100 hover:border-indigo-600 hover:bg-indigo-50/10 transition-all text-center group disabled:opacity-50"
                        >
                          <div className="h-16 w-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            {chapaMutation.isPending ? (
                              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <Smartphone className="h-8 w-8 text-indigo-600" />
                            )}
                          </div>
                          <span className="text-base font-black text-slate-900 mb-1">Direct Pay</span>
                          <p className="text-[11px] text-slate-500 max-w-[150px] leading-tight">
                            {chapaMutation.isPending ? 'Initializing...' : 'Instant activation via Telebirr, CBE Birr or Card. No receipt needed.'}
                          </p>
                        </button>
                        <button
                          type="button"
                          disabled={chapaMutation.isPending}
                          onClick={() => setPaymentMode('manual')}
                          className="flex flex-col items-center p-8 rounded-3xl border-2 border-slate-100 hover:border-amber-600 hover:bg-amber-50/10 transition-all text-center group disabled:opacity-50"
                        >
                          <div className="h-16 w-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <UploadCloud className="h-8 w-8 text-amber-600" />
                          </div>
                          <span className="text-base font-black text-slate-900 mb-1">Manual Pay</span>
                          <p className="text-[11px] text-slate-500 max-w-[150px] leading-tight">
                            Pay using your preferred app first, then upload a screenshot for verification.
                          </p>
                        </button>
                      </div>
                    ) : paymentMode === 'manual' && (
                      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center justify-between mb-4">
                          <button 
                            type="button" 
                            onClick={() => { setPaymentMode(null); setPaymentMethod(null); }}
                            className="text-sm font-bold text-indigo-600 hover:underline flex items-center gap-1"
                          >
                            <ArrowLeft size={16} /> Change Method
                          </button>
                          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Manual Upload</span>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('telebirr')}
                            className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${
                              paymentMethod === 'telebirr'
                                ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                : 'border-gray-100 text-gray-600 hover:border-indigo-300'
                            }`}
                          >
                            <img src="/asset/telebirr-logo.png" alt="Telebirr" className="h-10 w-10 object-contain mb-2" />
                            <span className="text-[10px] font-bold">Telebirr</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('cbe_birr')}
                            className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${
                              paymentMethod === 'cbe_birr'
                                ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                : 'border-gray-100 text-gray-600 hover:border-indigo-300'
                            }`}
                          >
                            <img src="/asset/cbe-logo.png" alt="CBE Birr" className="h-10 w-10 object-contain mb-2" />
                            <span className="text-[10px] font-bold">CBE Birr</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('ebirr')}
                            className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${
                              paymentMethod === 'ebirr'
                                ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                : 'border-gray-100 text-gray-600 hover:border-indigo-300'
                            }`}
                          >
                            <img src="/asset/ebirr-logo.png" alt="E-Birr" className="h-10 w-10 object-contain mb-2" />
                            <span className="text-[10px] font-bold">E-Birr</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="max-w-lg mx-auto">
                      <div className="flex items-center justify-center gap-3 mb-6">
                         <img
                             src={paymentMethod === 'telebirr'
                                 ? "/asset/telebirr-logo.png"
                                 : "/asset/cbe-logo.png"}
                             alt="Logo"
                             className="w-10 h-10 object-contain"
                          />
                         <h4 className="text-xl font-black text-gray-800">
                            {paymentMethod === 'telebirr' ? 'Telebirr Payment' : 'CBE Birr Payment'}
                         </h4>
                      </div>

                      {false ? (
                      <div>
                      <p className="mb-4 text-gray-800 text-sm font-medium bg-amber-50 border border-amber-100 p-4 rounded-lg">
                        Please transfer the exact amount to the platform account: <br/>
                        <strong className="text-xl tracking-wider text-amber-900 mt-2 block">
                          {paymentMethod === 'telebirr' 
                            ? (config?.telebirrPhone || '+251 912 345 678')
                            : (config?.cbeBirrPhone || '+251 987 654 321')}
                        </strong>
                      </p>
                      {config?.paymentInstructions && (
                        <p className="mb-4 p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800 italic">
                          "{config.paymentInstructions}"
                        </p>
                      )}
                      <p className="mb-6 text-gray-600 text-sm text-center">
                        Enter the transaction ID from your Telebirr or CBE Birr receipt below.
                      </p>
                      <form onSubmit={handleOrgPlanPayment} className="space-y-6">
                         <div>
                             <label className="block text-sm font-semibold text-gray-700 mb-1">
                                 Transaction ID / Ref No.
                             </label>
                             <input
                                 type="text"
                                 required
                                 value={manualTransactionId}
                                 onChange={(e) => setManualTransactionId(e.target.value)}
                                 placeholder="Enter transaction ID from your receipt"
                                 className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                             />
                             <p className="text-xs text-gray-500 mt-2">
                               A SuperAdmin will manually verify this transaction ID.
                             </p>
                         </div>
                         <button
                           type="submit"
                           disabled={orgPlanPaymentMutation.isPending || !manualTransactionId.trim()}
                           className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl disabled:opacity-50 transition-colors"
                         >
                            {orgPlanPaymentMutation.isPending ? 'Submitting...' : 'Submit Payment'}
                         </button>
                      </form>
                      </div>
                      ) : (
                      <div>
                      {selectedPlan && (
                        <div className="mb-4 rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-3 text-sm text-indigo-900">
                          <span className="font-bold">{selectedPlan.name}</span>
                          <span className="text-indigo-700"> — transfer exactly </span>
                          <span className="font-black">ETB {Number(selectedPlan.price).toFixed(2)}</span>
                        </div>
                      )}
                      <p className="mb-4 text-gray-800 text-sm font-medium bg-amber-50 border border-amber-100 p-4 rounded-lg">
                        Please transfer the exact amount using {paymentMethod === 'telebirr' ? 'Telebirr' : 'CBE Birr'} to: <br/>
                        <strong className="text-xl tracking-wider text-amber-900 mt-2 block">
                          {paymentMethod === 'telebirr' 
                            ? (config?.telebirrPhone || '+251 912 345 678')
                            : (config?.cbeBirrPhone || '+251 987 654 321')}
                        </strong>
                      </p>
                      {config?.paymentInstructions && (
                        <p className="mb-4 p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800 italic">
                          "{config.paymentInstructions}"
                        </p>
                      )}
                      <ul className="mb-6 text-gray-600 text-sm list-disc list-inside space-y-1">
                        <li>Use the same method you selected above so automated checks can read your receipt.</li>
                        <li>Upload a clear screenshot of the success or confirmation screen (not your home screen).</li>
                        <li>We read the transaction ID and amount from the image; if anything is unclear, you can enter the ID manually.</li>
                      </ul>
                      <form onSubmit={handleUploadSubmit} className="space-y-6">
                         <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors bg-gray-50/50">
                             <UploadCloud className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                         <label className="cursor-pointer">
                             <span className="block text-sm font-semibold text-indigo-600 hover:text-indigo-500">
                                 Browse for image
                             </span>
                             <input
                                type="file"
                                accept="image/png, image/jpeg, image/jpg"
                                className="hidden"
                                onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) {
                                      setReceiptFile(f);
                                      setRequiresManualEntry(false);
                                      setManualTransactionId('');
                                      setOcrErrorMsg('');
                                    }
                                }}
                             />
                         </label>
                         <p className="mt-1 text-xs text-gray-500">PNG, JPG up to 5MB</p>
                     </div>

                     {receiptFile && (
                         <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-sm text-indigo-700 font-medium">
                             Selected: {receiptFile.name}
                         </div>
                     )}

                     {requiresManualEntry && (
                         <div className="bg-red-50 border border-red-200 rounded-xl p-5 space-y-4 animate-in fade-in slide-in-from-top-4">
                             <div className="text-red-800 text-sm font-bold">
                                 {ocrErrorMsg}
                             </div>
                             <div>
                                 <label className="block text-sm font-semibold text-gray-700 mb-1">
                                     Transaction ID / Ref No.
                                 </label>
                                 <input
                                     type="text"
                                     required
                                     value={manualTransactionId}
                                     onChange={(e) => setManualTransactionId(e.target.value)}
                                     placeholder="e.g. TXN123456789"
                                     className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                 />
                                 <p className="text-xs text-gray-500 mt-2">
                                     An admin will manually verify this transaction ID against your uploaded screenshot.
                                 </p>
                             </div>
                         </div>
                     )}

                     <div className="flex flex-col sm:flex-row gap-4 pt-4">
                         <button
                           type="submit"
                           disabled={
                             uploadReceiptMutation.isPending ||
                             !receiptFile ||
                             (requiresManualEntry && !manualTransactionId.trim())
                           }
                           className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl disabled:opacity-50 transition-colors"
                         >
                            {uploadReceiptMutation.isPending ? 'Processing...' : requiresManualEntry ? 'Submit with manual ID' : 'Verify payment'}
                         </button>
                     </div>
                  </form>
                  </div>
                      )}
                  </div>
                )
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {plans?.map((plan) => (
                    <div
                      key={plan.id}
                      className="border-2 border-gray-100 rounded-2xl p-8 flex flex-col hover:border-indigo-200 hover:shadow-lg transition-all"
                    >
                      <h4 className="text-xs font-black text-indigo-600 mb-3 uppercase tracking-widest">
                        {plan.name}
                      </h4>
                      <div className="mb-6">
                        <span className="text-4xl font-black text-gray-900">ETB {plan.price}</span>
                        <span className="text-gray-500 font-semibold"> / {plan.billing_cycle}</span>
                      </div>
                      <ul className="space-y-3 mb-8 flex-1 text-sm text-gray-700">
                        <li className="flex items-center gap-2">
                          <CheckCircle size={16} className="text-indigo-600 shrink-0" />
                          Up to {plan.max_members} members
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle size={16} className="text-indigo-600 shrink-0" />
                          {plan.duration_days} days access
                        </li>
                      </ul>
                      <div className="flex flex-col gap-3">
                          <button
                            type="button"
                            onClick={() => setSelectedPlanId(String(plan.id))}
                            className="w-full py-3 px-4 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition-colors text-sm sm:text-base flex items-center justify-center"
                          >
                            {user?.role === 'orgAdmin' ? 'Pay via Bank Transfer' : 'Pay with Mobile Money'}
                          </button>
                          {user?.role !== 'orgAdmin' && (
                          <button
                            type="button"
                            onClick={() => upgradeMutation.mutate(plan.id)}
                            disabled={upgradeMutation.isPending}
                            className="w-full py-3 px-4 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 disabled:opacity-50 text-xs sm:text-sm transition-colors flex items-center justify-center"
                          >
                            {upgradeMutation.isPending ? 'Processing...' : 'Simulate API Card Payment'}
                          </button>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>,
          document.body
        )}
    </div>
  );
};

export default Payments;
