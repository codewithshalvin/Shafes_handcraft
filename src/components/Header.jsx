import { Link } from "react-router-dom";
import logo from "../assets/logo.png";  // Import logo.png
import TrainSaleBanner from "./TrainSaleBanner"; // Import the train banner

export default function Header() {
  return (
    <>
      {/* Train Sale Banner at the very top */}
      <TrainSaleBanner />
      
      <header>
        <div className="logo-container">
          <img src={logo} alt="Shafe's Handcraft Logo" className="logo" />
          <h1>Shafe's_handcraft</h1>
        </div>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/categories">Categories</Link>
          <Link to="/cart">Cart</Link>
          <Link to="/wishlist">Wishlist</Link>
          <Link to="/profile">Login</Link>
        </nav>
      </header>
    </>
  );
}
