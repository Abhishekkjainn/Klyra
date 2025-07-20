import { Link } from "react-router-dom";
export default function Header(){
    return (
        <div className="header">
        <Link className="company" to={"/"}>
          <img src="/klyralogo.png" alt="mainlogo" className="mainlogo" />
          <div className="companytag">Klyra</div>
        </Link>
        <div className="links">
          <div className="link">
            <img src="/home.png" alt="" className="linkicon" />
            <div className="linktag">Home</div>
          </div>
          <div className="link">
            <img src="/dashboard.png" alt="" className="linkicon" />
            <div className="linktag">Dashboard</div>
          </div>
          <div className="link">
            <img src="/documentation.png" alt="" className="linkicon" />
            <div className="linktag">Documentation</div>
          </div>
          <div className="link">
            <img src="/contact.png" alt="" className="linkicon" />
            <div className="linktag">Contact</div>
          </div>
          <div className="link">
            <img src="/about.png" alt="" className="linkicon" />
            <div className="linktag">About Us</div>
          </div>
        </div>
      </div>
    );
}