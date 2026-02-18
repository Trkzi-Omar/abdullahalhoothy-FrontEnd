import { lazy, Suspense } from 'react';
import SideBar from '../SideBar/SideBar';
import { Route, Routes, useLocation, Navigate } from 'react-router';
import MobileNavbar from '../MobileNavbar/MobileNavbar';
import { BillingProvider } from '../../context/BillingContext';
import GuestBanner from '../Auth/GuestBanner';

const NotFound = lazy(() => import('../../pages/NotFound/NotFound'));
const Dataview = lazy(() => import('../../pages/Dataview/Dataview'));
const Auth = lazy(() => import('../../pages/Auth/Auth'));
const MapContainer = lazy(() => import('../../pages/MapContainer/MapContainer'));
const Home = lazy(() => import('../../pages/Home/Home'));
const Profile = lazy(() => import('../../pages/Profile/Profile'));
const ProfileLayout = lazy(() => import('../../pages/Profile/ProfileLayout'));
const OrganizationLayout = lazy(() => import('../../pages/Organization/OrganizationLayout'));
const Organization = lazy(() => import('../../pages/Organization/Organization'));
const BillingLayout = lazy(() => import('../../pages/Billing/BillingLayout'));
const ProfileMain = lazy(() => import('../../pages/Profile/Routes/ProfileMain/ProfileMain'));
const CheckoutBilling = lazy(() => import('../../pages/Billing/Routes/CheckoutBilling/CheckoutBilling'));
const ChangeEmail = lazy(() => import('../../pages/ChangeEmail/ChangeEmail'));
const ChangePassword = lazy(() => import('../../pages/ChangePassword/ChangePassword'));
const PaymentMethods = lazy(() => import('../../pages/PaymentMethods/PaymentMethods'));
const PaymentMethod = lazy(() => import('../../pages/PaymentMethod/PaymentMethod'));
const Wallet = lazy(() => import('../../pages/Wallet/Wallet'));
const AddFunds = lazy(() => import('../../pages/AddFunds/AddFunds'));
const CampaignPage = lazy(() => import('../../pages/Campaign/campaign'));
const PlansPage = lazy(() => import('../../pages/Plans/Plans'));
const StaticRedirect = lazy(() => import('../StaticRedirect/StaticRedirect'));
const CustomReportForm = lazy(() => import('../CustomReportForm'));
const MarketingDashboard = lazy(() => import('../../pages/MarketingDashboard/MarketingDashboard'));
const Billing = lazy(() => import('../../pages/Billing/Billing'));
const SmartSegmentReport = lazy(() => import('../SegmentReport'));

const Layout = () => {
  const location = useLocation();

  // Hide sidebar & navbar only on /campaign, /plans, or /custom-report
  const hideLayout =
    location.pathname.startsWith('/campaign') ||
    location.pathname.startsWith('/plans') ||
    location.pathname.startsWith('/custom-report');

  const isBillingRoute = location.pathname.startsWith('/billing');

  const routesContent = (
    <Suspense fallback={<div className="flex w-screen h-svh items-center justify-center" />}>
      <Routes>
        <Route path="*" element={<NotFound />} />
        <Route path={'/tabularView'} element={<></>} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/sign-up" element={<Navigate to="/auth?mode=register" replace />} />
        <Route path="/sign-up/:source" element={<Navigate to="/auth?mode=register" replace />} />
        <Route path="/" element={<Home />} />
        <Route path="/:source" element={<Home />} />
        <Route path={'/profile/*'} element={<Profile />} />
        <Route path={'/organization/*'} element={<Organization />} />
        <Route path={'/billing/*'} element={<Billing />} />
        <Route path="/campaign" element={<CampaignPage />} />
        <Route path="/plans" element={<PlansPage />} />
        <Route path="/marketing-dashboard" element={<MarketingDashboard />} />
        <Route path="/custom-report" element={<CustomReportForm />} />
        <Route path="/static/*" element={<StaticRedirect />} />
      </Routes>

      <Routes>
        <Route path={'/'} element={<MapContainer />} />
        <Route path="/tabularView" element={<Dataview />} />

        <Route path={'/profile'} element={<ProfileLayout />}>
          <Route path="" element={<ProfileMain />} />
          <Route path="change-password" element={<ChangePassword />} />
          <Route path="change-email" element={<ChangeEmail />} />
          <Route path="payment-methods" element={<PaymentMethods />} />
          <Route path="payment-methods/add" element={<PaymentMethod />} />
          <Route path="wallet" element={<Wallet />} />
          <Route path="wallet/add" element={<AddFunds />} />
        </Route>
        <Route path={'/organization'} element={<OrganizationLayout />}>
          <Route path="" element={<CommingSoon data={'Organization Features'} />} />
        </Route>
        <Route path={'/billing'} element={<BillingLayout />}>
          <Route path="" element={<CheckoutBilling Name="area" />} />
          <Route path="datasets" element={<CheckoutBilling Name="dataset" />} />
          <Route path="reports" element={<CheckoutBilling Name="reports" />} />
        </Route>
      </Routes>
    </Suspense>
  );

  return (
    <div className="flex flex-col ">
      <GuestBanner />
      {!hideLayout && <MobileNavbar />}

      <div className="flex-1 flex lg:flex-row flex-col w-screen relative overflow-hidden overflow-y-auto">
        {!hideLayout && <SideBar />}

        {isBillingRoute ? <BillingProvider>{routesContent}</BillingProvider> : routesContent}
      </div>
    </div>
  );
};

export default Layout;

const CommingSoon = ({ data }: { data: string }) => {
  return <p className="h-full flex justify-center items-center text-4xl">{data} Comming Soon...</p>;
};
