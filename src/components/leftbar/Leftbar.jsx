import "./leftbar.scss";
import Logo from "../../assets/logoo.webp";
export default function Leftbar() {
  return (
    <div className="container">
      <div className="logo-container">
        <img src={Logo} alt="" />
      </div>
      <div className="items-container">
        <ul>
          <li>
            <a href="#">Home</a>
          </li>
          <li>
            <a href="#">Search</a>
          </li>
          <li>
            <a href="#">Profile</a>
          </li>
          <li>
            <a href="#">Setting</a>
          </li>
        </ul>
      </div>
    </div>
  );
}
