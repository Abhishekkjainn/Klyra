import {Link} from 'react-router-dom';
export default function Signup(){
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
                    <input type="text" name="nameinp" id="nameinp" className="inp" placeholder="Klyra Corp Pvt. Ltd." />
                </div>
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
                <img src="/add-user.png" alt="Arrow" className="buttonicon" />
                <div className="buttontag">Create Account</div>
            </div>
            {/* <div className="space"></div>
            <div className="secondarybutton">
                <img src="/login.png" alt="Arrow" className="secondbuttonicon" />
                <div className="secondbuttontag">Login</div>
            </div> */}
            </div>
            <div className="alreadyaccount">Already Have an Account? <Link to="/login">Login</Link></div>
            </div>
        </div>
    </div>
}