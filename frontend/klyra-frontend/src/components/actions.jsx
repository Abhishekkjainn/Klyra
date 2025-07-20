import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Actions({ user, sessionLoading, refreshSession }) {
    const [logoutLoading, setLogoutLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogout = async () => {
        setLogoutLoading(true);
        const sessionId = localStorage.getItem('session_id');
        try {
            await fetch('https://klyra-backend.vercel.app/logout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId })
            });
        } catch (e) {
            // ignore error, just clear session
        }
        localStorage.removeItem('session_id');
        if (refreshSession) refreshSession();
        setLogoutLoading(false);
        navigate('/login');
    };

    return (
        <div className="actions">
            <div className="action">
                <img src="/bell.png" alt="notification" className="actionimage" />
            </div>
            {sessionLoading ? (
                <div className="action"></div>
            ) : user ? (
              <>
                <div className="action" style={{ background: '#222', color: 'white', fontWeight: 700, fontSize: 18, justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
                    {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="action" style={{ cursor: logoutLoading ? 'not-allowed' : 'pointer', opacity: logoutLoading ? 0.6 : 1 }} onClick={logoutLoading ? undefined : handleLogout}>
                  {logoutLoading ? (
                    <div className="actionimage" style={{ width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="18" height="18" viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" fill="none" stroke="#fff" strokeWidth="5" strokeDasharray="31.4 31.4" strokeLinecap="round"><animateTransform attributeName="transform" type="rotate" repeatCount="indefinite" dur="1s" from="0 25 25" to="360 25 25"/></circle></svg>
                    </div>
                  ) : (
                    <img src="/logout.png" alt="logout" className="actionimage" />
                  )}
                </div>
            </>
            ) : (
                <div
                    className="action login-action"
                    style={{ minWidth: 60, padding: '0 16px', cursor: 'pointer', background: '#222', color: 'white', fontWeight: 600, fontSize: 14, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => navigate('/login')}
                >
                    Login
                </div>
            )}
        </div>
    );
}