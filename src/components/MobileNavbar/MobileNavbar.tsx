import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useBillingContext } from '../../context/BillingContext';
import { BiMenu } from 'react-icons/bi';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { SideBarContent } from '../SideBar/SideBar';

export default function MobileNavbar() {
  const { isAuthenticated } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Try to access billing context - will be undefined if not on billing routes
  let cartItemCount = 0;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { checkout } = useBillingContext();
    cartItemCount =
      checkout.datasets.length + checkout.intelligences.length + (checkout.report ? 1 : 0);
  } catch {
    // Not on billing routes, context not available
  }

  const isBillingRoute = location.pathname.startsWith('/billing');

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location]);

  const handleCartClick = () => {
    // Navigate to billing page and trigger checkout modal
    // This will be handled by the CheckoutBilling component
    if (!isBillingRoute) {
      navigate('/billing');
    }
    // If already on billing route, the View Checkout button will handle opening the modal
  };

  return (
    <div className="lg:hidden bg-white ">
      <div className="flex justify-between items-center px-4 py-2 border-b">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <img src="/slocator.png" alt="Google Logo" className="w-7" />
          </div>
        </Link>
        <div className="flex items-center gap-3">
          {/* Cart Icon - Only show on billing routes */}
          {isBillingRoute && cartItemCount > 0 && (
            <button
              onClick={handleCartClick}
              className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="View Cart"
            >
              <svg
                className="w-6 h-6 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </button>
          )}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link to="/profile">
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-200 ">
                  <span className="text-gray-500 text-sm font-medium">JD</span>
                </div>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/auth" className="text-base">
                Login
              </Link>
            </div>
          )}
        </div>
      </div>
      <div className="px-4 py-2">
        <button
          className="flex items-center gap-2"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <BiMenu className="text-2xl" />
        </button>
      </div>
      <>
        {isSidebarOpen && (
          <div
            className={`fixed inset-0 z-30 bg-black transition-opacity duration-300 ${
              isSidebarOpen ? 'opacity-40' : 'opacity-0 pointer-events-none'
            }`}
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}
        <div
          className={`fixed left-0 top-0 bottom-2 z-30 outline-none h-full bg-primary w-[310px] flex transition-transform duration-300 ${
            isSidebarOpen ? 'translate-x-0' : 'translate-x-[-100%]'
          }`}
        >
          <div className="grow py-4 mt-4 flex flex-col bg-primary text-white">
            <SideBarContent />
          </div>
        </div>
      </>
    </div>
  );
}
