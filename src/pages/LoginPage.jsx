import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FCMService from '../services/FCMService';
import logo from '../assets/optimized/logo/brain-builder-logo-brain-builder-logo.webp';
import talenGymLogo from '../assets/optimized/logo/brain-builder-logo-talengym.webp';
import Toast from '../components/photos/Toast';
import { Eye, EyeOff, Sparkles, GraduationCap, Brain } from 'lucide-react';

export default function LoginPage() {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // Lazy-init: surfaces why the user landed back here if the axios
  // interceptor forced a redirect (expired token or a deactivated account).
  const [toast, setToast] = useState(() => {
    const raw = sessionStorage.getItem('auth_notice');
    if (!raw) return null;
    sessionStorage.removeItem('auth_notice');
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      switch (user.role) {
        case 'admin': navigate('/admin'); break;
        case 'teacher': navigate('/teacher'); break;
        case 'parent': navigate('/parent'); break;
        default: navigate('/admin');
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!emailOrPhone.trim()) {
      setError("Please enter your email or phone number");
      return;
    }
    if (!password.trim()) {
      setError("Please enter your password");
      return;
    }

    // Request notification permission immediately, while this submit is still a user gesture.
    // Browsers ignore/deny requestPermission() called after an `await`, so do it before login().
    try {
      if (typeof Notification !== "undefined" && Notification.permission === "default") {
        await Notification.requestPermission();
      }
    } catch (_) {
      /* non-fatal */
    }

    setLoading(true);
    const result = await login(emailOrPhone, password);
    setLoading(false);

    if (result.success) {
      // Register this device for push notifications.
      // Runs through the same single source of truth (FCMService) used everywhere else.
      // Non-blocking: never throws and never blocks navigation/redirect.
      try {
        await FCMService.initialize();
        await FCMService.requestPermissionAndToken(result.token || localStorage.getItem('token'));
      } catch (err) {
        console.error('Push notification setup failed (non-blocking):', err);
      }

      setToast({
        type: 'success',
        title: 'Login Successful',
        message: `Welcome back, ${result.user.name}! Redirecting to your dashboard...`
      });
      setTimeout(() => {
        switch (result.user.role) {
          case 'admin': navigate('/admin'); break;
          case 'teacher': navigate('/teacher'); break;
          case 'parent': navigate('/parent'); break;
          default: navigate('/admin');
        }
      }, 1500);
    } else {
      const errorMsg = result.error || 'Invalid email/phone or password. Please try again.';
      setError(errorMsg);
      setToast({
        type: 'error',
        title: 'Login Failed',
        message: errorMsg
      });
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Nunito:wght@400;500;600;700&display=swap');

        * { box-sizing: border-box; }

        .lr-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Nunito', sans-serif;
          background: #f0f4ff;
          position: relative;
          overflow: hidden;
          padding: 1.5rem 1rem;
        }

        .lr-bg-circle {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }
        .lr-bg-circle-1 {
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(30,136,229,0.09) 0%, transparent 70%);
          top: -200px; left: -200px;
        }
        .lr-bg-circle-2 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(67,160,71,0.07) 0%, transparent 70%);
          bottom: -150px; right: -150px;
        }
        .lr-bg-circle-3 {
          width: 300px; height: 300px;
          background: radial-gradient(circle, rgba(251,140,0,0.07) 0%, transparent 70%);
          top: 60%; left: 10%;
        }

        .lr-dots {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background-image: radial-gradient(circle, #c7d7f0 1px, transparent 1px);
          background-size: 28px 28px;
          opacity: 0.5;
        }

        .lr-shape {
          position: absolute;
          pointer-events: none;
          animation: shapeFloat 6s ease-in-out infinite;
        }
        .lr-shape-1 {
          width: 58px; height: 58px;
          border-radius: 16px;
          background: linear-gradient(135deg, rgba(30,136,229,0.12), rgba(142,36,170,0.08));
          border: 1.5px solid rgba(30,136,229,0.18);
          top: 12%; left: 7%;
          transform: rotate(15deg);
        }
        .lr-shape-2 {
          width: 38px; height: 38px;
          border-radius: 50%;
          background: rgba(67,160,71,0.12);
          border: 1.5px solid rgba(67,160,71,0.22);
          top: 72%; left: 5%;
          animation-delay: -2s;
        }
        .lr-shape-3 {
          width: 48px; height: 48px;
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(251,140,0,0.1), rgba(229,57,53,0.07));
          border: 1.5px solid rgba(251,140,0,0.18);
          top: 14%; right: 7%;
          animation-delay: -4s;
          transform: rotate(-20deg);
        }
        .lr-shape-4 {
          width: 28px; height: 28px;
          border-radius: 50%;
          background: rgba(142,36,170,0.09);
          border: 1.5px solid rgba(142,36,170,0.18);
          bottom: 20%; right: 7%;
          animation-delay: -1s;
        }

        @keyframes shapeFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-14px); }
        }
        .lr-shape-1 { --r: 15deg; }
        .lr-shape-3 { --r: -20deg; }

        .lr-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 420px;
          background: #ffffff;
          border-radius: 24px;
          padding: 2rem 1.75rem;
          box-shadow:
            0 4px 6px rgba(0,0,0,0.03),
            0 20px 60px rgba(30,136,229,0.11),
            0 0 0 1px rgba(30,136,229,0.07);
          animation: cardIn 0.65s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(28px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }

        .lr-strip {
          position: absolute;
          top: 0; left: 10%; right: 10%;
          height: 4px;
          background: linear-gradient(90deg, #0F4C5C, #D4AF37, #0F4C5C);
          border-radius: 0 0 6px 6px;
        }

        .lr-logo-section {
          text-align: center;
          margin-bottom: 1.25rem;
          margin-top: 1rem;
          animation: fadeUp 0.5s 0.15s ease both;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .lr-title {
          font-family: 'Sora', sans-serif;
          font-size: clamp(1.4rem, 5vw, 1.8rem);
          font-weight: 800;
          color: #0F4C5C;
          margin: 0 0 0.5rem;
          letter-spacing: -0.02em;
        }
        .lr-subtitle {
          font-size: 0.9rem;
          color: #7a8baa;
          margin: 0;
          font-weight: 500;
        }

        .lr-badges {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.35rem;
          margin-top: 1rem;
          flex-wrap: wrap;
        }
        .lr-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.22rem;
          padding: 0.25rem 0.6rem;
          border-radius: 20px;
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.03em;
        }
        .lr-badge-blue   { background: rgba(15,76,92,0.1); color: #0F4C5C; border: 1px solid rgba(15,76,92,0.2); }
        .lr-badge-green  { background: rgba(212,175,55,0.1); color: #0F4C5C; border: 1px solid rgba(212,175,55,0.2); }
        .lr-badge-orange { background: #fffaf0; color: #D4AF37; border: 1px solid rgba(212,175,55,0.3); }

        .lr-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, #e0eaf8, transparent);
          margin: 1.5rem 0;
        }

        .lr-error {
          margin-bottom: 0.85rem;
          padding: 0.65rem 0.9rem;
          background: #fff5f5;
          border: 1.5px solid #fecaca;
          border-radius: 12px;
          color: #c0392b;
          font-size: 0.78rem;
          display: flex;
          align-items: flex-start;
          gap: 0.45rem;
          animation: fadeUp 0.25s ease both;
        }

        .lr-form { display: flex; flex-direction: column; gap: 1rem; }

        .lr-field { display: flex; flex-direction: column; gap: 0.35rem; }

        .lr-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: #0F4C5C;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .lr-input-wrap { position: relative; }

        .lr-input {
          width: 100%;
          padding: 0.8rem 1rem;
          background: #f7faff;
          border: 1.5px solid #dce8f8;
          border-radius: 12px;
          color: #1a2540;
          font-size: 0.95rem;
          font-family: 'Nunito', sans-serif;
          font-weight: 600;
          outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
        }
        .lr-input::placeholder { color: #b0bfd8; font-weight: 500; }
        .lr-input:focus {
          border-color: #D4AF37;
          background: #fffdf5;
          box-shadow: 0 0 0 3.5px rgba(212,175,55,0.15);
        }
        .lr-input:disabled { opacity: 0.55; cursor: not-allowed; background: #f0f4fa; }
        .lr-input-pass { padding-right: 3.2rem; }

        .lr-eye {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #b0bfd8;
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
          transition: color 0.2s;
        }
        .lr-eye:hover { color: #D4AF37; }

        .lr-btn {
          width: 100%;
          padding: 0.9rem 1rem;
          background: linear-gradient(135deg, #0F4C5C 0%, #0a3540 100%);
          border: none;
          border-radius: 12px;
          color: #fff;
          font-family: 'Sora', sans-serif;
          font-size: 1rem;
          font-weight: 700;
          letter-spacing: 0.02em;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 6px 20px rgba(15,76,92,0.3);
          margin-top: 0.5rem;
        }
        .lr-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #0a3540 0%, #051d24 100%);
          opacity: 0;
          transition: opacity 0.25s;
        }
        .lr-btn:hover:not(:disabled)::after { opacity: 1; }
        .lr-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 28px rgba(15,76,92,0.4);
        }
        .lr-btn:active:not(:disabled) { transform: translateY(0); }
        .lr-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .lr-btn-inner {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .lr-spinner {
          width: 18px; height: 18px;
          border: 2.5px solid rgba(255,255,255,0.35);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          display: inline-block;
          flex-shrink: 0;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .lr-footer {
          margin-top: 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.8rem;
        }
        .lr-forgot {
          font-size: 0.85rem;
          color: #0F4C5C;
          font-weight: 600;
          text-decoration: none;
          transition: color 0.2s;
        }
        .lr-forgot:hover { color: #D4AF37; }
        .lr-back {
          font-size: 0.8rem;
          color: #b0bfd8;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          transition: color 0.2s;
          font-weight: 500;
         }
        .lr-back:hover { color: #0F4C5C; }

        @media (max-width: 480px) {
          .lr-card { padding: 2rem 1.5rem; border-radius: 20px; }
          .lr-shape { display: none; }
        }
      `}</style>

      <div className="lr-root">
        <div className="lr-dots" />
        <div className="lr-bg-circle lr-bg-circle-1" />
        <div className="lr-bg-circle lr-bg-circle-2" />
        <div className="lr-bg-circle lr-bg-circle-3" />
        <div className="lr-shape lr-shape-1" />
        <div className="lr-shape lr-shape-2" />
        <div className="lr-shape lr-shape-3" />
        <div className="lr-shape lr-shape-4" />

        <div className="lr-card">
          <div className="lr-strip" />

          {/* Header */}
          <div className="lr-logo-section">
            <h1 className="lr-title">Zorix School</h1>
            <p className="lr-subtitle">Sign in to your dashboard</p>
            <div className="lr-badges">
              <span className="lr-badge lr-badge-blue"><Brain size={12} /> Education</span>
              <span className="lr-badge lr-badge-green"><GraduationCap size={12} /> Excellence</span>
              <span className="lr-badge lr-badge-orange"><Sparkles size={12} /> Success</span>
            </div>
          </div>

          <div className="lr-divider" />

          {/* Error */}
          {error && (
            <div className="lr-error">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="lr-form">
            <div className="lr-field">
              <label className="lr-label">Phone Number Or Email</label>
              <div className="lr-input-wrap">
                <input
                  type="text"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  placeholder="you@example.com or 9876543210"
                  required
                  disabled={loading}
                  className="lr-input"
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="lr-field">
              <label className="lr-label">Password</label>
              <div className="lr-input-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                  className="lr-input lr-input-pass"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="lr-eye"
                  tabIndex="-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="lr-btn">
              <div className="lr-btn-inner">
                {loading ? (
                  <>
                    <span className="lr-spinner" />
                    Signing in...
                  </>
                ) : (
                  'Sign In →'
                )}
              </div>
            </button>
          </form>

           {/* Footer */}
           <div className="lr-footer">
             <a href="#" className="lr-forgot">Forgot your password?</a>
             <Link to="/" className="lr-back">← Back to Home</Link>
           </div>
         </div>
      </div>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </>
  );
}