import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

export default function Signup() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleSignup = async () => {
        setError('');
        const trimmedName = name.trim();
        const trimmedEmail = email.trim();
        const trimmedPassword = password.trim();
        if (!trimmedName || !trimmedEmail || !trimmedPassword) {
            setError('All fields are required.');
            return;
        }
        if (!validateEmail(trimmedEmail)) {
            setError('Please enter a valid email address.');
            return;
        }
        if (trimmedPassword.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        setLoading(true);
        try {
            const response = await fetch('https://klyra-backend.vercel.app/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: trimmedName, email: trimmedEmail, password: trimmedPassword })
            });
            const data = await response.json();
            if (!response.ok) {
                setError(data.error || 'Signup failed.');
                setLoading(false);
                return;
            }
            // Pass data to dashboard via navigation state
            navigate('/dashboard', { state: { user: data } });
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Add this handler to trigger signup on Enter in any input
    const handleKeyDown = (e) => {
        if (!loading && (e.key === 'Enter' || e.key === ' ')) {
            handleSignup();
        }
    };

    return <div className="signuppage">
        <div className="sideimage">
            <img src="/sidebanner.jpg" alt="Sidepage" className="sideimageimage" />
        </div>
        <div className="mainform">
            <Link to={"/"} className="signuptitle">
                <img src="/klyralogo.png" alt="logo" className="signuptitlelogo" />
                <div className="signuptitletext">Klyra</div>
            </Link>
            <div className="signupheading">Join the data cult. It's cooler inside.</div>
            <div className="formdiv">
                <div className="inputdiv">
                    <div className="label">Enter Your Name</div>
                    <input type="text" className="inp" placeholder="Klyra Corp Pvt. Ltd." value={name} onChange={e => setName(e.target.value)} disabled={loading} onKeyDown={handleKeyDown} />
                </div>
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
                        className={`primarybutton ${loading ? ' disabled' : ''}`}
                        onClick={!loading ? handleSignup : undefined}
                        role="button"
                        tabIndex={0}
                        onKeyDown={e => { if (!loading && (e.key === 'Enter' || e.key === ' ')) handleSignup(); }}
                    >
                        <img src="/add-user.png" alt="Arrow" className="buttonicon" />
                        <div className="buttontag">{loading ? 'Creating...' : 'Create Account'}</div>
                    </div>
                </div>
                <div className="alreadyaccount">Already Have an Account? <Link to="/login">Login</Link></div>
            </div>
        </div>
    </div>;
}