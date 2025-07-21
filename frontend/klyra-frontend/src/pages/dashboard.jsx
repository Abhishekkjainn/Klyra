import Actions from "../components/actions";
import Header from "../components/header";

export default function Dashboard({ user, sessionLoading, refreshSession }) {
    return (
        <>
            
            <Header />
            <Actions user={user} sessionLoading={sessionLoading} refreshSession={refreshSession} />
            <div className="dashboard">
                <h2>Signup/Login Response Data:</h2>
                {sessionLoading ? (
                    <div style={{ background: '#f4f4f4', padding: 16, borderRadius: 8 }}>Loading...</div>
                ) : (
                    <pre style={{ background: '#f4f4f4', padding: 16, borderRadius: 8 }}>
                        {user ? JSON.stringify(user, null, 2) : 'No user data found.'}
                    </pre>
                )}
            </div>
        </>
    );
}