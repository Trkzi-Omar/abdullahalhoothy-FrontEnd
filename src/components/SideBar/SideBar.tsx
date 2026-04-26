import { useState } from 'react';
import { FaAngleRight, FaNetworkWired } from 'react-icons/fa';
import { MdInfo, MdLogout, MdMap, MdPerson, MdTableChart } from 'react-icons/md';
import { Link, useNavigate } from 'react-router-dom';
import { HiCurrencyDollar } from 'react-icons/hi';
import { isGuestUser, useAuth } from '../../context/AuthContext';
import { t } from '../../i18n';


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
          title={t("map")}
        >
          <div>
            <MdMap className="w-6 h-6 transition-all fill-white" />
          </div>
          {!isCollapsed && <span className="ms-2 text-white truncate">{t("map")}</span>}
        </div>

        {/* Tabluar View Button */}
        <Link to={'/tabularView'} className="sidebar-icon" title={t("tabular-view")}>
          <div>
            <MdTableChart className="w-6 h-6 transition-all fill-white" />
          </div>
          {!isCollapsed && <span className="ms-2 text-white truncate">{t("tabular-view")}</span>}
        </Link>

        {/* Organization View Button */}
        <Link to={'/organization'} className="sidebar-icon" title={t("organization")}>
          <div>
            <FaNetworkWired className="w-6 h-6 transition-all fill-white" />
          </div>
          {!isCollapsed && <span className="ms-2 text-white">{t("organization")}</span>}
        </Link>

        {/* Billing View Button */}
        <Link to={'/billing'} className="sidebar-icon" title={t("checkout")}>
          <div>
            <HiCurrencyDollar className="w-6 h-6 transition-all fill-white" />
          </div>
          {!isCollapsed && <span className="ms-2 text-white">{t("checkout")}</span>}
        </Link>

        {/* Bottom Icons */}
        <div className="absolute bottom-5 w-full">
          <Link to={'/profile'} className="sidebar-icon" title={t("account")}>
            <div>
              <MdPerson className="w-6 h-6 transition-all fill-white" />
            </div>
            {!isCollapsed && <span className="ms-2 text-white truncate">{t("account")}</span>}
          </Link>

          <a className="sidebar-icon" href="https://s-locator.com/" title={t("about-us")} target="_blank">
            <div>
              <MdInfo className="w-6 h-6 transition-all fill-white" />
            </div>
            {!isCollapsed && <span className="ms-2 text-white truncate">{t("about-us")}</span>}
          </a>

          {shouldShowLogout ? (
            <div
              className="sidebar-icon"
              onClick={() => {
                logout();
                setIsCollapsed(true);
                navigate('/auth');
              }}
              title={t("logout")}
            >
              <div>
                <MdLogout className="w-6 h-6 transition-all fill-white" />
              </div>
              {!isCollapsed && <span className="ms-2 text-white truncate">{t("logout")}</span>}
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
      <div className="sidebar-icon" onClick={() => navigate('/')} title={t("map")}>
        <div>
          <MdMap className="w-6 h-6 transition-all " />
        </div>
        <span className="ms-2 truncate">{t("map")}</span>
      </div>

      {/* Tabluar View Button */}
      <Link to={'/tabularView'} className="sidebar-icon" title={t("tabular-view")}>
        <div>
          <MdTableChart className="w-6 h-6 transition-all " />
        </div>
        <span className="ms-2 truncate">{t("tabular-view")}</span>
      </Link>

      {/* Organization View Button */}
      <Link to={'/organization'} className="sidebar-icon" title={t("organization")}>
        <div>
          <FaNetworkWired className="w-6 h-6 transition-all " />
        </div>
        <span className="ms-2 ">{t("organization")}</span>{' '}
      </Link>

      {/* Billing View Button */}
      <Link to={'/billing'} className="sidebar-icon" title={t("billing-and-cost-management")}>
        <div>
          <HiCurrencyDollar className="w-6 h-6 transition-all " />
        </div>
        <span className="ms-2 ">{t("billing-and-cost-management")}</span>
      </Link>

      {/* Bottom Icons */}
      <div className="absolute bottom-5 w-full">
        <Link to={'/profile'} className="sidebar-icon" title={t("account")}>
          <div>
            <MdPerson className="w-6 h-6 transition-all " />
          </div>
          <span className="ms-2 truncate">{t("account")}</span>
        </Link>

        <a className="sidebar-icon" href="https://s-locator.com/" title={t("about-us")}>
          <div>
            <MdInfo className="w-6 h-6 transition-all " />
          </div>
          <span className="ms-2 truncate">{t("about-us")}</span>
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
            <span className="ms-2 text-white truncate">
              {!isAuthenticated ? <>Login</> : <>Logout</>}
            </span>
          )}
        </div> */}
      </div>
    </>
  );
};

export default SideBar;
