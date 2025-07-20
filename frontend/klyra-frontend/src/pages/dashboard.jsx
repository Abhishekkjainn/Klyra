import Actions from "../components/actions";
import Header from "../components/header";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";

export default function Dashboard() {
    const location = useLocation();
    const user = location.state?.user;

    useEffect(() => {
        if (user && user.sessionId) {
            localStorage.setItem('session_id', user.sessionId);
        }
    }, [user]);

    return (
        <>
            <Header />
            <Actions />
            <div className="dashboard">
                <h2>Signup/Login Response Data:</h2>
                <pre style={{ background: '#f4f4f4', padding: 16, borderRadius: 8 }}>
                    {user ? JSON.stringify(user, null, 2) : 'No user data found.'}
                </pre>
            </div>
        </>
    );
}