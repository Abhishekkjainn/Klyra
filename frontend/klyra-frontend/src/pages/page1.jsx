import {Link} from 'react-router-dom';
import Header from '../components/header';
import Actions from '../components/actions';
import { useEffect, useState } from 'react';
import { sendButtonClickAnalytics } from '../functions.jsx'


export default function Page1({ user, sessionLoading, refreshSession }){
    
    return <>
    <Header/>
    <Actions user={user} sessionLoading={sessionLoading} refreshSession={refreshSession} /> 
    <div className="page1">
        <div className="page1tag">
            <img src="/click.png" alt="" className="tagicon" />
            <div className="tagtext">Know What Clicks</div>
        </div>
        <div className="page1title">Data, without the drama.</div>
        <div className="page1subtitle">Plug in Klyra and start tracking every view, click, and moment — no code bloat, just clarity.</div>
        <div className="actionbuttons">
            {sessionLoading ? (
                <div className="primarybutton" style={{opacity:0.6, pointerEvents:'none'}}>
                    <div className="buttontag">Loading...</div>
                </div>
            ) : user ? (
                <Link to="/dashboard" className="primarybutton" >
                    <img src="/dashboard.png" alt="Dashboard" className="buttonicon" />
                    <div className="buttontag">Go to Dashboard</div>
                </Link>
            ) : (
                <Link to="/signup" className="primarybutton">
                    <img src="/arrow.png" alt="Arrow" className="buttonicon" />
                    <div className="buttontag">Get Started</div>
                </Link>
            )}
            <div className="space"></div>
            <div
       className="secondarybutton" 
    //    onClick={()=> sendButtonClickAnalytics({apikey : user?.apikey, buttonName:"View Documentation"})}
       
     >
                <img src="/doc.png" alt="Arrow" className="secondbuttonicon" />
                <Link to={'/documentation'} className="secondbuttontag">View Documentation</Link>
            </div>
        </div>
    </div>
    </>
}