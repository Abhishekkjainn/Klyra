import Page2 from './pages/page2';
import Page1 from './pages/page1';
export default function Homepage({ user, sessionLoading, refreshSession }){
    return (
        <>
        <Page1 user={user} sessionLoading={sessionLoading} refreshSession={refreshSession} />
        <Page2 user={user} sessionLoading={sessionLoading} refreshSession={refreshSession} />
        </>
    );
}