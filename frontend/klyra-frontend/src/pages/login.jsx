import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
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
            // Store sessionId in localStorage
            if (data.sessionId) {
                localStorage.setItem('session_id', data.sessionId);
            }
            // Pass data to dashboard via navigation state
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
                    <div className="secondarybutton">
                        <img src="/forgotpass.png" alt="Arrow" className="secondbuttonicon" />
                        <div className="secondbuttontag">Forgot Password</div>
                    </div>
                </div>
                <div className="alreadyaccount">Don't Have an Account? <Link to="/signup">Sign Up</Link></div>
            </div>
        </div>
    </div>);
}