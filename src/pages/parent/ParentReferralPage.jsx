import { useEffect, useState } from 'react';
import {
  Users, Gift, Copy, Check, Share2, MessageCircle,
  TrendingUp, Award, Clock, Smile, UserPlus, Phone,
  Mail, User, AlertCircle, CheckCircle2, X, Send, Loader2
} from 'lucide-react';
import {
  checkMobileAPI,
  createManualReferralAPI,
  getMyReferralsAPI,
  getMyReferralStatsAPI,
  getMyReferralTrackingAPI,
  buildReferralLink,
} from '../../api/referrals';

// ─── Components ──────────────────────────────────────────────────────────────

const StatCard = ({ icon: Icon, label, value, subtext, gradient }) => (
  <div style={{
    background: gradient,
    borderRadius: '20px',
    padding: '24px',
    position: 'relative',
    overflow: 'hidden',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
  }}
  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.12)'; }}
  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.08)'; }}
  >
    <div style={{ position: 'relative', zIndex: 1 }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', backdropFilter: 'blur(8px)' }}>
        <Icon size={26} color="#fff" strokeWidth={2.5} />
      </div>
      <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.9)', marginBottom: '4px' }}>{label}</p>
      <h3 style={{ margin: 0, fontSize: '32px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>{value}</h3>
      {subtext && <p style={{ margin: '6px 0 0', fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.85)' }}>{subtext}</p>}
    </div>
    <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
  </div>
);

const ReferralLinkBox = ({ link, onCopy, copied }) => (
  <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '20px', padding: '24px', boxShadow: '0 8px 24px rgba(102,126,234,0.3)' }}>
    <div style={{ marginBottom: '16px' }}>
      <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 700, color: '#fff' }}>Your Referral Link</h3>
      <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.85)' }}>Share this link with friends to refer them</p>
    </div>
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: '200px', background: 'rgba(255,255,255,0.95)', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <input type="text" value={link} readOnly style={{ flex: 1, border: 'none', outline: 'none', fontSize: '13px', fontWeight: 500, color: '#111827', background: 'transparent' }} />
        <button onClick={onCopy}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px', border: 'none', background: copied ? '#10B981' : '#667eea', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
        >
          {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
        </button>
      </div>
    </div>
    <div style={{ marginTop: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
      <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Join BrainBuilder Preschool! Use my referral link: ${link}`)}`, '_blank')}
        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '12px', border: 'none', background: '#25D366', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(37,211,102,0.3)' }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
      >
        <MessageCircle size={16} /> WhatsApp
      </button>
      <button onClick={() => navigator.share?.({ title: 'BrainBuilder Preschool', text: 'Join me at BrainBuilder!', url: link })}
        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '12px', border: 'none', background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', backdropFilter: 'blur(8px)' }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.3)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; }}
      >
        <Share2 size={16} /> Share
      </button>
    </div>
  </div>
);

// ─── Manual Refer Form ────────────────────────────────────────────────────────
const ManualReferForm = ({ 
  onSuccess, checkLoading, submitLoading, setSubmitLoading, 
  error, setError, checkResult, setCheckResult, 
  form, setForm, referralLink, referralCode 
}) => {
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.mobile.trim()) e.mobile = 'Mobile number is required';
    else if (!/^[6-9]\d{9}$/.test(form.mobile.trim())) e.mobile = 'Enter a valid 10-digit mobile number';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Enter a valid email address';
    return e;
  };

  const handleCheck = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    // Backend only checks mobile (not email)
    try {
      const response = await checkMobileAPI(form.mobile);
      const data = response.data;

      if (data.alreadyReferred) {
        setCheckResult({
          exists: true,
          message: 'This mobile number is already referred.',
        });
      } else {
        setCheckResult({
          exists: false,
          message: 'Great! This friend is not yet registered.',
          referralCode: data.referralCode,
        });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to check mobile');
    }
  };

  const handleSubmit = async () => {
    if (checkResult?.exists) return;

    setSubmitLoading(true);
    try {
      // NOTE: Backend does NOT have shareReferrerDetails field - skip it
      const response = await createManualReferralAPI({
        friendName:   form.name,
        friendMobile: form.mobile,
        // Note: email is validated in frontend but backend doesn't store it
        // childName is optional
      });

      if (response.data.success) {
        const responseData = response.data.data;
        
        // Use referral link from props or build from API response
        const displayLink = referralLink || buildReferralLink(responseData.referralCode);
        const friendMobile = form.mobile.replace(/\D/g, ''); // Clean mobile number
        
        const whatsappMessage = encodeURIComponent(
          `🎉 *Hi ${responseData.friendName}!*\n\n` +
          `I'm excited to invite you to join *BrainBuilder Preschool* — where learning becomes an adventure! 🚀📚\n\n` +
          `✨ *Why BrainBuilder?*\n` +
          `• Fun & interactive learning\n` +
          `• Safe & nurturing environment\n` +
          `• Expert teachers\n` +
          `• Proven curriculum\n\n` +
          `👉 *Join using my referral link:*\n${displayLink}\n\n` +
          `Can't wait to see you there! 😊`
        );

        // Open WhatsApp with pre-filled message
        window.open(`https://wa.me/91${friendMobile}?text=${whatsappMessage}`, '_blank');

        // Show success dialog
        setSubmitted(true);
        onSuccess && onSuccess(form);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit referral');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleReset = () => {
    setForm({ name: '', mobile: '', email: '', shareReferrerDetails: false });
    setErrors({});
    setCheckResult(null);
    setSubmitted(false);
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    if (checkResult) setCheckResult(null); // reset check if user edits
  };

  const inputStyle = (hasError) => ({
    width: '100%',
    padding: '12px 16px 12px 44px',
    borderRadius: '12px',
    border: `1.5px solid ${hasError ? '#F87171' : '#E5E7EB'}`,
    fontSize: '14px',
    fontWeight: 500,
    color: '#111827',
    background: '#FAFAFA',
    outline: 'none',
    transition: 'all 0.2s',
    boxSizing: 'border-box',
  });

  if (submitted) {
    const displayLink = referralLink || buildReferralLink(checkResult?.referralCode || referralCode);
    
    return (
      <div style={{
        background: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)',
        borderRadius: '20px',
        padding: '36px 24px',
        textAlign: 'center',
        border: '1.5px solid #6EE7B7',
        boxShadow: '0 4px 20px rgba(16,185,129,0.1)',
      }}>
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #10B981, #059669)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
          boxShadow: '0 8px 20px rgba(16,185,129,0.3)',
          animation: 'bounceIn 0.5s ease-out',
        }}>
          <CheckCircle2 size={40} color="#fff" />
        </div>
        <h3 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: 800, color: '#065F46' }}>
          🎉 Referral Sent Successfully!
        </h3>
        <p style={{ margin: '0 0 12px', fontSize: '15px', color: '#047857', fontWeight: 600 }}>
          {form.name} ko referral link bhej diya gaya hai
        </p>
        
        {/* Referral Link Box */}
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          padding: '16px',
          margin: '16px 0',
          border: '1.5px solid #6EE7B7',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }}>
          <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Referral Link
          </p>
          <p style={{
            margin: 0,
            fontSize: '14px',
            fontWeight: 600,
            color: '#065F46',
            wordBreak: 'break-all',
            background: '#F0FDF4',
            padding: '10px 12px',
            borderRadius: '8px',
          }}>
            {displayLink}
          </p>
        </div>
        
        <p style={{ margin: '12px 0 0', fontSize: '13px', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <CheckCircle2 size={14} />
          WhatsApp open ho gaya hai — ab message send karein!
        </p>
        
        <div style={{ marginTop: '20px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button onClick={handleReset} style={{
            padding: '12px 28px', borderRadius: '12px', border: 'none',
            background: 'linear-gradient(135deg, #10B981, #059669)',
            color: '#fff', fontSize: '14px', fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserPlus size={16} /> Refer Another Friend
            </span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: '#fff',
      borderRadius: '20px',
      padding: '24px',
      border: '1.5px solid #E5E7EB',
      boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '14px',
          background: 'linear-gradient(135deg, #F59E0B, #FBBF24)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(245,158,11,0.3)', flexShrink: 0,
        }}>
          <UserPlus size={24} color="#fff" strokeWidth={2.5} />
        </div>
        <div>
          <h3 style={{ margin: '0 0 4px', fontSize: '17px', fontWeight: 800, color: '#111827' }}>
            Refer Your Connection
          </h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#6B7280' }}>
            Share your connection's details and we'll reach out to them
          </p>
        </div>
      </div>

      {/* Form Fields */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        {/* Name */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Friend's Name *
          </label>
          <div style={{ position: 'relative' }}>
            <User size={16} color="#9CA3AF" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="e.g. Pooja Gupta"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              style={inputStyle(errors.name)}
              onFocus={(e) => { e.target.style.borderColor = '#667eea'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 3px rgba(102,126,234,0.1)'; }}
              onBlur={(e) => { e.target.style.borderColor = errors.name ? '#F87171' : '#E5E7EB'; e.target.style.background = '#FAFAFA'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
          {errors.name && <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#EF4444', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={12} />{errors.name}</p>}
        </div>

        {/* Mobile */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Mobile Number *
          </label>
          <div style={{ position: 'relative' }}>
            <Phone size={16} color="#9CA3AF" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="tel"
              placeholder="e.g. 9876543210"
              value={form.mobile}
              maxLength={10}
              onChange={(e) => handleChange('mobile', e.target.value.replace(/\D/g, ''))}
              style={inputStyle(errors.mobile)}
              onFocus={(e) => { e.target.style.borderColor = '#667eea'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 3px rgba(102,126,234,0.1)'; }}
              onBlur={(e) => { e.target.style.borderColor = errors.mobile ? '#F87171' : '#E5E7EB'; e.target.style.background = '#FAFAFA'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
          {errors.mobile && <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#EF4444', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={12} />{errors.mobile}</p>}
        </div>

        {/* Email */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Email Address *
          </label>
          <div style={{ position: 'relative' }}>
            <Mail size={16} color="#9CA3AF" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="email"
              placeholder="e.g. pooja@email.com"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              style={inputStyle(errors.email)}
              onFocus={(e) => { e.target.style.borderColor = '#667eea'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 3px rgba(102,126,234,0.1)'; }}
              onBlur={(e) => { e.target.style.borderColor = errors.email ? '#F87171' : '#E5E7EB'; e.target.style.background = '#FAFAFA'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
          {errors.email && <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#EF4444', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={12} />{errors.email}</p>}
        </div>
      </div>

      {/* Check Status Banner */}
      {checkResult && (
        <div style={{
          padding: '14px 18px',
          borderRadius: '12px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: checkResult.exists ? '#FEF2F2' : '#ECFDF5',
          border: `1.5px solid ${checkResult.exists ? '#FCA5A5' : '#6EE7B7'}`,
        }}>
          {checkResult.exists
            ? <AlertCircle size={18} color="#EF4444" />
            : <CheckCircle2 size={18} color="#10B981" />}
          <div>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: checkResult.exists ? '#991B1B' : '#065F46' }}>
              {checkResult.exists ? 'Already Registered' : 'Great! This friend is not yet registered.'}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: checkResult.exists ? '#DC2626' : '#059669' }}>
              {checkResult.exists
                ? 'This mobile number is already in our system. You cannot refer this contact.'
                : 'You can proceed to send this referral to admin.'}
            </p>
          </div>
          <button onClick={() => setCheckResult(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '6px' }}>
            <X size={14} color={checkResult.exists ? '#DC2626' : '#059669'} />
          </button>
        </div>
      )}

      {/* Share Referrer Details Checkbox */}
      <div style={{
        marginBottom: '16px',
        padding: '14px 16px',
        borderRadius: '12px',
        background: '#F9FAFB',
        border: '1px solid #E5E7EB',
      }}>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={form.shareReferrerDetails}
            onChange={(e) => handleChange('shareReferrerDetails', e.target.checked)}
            style={{
              width: '18px',
              height: '18px',
              marginTop: '2px',
              accentColor: '#667eea',
              cursor: 'pointer',
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>
              Share your details with {form.name ? form.name : 'this friend'}
            </span>
            <span style={{ fontSize: '12px', color: '#6B7280' }}>
              {form.shareReferrerDetails
                ? 'Your contact information will be shared with them.'
                : 'Your contact information will NOT be shared with them.'}
            </span>
          </div>
        </label>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {/* Check Button */}
        {!checkResult && (
          <button
            onClick={handleCheck}
            disabled={checkLoading}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '12px 24px', borderRadius: '12px', border: 'none',
              background: checkLoading ? '#E5E7EB' : 'linear-gradient(135deg, #667eea, #764ba2)',
              color: checkLoading ? '#9CA3AF' : '#fff',
              fontSize: '14px', fontWeight: 700, cursor: checkLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: checkLoading ? 'none' : '0 4px 14px rgba(102,126,234,0.35)',
            }}
            onMouseEnter={(e) => { if (!checkLoading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(102,126,234,0.4)'; } }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = checkLoading ? 'none' : '0 4px 14px rgba(102,126,234,0.35)'; }}
          >
            {checkLoading
              ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Checking...</>
              : <><CheckCircle2 size={16} /> Submit</>}
          </button>
        )}

        {/* Send Referral Button */}
        {checkResult && !checkResult.exists && (
          <button
            onClick={handleSubmit}
            disabled={submitLoading}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '12px 28px', borderRadius: '12px', border: 'none',
              background: submitLoading ? '#E5E7EB' : 'linear-gradient(135deg, #10B981, #059669)',
              color: submitLoading ? '#9CA3AF' : '#fff',
              fontSize: '14px', fontWeight: 700, cursor: submitLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: submitLoading ? 'none' : '0 4px 14px rgba(16,185,129,0.35)',
            }}
          >
            {submitLoading
              ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Sending...</>
              : <><Send size={16} /> Send to Admin</>}
          </button>
        )}

        {/* Reset */}
        <button
          onClick={handleReset}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '12px 20px', borderRadius: '12px',
            border: '1.5px solid #E5E7EB', background: '#fff',
            color: '#6B7280', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#9CA3AF'; e.currentTarget.style.color = '#374151'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#6B7280'; }}
        >
          <X size={15} /> Clear
        </button>
      </div>

      {/* Helper Note */}
      <p style={{ margin: '16px 0 0', fontSize: '12px', color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <AlertCircle size={12} />
        We'll verify if this contact is already in our system before sending.
      </p>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const config = {
    pending: { bg: '#FEF3C7', text: '#D97706', label: 'Pending', icon: Clock },
    joined: { bg: '#DCFCE7', text: '#16A34A', label: 'Joined', icon: Check },
    rewarded: { bg: '#DBEAFE', text: '#2563EB', label: 'Joined & Admitted', icon: Award },
    failed: { bg: '#FEF2F2', text: '#EF4444', label: 'Failed', icon: X },
  }[status] || { bg: '#F3F4F6', text: '#6B7280', label: 'Unknown', icon: Clock };
  const Icon = config.icon;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: 600, background: config.bg, color: config.text }}>
      <Icon size={12} /> {config.label}
    </span>
  );
};

const ReferralCard = ({ referral }) => (
  <div style={{
    background: '#fff', borderRadius: '16px', padding: '20px',
    border: '1px solid #E5E7EB', transition: 'all 0.2s',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  }}
  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = '#667eea'; }}
  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = '#E5E7EB'; }}
  >
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #667eea, #764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '18px', fontWeight: 700 }}>
          {(referral.friendName || '?').charAt(0)}
        </div>
        <div>
          <h4 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 700, color: '#111827' }}>{referral.friendName || 'Unknown'}</h4>
          {referral.friendEmail && <p style={{ margin: 0, fontSize: '12px', color: '#6B7280' }}>{referral.friendEmail}</p>}
          {referral.friendMobile && (
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Phone size={10} /> {referral.friendMobile}
            </p>
          )}
        </div>
      </div>
      <StatusBadge status={referral.status} />
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', paddingTop: '12px', borderTop: '1px solid #F3F4F6' }}>
      <div>
        <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#6B7280', fontWeight: 600 }}>Child Name</p>
        <p style={{ margin: 0, fontSize: '13px', color: '#111827', fontWeight: 600 }}>{referral.childName || '-'}</p>
      </div>
      <div>
        <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#6B7280', fontWeight: 600 }}>Date Referred</p>
        <p style={{ margin: 0, fontSize: '13px', color: '#111827', fontWeight: 600 }}>
          {referral.date ? new Date(referral.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'N/A'}
        </p>
      </div>
    </div>
  </div>
);

const EmptyState = () => (
  <div style={{ background: '#fff', borderRadius: '20px', padding: '60px 24px', textAlign: 'center', border: '2px dashed #E5E7EB' }}>
    <div style={{ width: '120px', height: '120px', margin: '0 auto 24px', borderRadius: '50%', background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Smile size={56} color="#D97706" strokeWidth={1.5} />
    </div>
    <h3 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 700, color: '#111827' }}>No referrals yet!</h3>
    <p style={{ margin: 0, fontSize: '14px', color: '#6B7280', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
      Start inviting your friends and help them discover BrainBuilder!
    </p>
  </div>
);

const Toast = ({ message, onClose }) => {
  setTimeout(() => onClose(), 3000);
  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', padding: '14px 20px', borderRadius: '12px', background: '#10B981', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 8px 24px rgba(16,185,129,0.3)', zIndex: 9999, animation: 'slideUp 0.3s ease-out', minWidth: '280px' }}>
      <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Check size={14} strokeWidth={3} />
      </div>
      <span style={{ fontSize: '14px', fontWeight: 600 }}>{message}</span>
    </div>
  );
};

// ─── Helper: Map backend referral to frontend format ─────────────────────────
const mapMyReferral = (r) => ({
  id:          r.referralId || r._id,
  friendName:  r.friendName || '',
  friendEmail: '',              // Not in backend response (privacy)
  friendMobile: r.friendMobile || '',  // May be masked in tracking API
  status:      r.status || 'pending',
  date:        r.referredOn || r.createdAt || '',
  childName:   r.childName || '-',
  rewardPoints: r.rewardPoints || 0,
  joinedOn:    r.joinedOn || null,
});

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function ParentReferralPage() {
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  // API state
  const [referrals, setReferrals] = useState([]);
  const [stats, setStats] = useState({ total: 0, successful: 0, pending: 0 });
  const [referralCode, setReferralCode] = useState('');
  const [referralLink, setReferralLink] = useState('');
  const [pageLoading, setPageLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [checkLoading, setCheckLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [form, setForm] = useState({ name: '', mobile: '', email: '', shareReferrerDetails: false });
  const [checkResult, setCheckResult] = useState(null);

  // ── Fetch Data ──────────────────────────────────────────────────────────
  const fetchData = async () => {
    try {
      setPageLoading(true);

      // Fetch stats + referral code
      const statsRes = await getMyReferralStatsAPI();
      const statsData = statsRes.data.data;
      setReferralCode(statsData.referralCode || '');
      setReferralLink(buildReferralLink(statsData.referralCode));
      setStats({
        total:      statsData.stats.total      || 0,
        successful: statsData.stats.joined     || 0,
        pending:    statsData.stats.pending    || 0,
      });

      // Fetch referral history
      const referralsRes = await getMyReferralsAPI();
      setReferrals(referralsRes.data.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load data');
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleCopy = () => {
    const displayLink = referralLink || buildReferralLink(referralCode);
    navigator.clipboard.writeText(displayLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const displayLink = referralLink || buildReferralLink(referralCode);
    const msg = encodeURIComponent(
      `Hi! I'm inviting you to join BrainBuilder Preschool.\nUse my referral link: ${displayLink}`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  const handleShare = async () => {
    const displayLink = referralLink || buildReferralLink(referralCode);
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join BrainBuilder',
          text: `Join BrainBuilder using my referral code: ${referralCode}`,
          url: displayLink,
        });
      } catch (err) {
        // User cancelled share
      }
    } else {
      handleCopy();
    }
  };

  const handleReferSuccess = (formData) => {
    setToast({ message: `Referral for ${formData.name} sent to admin!` });
  };

  // Map backend status to frontend filter tabs
  const filteredReferrals = referrals.filter(r => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'pending') return r.status === 'pending';
    if (filterStatus === 'joined') return r.status === 'joined';
    if (filterStatus === 'rewarded') return r.status === 'rewarded'; // 'Admitted' tab → 'rewarded' status
    return true;
  });

  return (
    <div style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes bounceIn {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {toast && <Toast message={toast.message} onClose={() => setToast(null)} />}

      {/* Error Banner */}
      {error && (
        <div style={{
          background: '#FFF1F2', border: '1.5px solid #FECDD3', borderRadius: 12,
          padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
        }}>
          <span style={{ fontSize: 16 }}>⚠️</span>
          <p style={{ margin: 0, flex: 1, color: '#BE123C', fontSize: 13 }}>{error}</p>
          <button
            onClick={() => setError('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#BE123C' }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {pageLoading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{
            width: 40, height: 40, margin: '0 auto',
            border: '4px solid #F3F4F6', borderTopColor: '#FBBF24',
            borderRadius: '50%', animation: 'spin 0.8s linear infinite',
          }} />
          <p style={{ marginTop: 12, color: '#94A3B8' }}>Loading referrals...</p>
        </div>
      ) : (
        <>
          {/* Page Header */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #FBBF24, #F59E0B)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(251,191,36,0.3)' }}>
                <Gift size={28} color="#fff" strokeWidth={2.5} />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 800, color: '#111827', letterSpacing: '-0.5px' }}>Invite Friends</h1>
                <p style={{ margin: '6px 0 0', fontSize: '14px', color: '#6B7280' }}>Share the joy of learning at BrainBuilder</p>
              </div>
            </div>

            {/* Info Banner */}
            <div style={{ background: 'linear-gradient(135deg, #EEF2FF, #E0E7FF)', borderRadius: '16px', padding: '20px', border: '1px solid #C7D2FE', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#667eea', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Users size={24} color="#fff" strokeWidth={2.5} />
              </div>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 700, color: '#3730A3' }}>Know someone who'd love BrainBuilder?</h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#4338CA' }}>Share your referral link or fill in your friend's details below to refer them directly.</p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            <StatCard icon={Users} label="Total Referrals" value={stats.total} subtext="Friends invited" gradient="linear-gradient(135deg, #667eea, #764ba2)" />
            <StatCard icon={Check} label="Successful" value={stats.successful} subtext="Joined BrainBuilder" gradient="linear-gradient(135deg, #10B981, #059669)" />
            <StatCard icon={Clock} label="Pending" value={stats.pending} subtext="Awaiting response" gradient="linear-gradient(135deg, #F59E0B, #D97706)" />
          </div>

          {/* Manual Refer Form — WITH API INTEGRATION */}
          <div style={{ marginBottom: '32px' }}>
            <ManualReferForm
              onSuccess={handleReferSuccess}
              checkLoading={checkLoading}
              submitLoading={submitLoading}
              setSubmitLoading={setSubmitLoading}
              error={error}
              setError={setError}
              checkResult={checkResult}
              setCheckResult={setCheckResult}
              form={form}
              setForm={setForm}
              referralLink={referralLink}
              referralCode={referralCode}
            />
          </div>

          {/* Referral Link Box */}
          <div id="referral-link" style={{ marginBottom: '32px' }}>
            <ReferralLinkBox
              link={referralLink || buildReferralLink(referralCode)}
              onCopy={handleCopy}
              copied={copied}
            />
          </div>

          {/* Referral List */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={20} color="#667eea" /> Referral History
              </h3>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['all', 'pending', 'joined', 'rewarded'].map(status => (
                  <button key={status} onClick={() => setFilterStatus(status)}
                    style={{ padding: '8px 16px', borderRadius: '10px', border: 'none', background: filterStatus === status ? '#667eea' : '#F3F4F6', color: filterStatus === status ? '#fff' : '#6B7280', fontSize: '13px', fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.2s' }}
                    onMouseEnter={(e) => { if (filterStatus !== status) e.currentTarget.style.background = '#E5E7EB'; }}
                    onMouseLeave={(e) => { if (filterStatus !== status) e.currentTarget.style.background = '#F3F4F6'; }}
                  >
                    {status === 'all' ? 'All' : status === 'rewarded' ? 'Admitted' : status}
                  </button>
                ))}
              </div>
            </div>

            {filteredReferrals.length === 0 ? (
              <EmptyState />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
                {filteredReferrals.map(r => {
                  const mapped = mapMyReferral(r);
                  return (
                    <ReferralCard key={mapped.id} referral={mapped} />
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
