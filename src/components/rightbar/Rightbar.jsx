import "./rightbar.scss";
import { FaCat } from "react-icons/fa";

export default function Rightbar() {
  return (
    <div className="r-container">
      <div className="ppl-container">
        <span>People You May Know</span>
        <a href="premiumpet.com">
          <img src={FaCat} alt="" />
        </a>
      </div>
    </div>
  );
}
