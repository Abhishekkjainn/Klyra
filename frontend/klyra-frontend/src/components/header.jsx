import { Link } from "react-router-dom";
export default function Header(){
    return (
        <div className="header">
        <Link className="company" to={"/"}>
          <img src="/klyralogo.png" alt="mainlogo" className="mainlogo" />
          <div className="companytag">Klyra</div>
        </Link>
        <div className="links">
          <Link className="link" to={'/'}>
            <img src="/home.png" alt="" className="linkicon" />
            <div className="linktag">Home</div>
          </Link>
          <Link to={"/dashboard"} className="link">
            <img src="/dashboard.png" alt="" className="linkicon" />
            <div className="linktag">Dashboard</div>
          </Link>
          <Link to={"/documentation"} className="link">
            <img src="/documentation.png" alt="" className="linkicon" />
            <div className="linktag">Documentation</div>
          </Link>
          <Link to={"/addfunctions"} className="link">
            <img src="/contact.png" alt="" className="linkicon" />
            <div className="linktag">Function Generator</div>
          </Link>
          <div className="link">
            <img src="/about.png" alt="" className="linkicon" />
            <div className="linktag">About Us</div>
          </div>
        </div>
      </div>
    );
}