import {Link} from 'react-router-dom';
import Header from '../components/header';
import Actions from '../components/actions';
export default function Page1(){
    return <>
    <Header/>
    <Actions/> 
    <div className="page1">
        <div className="page1tag">
            <img src="/click.png" alt="" className="tagicon" />
            <div className="tagtext">Know What Clicks</div>
        </div>
        <div className="page1title">Data, without the drama.</div>
        <div className="page1subtitle">Plug in Klyra and start tracking every view, click, and moment — no code bloat, just clarity.</div>
        <div className="actionbuttons">
            <Link to="/signup" className="primarybutton">
                <img src="/arrow.png" alt="Arrow" className="buttonicon" />
                <div className="buttontag">Get Started</div>
            </Link>

            <div className="space"></div>

            <div className="secondarybutton">
                <img src="/doc.png" alt="Arrow" className="secondbuttonicon" />
                <div className="secondbuttontag">View Documentation</div>
            </div>
        </div>
    </div>
    </>
}