import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../store/authSlice";
import api from "../../utils/api";
import { useNavigate } from "react-router-dom";

const Header = ({ title }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isDashboard = window.location.pathname === "/dashboard";
  const { user } = useSelector((state) => state.auth);

  const handleLogout = async () => {
    try {
      await api.post("/users/auth/logout");
      sessionStorage.removeItem("isMFAVerified");
      dispatch(logout());
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <p className="text-2xl text-bold text-gray-900">{title}</p>
        <div className="flex flex-inline items-center">
          {!isDashboard && (
            <button
              onClick={() => navigate("/dashboard")}
              className="text-xl underline text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 pr-4"
            >
              Go to Dashboard
            </button>
          )}
          <div className="flex items-center mr-4">
            <span className="ml-2 px-2 py-1 bg-gray-200 text-gray-700 text-sm rounded-full">
              {user?.username}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
