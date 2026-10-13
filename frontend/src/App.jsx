import React, { useState, useEffect } from 'react';
import { Bot, LogIn, LogOut, LayoutDashboard, Shield, Clipboard, GraduationCap } from 'lucide-react';
import StudentPortal from './components/StudentPortal';
import ChatbotWidget from './components/ChatbotWidget';
import Login from './components/Login';
import FacultyPortal from './components/FacultyPortal';
import AdminPortal from './components/AdminPortal';
import SuperAdminPortal from './components/SuperAdminPortal';
import logoImage from './assets/logo.png';
const rawApiUrl = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').trim();
const API_URL = (rawApiUrl.startsWith('http://') || rawApiUrl.startsWith('https://')
  ? rawApiUrl
  : `https://${rawApiUrl}`).replace(/\/+$/, '');

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('ems_token') || null);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('ems_user')) || null);
  const [currentView, setCurrentView] = useState('student'); // 'student', 'login', 'faculty', 'admin', 'superadmin'

  useEffect(() => {
    if (token && user) {
      localStorage.setItem('ems_token', token);
      localStorage.setItem('ems_user', JSON.stringify(user));
      // Auto redirect to correct portal based on role
      if (user.role === 'super_admin') {
        setCurrentView('superadmin');
      } else if (user.role === 'admin') {
        setCurrentView('admin');
      } else if (user.role === 'faculty') {
        setCurrentView('faculty');
      }
    } else {
      localStorage.removeItem('ems_token');
      localStorage.removeItem('ems_user');
    }
  }, [token, user]);

  const handleLoginSuccess = (userToken, userData) => {
    setToken(userToken);
    setUser(userData);
  };

  const handleSignOut = () => {
    setToken(null);
    setUser(null);
    setCurrentView('student');
  };

  return (
    <div className="min-vh-100 d-flex flex-column gradient-bg-main">

      {/* Global Navigation Bar */}
      <nav
        className="navbar navbar-expand-lg navbar-dark shadow-sm py-3"
        style={{
          background: 'linear-gradient(90deg, #1ca9c9, #0047ab)',
          position: 'sticky',
          top: 0,
          zIndex: 1000
        }}
      >
        <div className="container">
          <div
            onClick={() => setCurrentView('student')}
            className="navbar-brand d-flex align-items-center gap-2 text-white fw-bold fs-4"
            style={{ cursor: 'pointer' }}
          >
            <div
              className="d-flex align-items-center justify-content-center text-warning"
              style={{
                width: '70px',
                height: '70px',
                borderRadius: '10px',

              }}
            >
              <img
                src={logoImage}
                alt="College Logo"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
            <div>
              <span className="text-white fs-5 fw-semibold font-monospace mb-2">Rayat Shikshan Santha's</span><br></br>
              <span className="text-warning mb-3">Karmaveer Bhaurao Patil Institute Of Management Studies and Reserch</span>
            </div>
          </div>

          <div className="d-flex align-items-center gap-3">

            {/* View Switchers for Staff */}
            {token && user && (
              <div className="d-none d-md-flex align-items-center gap-2">

                {user.role === 'super_admin' && (
                  <button
                    onClick={() => setCurrentView('superadmin')}
                    className={`btn btn-sm ${currentView === 'superadmin' ? 'btn-gold' : 'btn-outline-glass'} d-flex align-items-center gap-1`}
                  >
                    <Shield size={14} /> Super Admin
                  </button>
                )}

                {(user.role === 'admin' || user.role === 'super_admin') && (
                  <button
                    onClick={() => setCurrentView('admin')}
                    className={`btn btn-sm ${currentView === 'admin' ? 'btn-gold' : 'btn-outline-glass'} d-flex align-items-center gap-1`}
                  >
                    <LayoutDashboard size={14} /> Analytics
                  </button>
                )}

                <button
                  onClick={() => setCurrentView('faculty')}
                  className={`btn btn-sm ${currentView === 'faculty' ? 'btn-gold' : 'btn-outline-glass'} d-flex align-items-center gap-1`}
                >
                  <Clipboard size={14} /> Faculty Workspace
                </button>

              </div>
            )}

            {/* Login / Logout Buttons */}
            {!token ? (
              currentView === 'student' ? (
                <button
                  onClick={() => setCurrentView('login')}
                  className="btn btn-outline-glass btn-sm d-flex align-items-center gap-1"
                >
                  <LogIn size={15} /> Staff Sign In
                </button>
              ) : (
                <button
                  onClick={() => setCurrentView('student')}
                  className="btn btn-gold btn-sm d-flex align-items-center gap-1"
                >
                  <GraduationCap size={15} /> Student Enquiry
                </button>
              )
            ) : (
              <div className="d-flex align-items-center gap-2">

                <button
                  onClick={handleSignOut}
                  className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1"
                >
                  <LogOut size={15} /> Sign Out
                </button>
              </div>
            )}


          </div>
        </div>

      </nav>

      {/* Main Content Area */}
      <main className="flex-grow-1">
        {currentView === 'student' && <StudentPortal apiUrl={API_URL} />}
        {currentView === 'login' && <Login onLoginSuccess={handleLoginSuccess} apiUrl={API_URL} />}
        {currentView === 'faculty' && <FacultyPortal token={token} apiUrl={API_URL} />}
        {currentView === 'admin' && <AdminPortal token={token} apiUrl={API_URL} />}
        {currentView === 'superadmin' && <SuperAdminPortal token={token} apiUrl={API_URL} />}
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-white" style={{ background: 'linear-gradient(90deg, #1ca9c9, #0047ab)' }}>
        <p className="m-0 text-muted small">
          © 2026 Karmaveer Bhaurao Patil Institute of Management Studies and Research, Satara.
        </p>
        <p className="m-0 text-muted small mt-1">
          Designed by Aditya Ajay Kamble. Powered by Django & React.
        </p>
      </footer>


      {/* Global Conversational Chatbot Widget */}
      <ChatbotWidget apiUrl={API_URL} />
    </div>
  );
}
