import React, { useState, useEffect, useRef } from 'react';
import {
  Flower2,
  Mail,
  Lock,
  User,
  LogIn,
  UserPlus,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const { loginWithEmail, loginWithGoogle, registerUser } = useAuth();

  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [gisReady, setGisReady] = useState(false);

  const googleBtnRef = useRef(null);

  // Check if Google Client ID is configured in Vite environment
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // Handle Google Real Credential Response from GIS
  const handleGoogleCredentialResponse = async (response) => {
    if (!response?.credential) {
      setErrorMsg('Không nhận được mã xác thực từ Google');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('Xác thực Google thành công, đang đăng nhập...');
    setLoading(true);

    try {
      await loginWithGoogle(response.credential);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message || 'Lỗi đăng nhập Google');
      setSuccessMsg('');
    } finally {
      setLoading(false);
    }
  };

  // Initialize Google Identity Services (GIS)
  useEffect(() => {
    if (!googleClientId) return;

    let checkInterval = null;

    const setupGis = () => {
      if (window.google?.accounts?.id && googleBtnRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleGoogleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          // Render Google's official Sign-In button
          googleBtnRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: 384,
            locale: 'vi'
          });

          setGisReady(true);
          if (checkInterval) clearInterval(checkInterval);
        } catch (err) {
          console.warn('[Google GIS] Setup warning:', err);
        }
      }
    };

    if (window.google?.accounts?.id) {
      setupGis();
    } else {
      checkInterval = setInterval(() => {
        if (window.google?.accounts?.id) {
          setupGis();
        }
      }, 300);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [googleClientId]);

  // Handle Submit (Login or Register)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (activeTab === 'login') {
        if (!email.trim() || !password) {
          throw new Error('Vui lòng nhập đầy đủ Email và Mật khẩu');
        }
        await loginWithEmail(email.trim(), password);
      } else {
        if (!name.trim() || !email.trim() || !password) {
          throw new Error('Vui lòng điền đầy đủ Họ tên, Email và Mật khẩu');
        }
        if (password.length < 6) {
          throw new Error('Mật khẩu phải từ 6 ký tự trở lên');
        }
        await registerUser(name.trim(), email.trim(), password);
        setSuccessMsg('Đăng ký tài khoản nhân viên thành công! Đang chuyển hướng...');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message || 'Thao tác không thành công');
    } finally {
      setLoading(false);
    }
  };

  // Handle Google Demo / Fallback Sign-In
  const handleGoogleDemoSignIn = async (userType = 'staff') => {
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const devMock = userType === 'admin'
        ? {
            email: 'admin.google@khflowershop.vn',
            name: 'Quản Lý Cửa Hàng (Google)',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'
          }
        : {
            email: 'nhanvien.hoa@gmail.com',
            name: 'Thợ Hoa Lan Anh (Google)',
            avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80'
          };

      await loginWithGoogle('demo_google_token', devMock);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message || 'Lỗi đăng nhập Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-card-container">
        {/* Brand Banner */}
        <div className="login-header">
          <div className="login-brand-icon">
            <Flower2 size={32} color="#ffffff" />
          </div>
          <h1 className="login-title">KHflower Shop</h1>
          <p className="login-subtitle">Hệ thống Quản lý Đơn hoa &amp; Vốn kinh doanh</p>
        </div>

        {/* Auth Mode Tabs */}
        <div className="login-tabs">
          <button
            type="button"
            className={`login-tab-btn ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => { setActiveTab('login'); setErrorMsg(''); }}
          >
            <LogIn size={16} />
            <span>Đăng nhập</span>
          </button>
          <button
            type="button"
            className={`login-tab-btn ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => { setActiveTab('register'); setErrorMsg(''); }}
          >
            <UserPlus size={16} />
            <span>Đăng ký nhân viên</span>
          </button>
        </div>

        {/* Error / Success Alerts */}
        {errorMsg && (
          <div className="login-alert error">
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="login-alert success">
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Google Authentication Section */}
        <div className="google-auth-section">
          {googleClientId ? (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div
                ref={googleBtnRef}
                id="googleSignInBtnDiv"
                style={{ width: '100%', minHeight: 44, display: 'flex', justifyContent: 'center' }}
              />
              {!gisReady && (
                <button
                  type="button"
                  className="google-signin-btn"
                  onClick={() => {
                    if (window.google?.accounts?.id) {
                      window.google.accounts.id.prompt();
                    } else {
                      handleGoogleDemoSignIn('staff');
                    }
                  }}
                  disabled={loading}
                >
                  <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Đăng nhập với Google</span>
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              className="google-signin-btn"
              onClick={() => handleGoogleDemoSignIn('staff')}
              disabled={loading}
            >
              <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Đăng nhập với Google</span>
            </button>
          )}
        </div>

        <div className="login-divider">
          <span>hoặc dùng Email &amp; Mật khẩu</span>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="login-form">
          {activeTab === 'register' && (
            <div className="form-group">
              <label htmlFor="regName">Họ và tên nhân viên</label>
              <div className="input-with-icon">
                <span className="input-icon">
                  <User size={18} />
                </span>
                <input
                  id="regName"
                  type="text"
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="authEmail">Email / Gmail</label>
            <div className="input-with-icon">
              <span className="input-icon">
                <Mail size={18} />
              </span>
              <input
                id="authEmail"
                type="email"
                placeholder="name@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="authPassword">Mật khẩu</label>
            <div className="input-with-icon">
              <span className="input-icon">
                <Lock size={18} />
              </span>
              <input
                id="authPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary login-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <span>Đang xử lý...</span>
            ) : activeTab === 'login' ? (
              <>
                <LogIn size={18} />
                <span>Đăng Nhập Ngay</span>
              </>
            ) : (
              <>
                <UserPlus size={18} />
                <span>Đăng Ký Tài Khoản</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
