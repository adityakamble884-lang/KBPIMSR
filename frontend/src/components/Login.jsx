import React, { useState } from 'react';
import { KeyRound, User, Lock, AlertCircle } from 'lucide-react';

export default function Login({ onLoginSuccess, apiUrl }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) return;
    
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${apiUrl}/api/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed. Please check your credentials.');
      }

      onLoginSuccess(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Quick Login Assist
  const handleQuickLogin = (usr, pwd) => {
    setUsername(usr);
    setPassword(pwd);
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center py-5">
        <div className="col-md-5 animate-fade-in-up">
          
          <div className="glass-panel p-4 p-md-5 shadow">
            
            <div className="text-center mb-4">
              <div 
                className="d-inline-flex align-items-center justify-content-center mb-3"
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '16px',
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  color: 'var(--color-gold)'
                }}
              >
                <KeyRound size={32} />
              </div>
              <h3 className="gradient-text-gold fw-bold">Officer Sign In</h3>
              <p className="text-muted small">Sign in to manage enquiries or view admin dashboards</p>
            </div>

            {error && (
              <div className="alert alert-danger d-flex align-items-center gap-2 py-3 px-3 rounded small mb-4 bg-danger bg-opacity-10 border-danger border-opacity-20 text-danger">
                <AlertCircle size={18} className="flex-shrink-0" />
                <div>{error}</div>
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div className="mb-3">
                <label className="form-label text-muted small">Username</label>
                <div className="position-relative">
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    className="form-control ps-5"
                    required
                  />
                  <User size={18} className="position-absolute text-muted" style={{ left: '16px', top: '14px' }} />
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label text-muted small">Password</label>
                <div className="position-relative">
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="form-control ps-5"
                    required
                  />
                  <Lock size={18} className="position-absolute text-muted" style={{ left: '16px', top: '14px' }} />
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-gold w-100 py-3 fw-bold"
                disabled={loading}
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>

            {/* Quick Login Assist Panel */}
            <div className="mt-4 border-top border-dark pt-3">
              <span className="text-muted small d-block mb-2 text-center">DEMO CREDENTIALS QUICK LOGIN</span>
              <div className="d-flex flex-wrap gap-2 justify-content-center">
                <button 
                  onClick={() => handleQuickLogin('superadmin', 'admin123')}
                  className="btn btn-sm btn-outline-glass text-warning py-1 px-2"
                  style={{ fontSize: '0.75rem' }}
                >
                  Super Admin
                </button>
                <button 
                  onClick={() => handleQuickLogin('admin', 'admin123')}
                  className="btn btn-sm btn-outline-glass text-primary py-1 px-2"
                  style={{ fontSize: '0.75rem' }}
                >
                  Admin
                </button>
                <button 
                  onClick={() => handleQuickLogin('faculty1', 'admin123')}
                  className="btn btn-sm btn-outline-glass text-success py-1 px-2"
                  style={{ fontSize: '0.75rem' }}
                >
                  Faculty 1
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
