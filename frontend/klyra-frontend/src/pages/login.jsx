import { Link } from "react-router-dom";
export default function Login(){
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
                <input type="text" name="nameinp" id="nameinp" className="inp" placeholder="klyra@abc.xyz" />
            </div>
            <div className="inputdiv">
                <div className="label">Enter Your Password</div>
                <input type="password" name="nameinp" id="nameinp" className="inp" />
            </div>
            <div className="space2"></div>
            <div className="buttonsectionsignup">
            <div to="/signup" className="primarybutton">
            <img src="/login2.png" alt="Arrow" className="buttonicon" />
            <div className="buttontag">Login </div>
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