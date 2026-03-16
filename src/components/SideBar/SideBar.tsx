import { useState } from 'react';
import { FaAngleRight, FaNetworkWired } from 'react-icons/fa';
import { MdInfo, MdLogout, MdMap, MdPerson, MdTableChart } from 'react-icons/md';
import { Link, useNavigate } from 'react-router-dom';
import { HiCurrencyDollar } from 'react-icons/hi';
import { isGuestUser, useAuth } from '../../context/AuthContext';

const SideBar = () => {
  const { authResponse, isAuthenticated, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const navigate = useNavigate();
  const shouldShowLogout = isAuthenticated && !isGuestUser(authResponse);

  return (
    <>
      <div
        className={
          'lg:flex justify-start flex-col hidden relative bg-[#115740] transition-all ' +
          (isCollapsed ? 'w-14' : 'w-48')
        }
      >
        {/* Sidebar Collabs Button */}
        <div
          className="sidebar-icon w-fit"
          onClick={() => {
            setIsCollapsed(!isCollapsed);
          }}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          <FaAngleRight
            className={
              'w-6 h-6 transition-all delay-100 fill-white ' + (!isCollapsed && ' rotate-180')
            }
          />
        </div>

        {/* Map Button */}
        <div
          className="sidebar-icon"
          onClick={() => {
            setIsCollapsed(true);
            setTimeout(() => {
              navigate('/');
            }, 100);
          }}
          title="Map"
        >
          <div>
            <MdMap className="w-6 h-6 transition-all fill-white" />
          </div>
          {!isCollapsed && <span className="ml-2 text-white truncate">Map</span>}
        </div>

        {/* Tabluar View Button */}
        <Link to={'/tabularView'} className="sidebar-icon" title="Tabular View">
          <div>
            <MdTableChart className="w-6 h-6 transition-all fill-white" />
          </div>
          {!isCollapsed && <span className="ml-2 text-white truncate">Tabular View</span>}
        </Link>

        {/* Organization View Button */}
        <Link to={'/organization'} className="sidebar-icon" title="Organization">
          <div>
            <FaNetworkWired className="w-6 h-6 transition-all fill-white" />
          </div>
          {!isCollapsed && <span className="ml-2 text-white">Organization</span>}
        </Link>

        {/* Billing View Button */}
        <Link to={'/billing'} className="sidebar-icon" title="Checkout">
          <div>
            <HiCurrencyDollar className="w-6 h-6 transition-all fill-white" />
          </div>
          {!isCollapsed && <span className="ml-2 text-white">Checkout</span>}
        </Link>

        {/* Bottom Icons */}
        <div className="absolute bottom-5 w-full">
          <Link to={'/profile'} className="sidebar-icon" title="Account">
            <div>
              <MdPerson className="w-6 h-6 transition-all fill-white" />
            </div>
            {!isCollapsed && <span className="ml-2 text-white truncate">Account</span>}
          </Link>

          <a className="sidebar-icon" href="https://s-locator.com/" title="About Us" target="_blank">
            <div>
              <MdInfo className="w-6 h-6 transition-all fill-white" />
            </div>
            {!isCollapsed && <span className="ml-2 text-white truncate">About Us</span>}
          </a>

          {shouldShowLogout ? (
            <div
              className="sidebar-icon"
              onClick={() => {
                logout();
                setIsCollapsed(true);
                navigate('/auth');
              }}
              title="Logout"
            >
              <div>
                <MdLogout className="w-6 h-6 transition-all fill-white" />
              </div>
              {!isCollapsed && <span className="ml-2 text-white truncate">Logout</span>}
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
};

export const SideBarContent = () => {
  const navigate = useNavigate();

  return (
    <>
      {/* Map Button */}
      <div className="sidebar-icon" onClick={() => navigate('/')} title="Map">
        <div>
          <MdMap className="w-6 h-6 transition-all " />
        </div>
        <span className="ml-2 truncate">Map</span>
      </div>

      {/* Tabluar View Button */}
      <Link to={'/tabularView'} className="sidebar-icon" title="Tabular View">
        <div>
          <MdTableChart className="w-6 h-6 transition-all " />
        </div>
        <span className="ml-2 truncate">Tabular View</span>
      </Link>

      {/* Organization View Button */}
      <Link to={'/organization'} className="sidebar-icon" title="Organization">
        <div>
          <FaNetworkWired className="w-6 h-6 transition-all " />
        </div>
        <span className="ml-2 ">Organization</span>{' '}
      </Link>

      {/* Billing View Button */}
      <Link to={'/billing'} className="sidebar-icon" title="Billing and Cost Management">
        <div>
          <HiCurrencyDollar className="w-6 h-6 transition-all " />
        </div>
        <span className="ml-2 ">Billing and Cost Management</span>
      </Link>

      {/* Bottom Icons */}
      <div className="absolute bottom-5 w-full">
        <Link to={'/profile'} className="sidebar-icon" title="Account">
          <div>
            <MdPerson className="w-6 h-6 transition-all " />
          </div>
          <span className="ml-2 truncate">Account</span>
        </Link>

        <a className="sidebar-icon" href="https://s-locator.com/" title="About Us">
          <div>
            <MdInfo className="w-6 h-6 transition-all " />
          </div>
          <span className="ml-2 truncate">About Us</span>
        </a>

        {/* <div
          className="sidebar-icon"
          onClick={() => {
            logout();
            setIsColabsed(true);
            navigate("/auth");
          }}
        >
          <div>
            <MdLogout className="w-6 h-6 transition-all fill-white" />
          </div>
          {!isColabsed && (
            <span className="ml-2 text-white truncate">
              {!isAuthenticated ? <>Login</> : <>Logout</>}
            </span>
          )}
        </div> */}
      </div>
    </>
  );
};

export default SideBar;
