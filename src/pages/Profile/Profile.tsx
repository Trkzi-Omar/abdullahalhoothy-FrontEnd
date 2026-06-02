import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { useUIContext } from '../../context/UIContext';
import BottomDrawer from '../../components/BottomDrawer/BottomDrawer';
import { t } from '../../i18n';


const Profile = () => {
  const { isMobile, setIsDrawerOpen } = useUIContext();
  const { isAuthenticated } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [isBillingExpanded, setIsBillingExpanded] = useState(false);

  if (!isAuthenticated) {
    nav('/auth');
  }

  return (
    <div className="relative lg:h-full flex flex-col">
      {isMobile ? (
        location.pathname ==="/profile" && (
          <>
            <ProfileDrawer />
            <button
              className="bg-white border p-2.5 fixed w-full bottom-0 start-0 end-0 z-[5] flex items-center gap-2 text-gray-400 font-normal"
              onClick={() => setIsDrawerOpen(true)}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                stroke="currentColor"
              >
                <path
                  d="M18 15L12 9L6 15"
                  stroke-width="1.5"
                  stroke-miterlimit="16"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>{t("tap-to-see-more-options")}</button>
          </>
        )
      ) : (
        <div className="h-full w-96 bg-[#115740] px-1 py-1">
          <div className="w-full h-full bg-white rounded">
              <ProfileContent
                isBillingExpanded={isBillingExpanded}
                onToggleBilling={() => setIsBillingExpanded(prev => !prev)}
              />
          </div>
        </div>
      )}
    </div>
  );
};

function ProfileContent({
  isBillingExpanded,
  onToggleBilling,
}: {
  isBillingExpanded: boolean;
  onToggleBilling: () => void;
}) {
  return (
    <>
      <div className="text-2xl ps-6 pt-4 font-semibold mb-4">{t("account")}</div>
      <div className="flex flex-col justify-center items-center">
        <MenuItem label={t("account")} to="/profile" />
        <MenuItem label={t("change-password")} to="/profile/change-password" />
        <MenuItem label={t("change-email")} to="/profile/change-email" />
        <ExpandableMenuItem
          label={t("billing-2")}
          isExpanded={isBillingExpanded}
          onClick={onToggleBilling}
        >
          <SubMenuItem label={t("payment-methods")} to="/profile/payment-methods" />
          <SubMenuItem label={t("wallet")} to="/profile/wallet" />
        </ExpandableMenuItem>
      </div>
    </>
  );
}

function ProfileDrawer() {
  const [isBillingExpanded, setIsBillingExpanded] = useState(false);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const { isDrawerOpen, setIsDrawerOpen } = useUIContext();
  const drawerSnap = isBillingExpanded ? 0.75 : 0.375;

  useEffect(() => {
    const drawerContent = contentRef.current;
    if (drawerContent) {
      // Remove potential focus-trap attributes
      drawerContent.removeAttribute('aria-hidden');
      drawerContent.removeAttribute('tabIndex');
    }
  }, []);

  return (
    <>
    <BottomDrawer
      open={isDrawerOpen}
      onOpenChange={setIsDrawerOpen}
      modal={false}
      defaultSnap={drawerSnap}
      snapPoints={[0, drawerSnap, 1]}
    >
      <div ref={contentRef} className="flex flex-col h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <ProfileContent
            isBillingExpanded={isBillingExpanded}
            onToggleBilling={() => setIsBillingExpanded(prev => !prev)}
          />
        </div>
      </div>
    </BottomDrawer>
    </>
  );
}

function MenuItem({ label, to }: { label: string; to: string }) {
  return (
    <Link
      to={to}
      className="text-primary w-full py-2 ps-8  mb-2 font-bold hover:bg-gray-100 transition-all"
    >
      {label}
    </Link>
  );
}

function ExpandableMenuItem({
  label,
  isExpanded,
  onClick,
  children,
}: {
  label: string;
  isExpanded: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <>
      <button
        onClick={onClick}
        className="flex items-center justify-between w-full px-4 text-base text-primary py-2 ps-8 font-bold mb-2 hover:bg-gray-200"
      >
        {label}
        <span className="ms-2">
          {isExpanded ? (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5.99977 9.00005L11.9998 15L17.9998 9"
                strokeWidth="1.5"
                strokeMiterlimit="16"
              />
            </svg>
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M9.00005 6L15 12L9 18" strokeWidth="1.5" strokeMiterlimit="16" />
            </svg>
          )}
        </span>
      </button>
      {isExpanded && (
        <div className="flex flex-col justify-between w-full text-base mb-2">{children}</div>
      )}
    </>
  );
}

function SubMenuItem({ label, to }: { label: string; to: string }) {
  return (
    <Link to={to} className="block px-4 ps-12 py-2 text-sm hover:bg-gray-200">
      {label}
    </Link>
  );
}

export default Profile;
