import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const API = '/api';

function normalizeRole(role) {
  return typeof role === 'string' ? role.trim().toUpperCase() : '';
}

function getHomeRouteForRole(role) {
  switch (normalizeRole(role)) {
    case 'ADMIN':
      return '/admin/dashboard';
    case 'RESTAURANT':
      return '/restaurant/dashboard';
    default:
      return '/home';
  }
}

function getFriendlyServerMessage(status, fallback) {
  if (status === 502 || status === 503 || status === 504) {
    return 'Backend server is not reachable. Start the Spring Boot app on http://localhost:8081 and try again.';
  }
  return fallback;
}

export default function StableLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [heroImageLoaded, setHeroImageLoaded] = useState(true);

  const burgerHeroImage = '/login image.png';

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const authResponse = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const rawText = await authResponse.text();
      let authData;

      try {
        authData = rawText ? JSON.parse(rawText) : {};
      } catch {
        authData = { success: false, message: rawText || `Unexpected response (${authResponse.status})` };
      }

      if (authResponse.status === 403) {
        navigate('/verify-otp', { state: { email } });
        return;
      }

      if (authResponse.ok && authData.success) {
        const userRole = normalizeRole(authData.role);

        if (userRole === 'DRIVER') {
          const driverResponse = await fetch(`${API}/drivers/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });

          if (!driverResponse.ok) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('driver');
            setMessage('Driver account is not ready for dashboard access.');
            return;
          }

          const driverData = await driverResponse.json();
          if (authData.token) localStorage.setItem('token', authData.token);
          localStorage.removeItem('user');
          localStorage.setItem('driver', JSON.stringify(driverData));
          navigate('/driver/dashboard', { replace: true });
          return;
        }

        if (authData.token) localStorage.setItem('token', authData.token);
        localStorage.removeItem('driver');
        localStorage.setItem('user', JSON.stringify({
          id: authData.userId,
          name: authData.name,
          email: authData.email,
          role: authData.role,
        }));
        navigate(getHomeRouteForRole(userRole), { replace: true });
        return;
      }

      const driverResponse = await fetch(`${API}/drivers/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (driverResponse.ok) {
        const driverData = await driverResponse.json();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.setItem('driver', JSON.stringify(driverData));
        navigate('/driver/dashboard', { replace: true });
        return;
      }

      setMessage(getFriendlyServerMessage(authResponse.status, authData.message || 'Invalid credentials.'));
    } catch (error) {
      setMessage(error.message || 'Server error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #fcf7f2 0%, #f7ede4 52%, #fcf7f2 100%)',
        padding: '32px 16px 24px',
      }}
    >
      <style>{`
        .stable-login-shell {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0;
          align-items: start;
          overflow: hidden;
          border-radius: 32px;
          background: #ffffff;
          box-shadow: 0 24px 80px rgba(145, 88, 44, 0.12);
        }

        @media (min-width: 1024px) {
          .stable-login-shell {
            grid-template-columns: minmax(0, 1.08fr) minmax(0, 0.92fr);
            align-items: stretch;
          }
        }
      `}</style>
      <div
        className="stable-login-shell"
        style={{
          maxWidth: 1360,
          margin: '0 auto',
        }}
      >
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            minHeight: 640,
            height: '100%',
            background: heroImageLoaded
              ? `linear-gradient(180deg, rgba(19, 19, 19, 0.52) 0%, rgba(19, 19, 19, 0.62) 100%), url("${burgerHeroImage}") center/cover no-repeat`
              : 'linear-gradient(180deg, #ff7337 0%, #ff8753 52%, #ffa37a 100%)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '46px 48px',
          }}
        >
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                borderRadius: 999,
                padding: '10px 14px',
                color: '#ffd4c2',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.14)',
                backdropFilter: 'blur(10px)',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
              }}
            >
              Welcome to Foodyy
            </div>

            <div style={{ marginTop: 28, maxWidth: 540 }}>
              <h2 style={{ margin: 0, fontSize: 64, lineHeight: 1.02, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.05em' }}>
                Great food,
                <br />
                <span style={{ color: '#ffc0a7' }}>delivered fast.</span>
              </h2>
              <p style={{ margin: '24px 0 0', maxWidth: 420, fontSize: 18, lineHeight: 1.9, color: 'rgba(255,245,238,0.84)' }}>
                Sign in to discover curated meals, fast doorstep delivery, and a smoother ordering experience.
              </p>
            </div>
          </div>

          {!heroImageLoaded ? (
            <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', color: '#fff7ed', padding: '24px 16px' }}>
              <div style={{ fontSize: 18, fontWeight: 800 }}>Login image not found</div>
              <div style={{ marginTop: 10, fontSize: 14, lineHeight: 1.7, color: 'rgba(255,247,237,0.88)' }}>
                Add your image as
                <br />
                `frontend/public/login image.png`
              </div>
            </div>
          ) : null}

          {heroImageLoaded ? (
            <img
              src={burgerHeroImage}
              alt="Food hero preview"
              onError={() => setHeroImageLoaded(false)}
              style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
            />
          ) : null}
        </div>

        <div
          style={{
            background: '#ffffff',
            alignSelf: 'stretch',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '48px 56px',
          }}
        >
          <div style={{ width: '100%', maxWidth: 540, margin: '0 auto', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 28 }}>
              <div style={{ width: 48, height: 48, borderRadius: 18, background: 'linear-gradient(135deg, #ff6b2c, #ff844f)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 22, boxShadow: '0 14px 26px rgba(255, 107, 44, 0.22)' }}>
                F
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#10213f', letterSpacing: '-0.03em' }}>Foodyy</div>
                <div style={{ fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#7b8798' }}>Secure login</div>
              </div>
            </div>

            <h1 style={{ margin: '0 0 10px', fontSize: 34, fontWeight: 800, color: '#10213f', letterSpacing: '-0.04em' }}>Welcome back</h1>
            <p style={{ margin: '0 0 26px', color: '#506176', lineHeight: 1.8, fontSize: 16 }}>
              Sign in to manage orders, deliveries, menus, and account activity from one polished workspace.
            </p>

            {message ? (
              <div style={{ marginBottom: 16, borderRadius: 16, background: '#fff4f4', border: '1px solid #f8caca', color: '#b42318', padding: 12, textAlign: 'left' }}>
                {message}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
              <label htmlFor="email" style={{ display: 'block', fontSize: 14, fontWeight: 700, color: '#223554', marginBottom: 8 }}>
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                style={{ width: '100%', padding: '15px 16px', borderRadius: 16, border: '1px solid #f2c6a7', marginBottom: 18, fontSize: 15, background: 'rgba(255,255,255,0.96)', color: '#10213f', outline: 'none' }}
                required
              />

              <label htmlFor="password" style={{ display: 'block', fontSize: 14, fontWeight: 700, color: '#223554', marginBottom: 8 }}>
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Your password"
                style={{ width: '100%', padding: '15px 16px', borderRadius: 16, border: '1px solid #f2c6a7', marginBottom: 20, fontSize: 15, background: 'rgba(255,255,255,0.96)', color: '#10213f', outline: 'none' }}
                required
              />

              <button
                type="submit"
                disabled={loading}
                style={{ width: '100%', border: 0, borderRadius: 16, padding: '15px 16px', background: 'linear-gradient(135deg, #ff6b2c, #ff844f)', color: '#fff', fontSize: 16, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, boxShadow: '0 16px 30px rgba(255, 107, 44, 0.24)' }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div style={{ marginTop: 22, display: 'grid', gap: 12, fontSize: 14, justifyItems: 'center' }}>
              <Link to="/forgot-password" style={{ color: '#44556d', textDecoration: 'none', fontWeight: 600 }}>Forgot password?</Link>
              <Link to="/customer-signup" style={{ color: '#44556d', textDecoration: 'none' }}>Create customer account</Link>
              <Link to="/restaurant-signup" style={{ color: '#44556d', textDecoration: 'none' }}>Register restaurant</Link>
              <Link to="/driver/signup" style={{ color: '#44556d', textDecoration: 'none' }}>Register driver</Link>
              <Link to="/email-otp-login" style={{ color: '#ff6b2c', textDecoration: 'none', fontWeight: 700 }}>Login with OTP</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
