import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Login({ refreshSession }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [forgotEmail, setForgotEmail] = useState("");
    const [forgotPassword, setForgotPassword] = useState("");
    const [forgotError, setForgotError] = useState("");
    const [forgotSuccess, setForgotSuccess] = useState("");
    const [forgotLoading, setForgotLoading] = useState(false);
    const navigate = useNavigate();

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleLogin = async () => {
        setError("");
        const trimmedEmail = email.trim();
        const trimmedPassword = password.trim();
        if (!trimmedEmail || !trimmedPassword) {
            setError("All fields are required.");
            return;
        }
        if (!validateEmail(trimmedEmail)) {
            setError("Please enter a valid email address.");
            return;
        }
        setLoading(true);
        try {
            const response = await fetch("https://klyra-backend.vercel.app/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: trimmedEmail, password: trimmedPassword })
            });
            const data = await response.json();
            if (!response.ok) {
                setError(data.error || data.message || "Login failed.");
                setLoading(false);
                return;
            }
            if (data.sessionId) {
                localStorage.setItem('session_id', data.sessionId);
                if (refreshSession) refreshSession();
            }
            navigate('/dashboard', { state: { user: { ...data.user, sessionId: data.sessionId } } });
        } catch (err) {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Allow pressing Enter to trigger login
    const handleKeyDown = (e) => {
        if (!loading && (e.key === 'Enter' || e.key === ' ')) {
            handleLogin();
        }
    };

    // Forgot password logic
    const handleForgotPassword = async () => {
        setForgotError("");
        setForgotSuccess("");
        const trimmedEmail = forgotEmail.trim();
        const trimmedPassword = forgotPassword.trim();
        if (!trimmedEmail || !trimmedPassword) {
            setForgotError("All fields are required.");
            return;
        }
        if (!validateEmail(trimmedEmail)) {
            setForgotError("Please enter a valid email address.");
            return;
        }
        if (trimmedPassword.length < 6) {
            setForgotError("Password must be at least 6 characters.");
            return;
        }
        setForgotLoading(true);
        try {
            const response = await fetch("https://klyra-backend.vercel.app/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: trimmedEmail, password: trimmedPassword })
            });
            const data = await response.json();
            if (!response.ok) {
                setForgotError(data.error || data.message || "Password reset failed.");
                setForgotLoading(false);
                return;
            }
            setForgotSuccess("Password updated successfully! You can now log in.");
            setTimeout(() => {
                setShowForgotModal(false);
                setForgotEmail("");
                setForgotPassword("");
                setForgotSuccess("");
            }, 1500);
        } catch (err) {
            setForgotError("Network error. Please try again.");
        } finally {
            setForgotLoading(false);
        }
    };

    const handleForgotKeyDown = (e) => {
        if (!forgotLoading && (e.key === 'Enter' || e.key === ' ')) {
            handleForgotPassword();
        }
    };

    return (<div className="signuppage">
        <div className="sideimage">
            <img src="/sidebanner.jpg" alt="Sidepage" className="sideimageimage" />
        </div>
        <div className="mainform">
            <Link to={"/"} className="signuptitle">
                <img src="/klyralogo.png" alt="logo" className="signuptitlelogo" />
                <div className="signuptitletext">Klyra</div>
            </Link>
            <div className="signupheading">Booting up your insight engine…</div>
            <div className="formdiv">
                <div className="inputdiv">
                    <div className="label">Enter Your Email</div>
                    <input type="text" className="inp" placeholder="klyra@abc.xyz" value={email} onChange={e => setEmail(e.target.value)} disabled={loading} onKeyDown={handleKeyDown} />
                </div>
                <div className="inputdiv">
                    <div className="label">Enter Your Password</div>
                    <input type="password" className="inp" value={password} onChange={e => setPassword(e.target.value)} disabled={loading} onKeyDown={handleKeyDown} />
                </div>
                {error && <div style={{ color: 'red', marginTop: 10 }}>{error}</div>}
                <div className="space2"></div>
                <div className="buttonsectionsignup">
                    <div
                        className={`primarybutton${loading ? ' disabled' : ''}`}
                        onClick={!loading ? handleLogin : undefined}
                        role="button"
                        tabIndex={0}
                        onKeyDown={e => { if (!loading && (e.key === 'Enter' || e.key === ' ')) handleLogin(); }}
                    >
                        <img src="/login2.png" alt="Arrow" className="buttonicon" />
                        <div className="buttontag">{loading ? 'Logging in...' : 'Login'}</div>
                    </div>
                    <div className="space"></div>
                    <div className="secondarybutton" onClick={() => setShowForgotModal(true)} role="button" tabIndex={0}>
                        <img src="/forgotpass.png" alt="Arrow" className="secondbuttonicon" />
                        <div className="secondbuttontag">Forgot Password</div>
                    </div>
                </div>
                <div className="alreadyaccount">Don't Have an Account? <Link to="/signup">Sign Up</Link></div>
            </div>
        </div>
        {showForgotModal && (
            <div className="modal-overlay" onClick={() => !forgotLoading && setShowForgotModal(false)}>
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                    <div className="modal-title">Reset Password</div>
                    <div className="modal-inputdiv">
                        <div className="label">Email</div>
                        <input type="text" className="inp" placeholder="klyra@abc.xyz" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} disabled={forgotLoading} onKeyDown={handleForgotKeyDown} />
                    </div>
                    <div className="modal-inputdiv">
                        <div className="label">New Password</div>
                        <input type="password" className="inp" value={forgotPassword} onChange={e => setForgotPassword(e.target.value)} disabled={forgotLoading} onKeyDown={handleForgotKeyDown} />
                    </div>
                    {forgotError && <div style={{ color: 'red', marginTop: 10 }}>{forgotError}</div>}
                    {forgotSuccess && <div style={{ color: 'green', marginTop: 10 }}>{forgotSuccess}</div>}
                    <div className="modal-actions">
                        <div
                            className={`primarybutton${forgotLoading ? ' disabled' : ''}`}
                            onClick={!forgotLoading ? handleForgotPassword : undefined}
                            role="button"
                            tabIndex={0}
                            onKeyDown={e => { if (!forgotLoading && (e.key === 'Enter' || e.key === ' ')) handleForgotPassword(); }}
                        >
                            <div className="buttontag">{forgotLoading ? 'Updating...' : 'Update Password'}</div>
                        </div>
                        <div className="secondarybutton" onClick={() => !forgotLoading && setShowForgotModal(false)} role="button" tabIndex={0}>
                            Cancel
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>);
}