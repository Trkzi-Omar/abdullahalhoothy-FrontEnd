import SideBar from '../SideBar/SideBar';
import { Route, Routes, useLocation } from 'react-router';
import NotFound from '../../pages/NotFound/NotFound';
import Dataview from '../../pages/Dataview/Dataview';
import Auth from '../../pages/Auth/Auth';
import MapContainer from '../../pages/MapContainer/MapContainer';
import Home from '../../pages/Home/Home';
import Profile from '../../pages/Profile/Profile';
import ProfileLayout from '../../pages/Profile/ProfileLayout';
import OrganizationLayout from '../../pages/Organization/OrganizationLayout';
import Organization from '../../pages/Organization/Organization';
import BillingLayout from '../../pages/Billing/BillingLayout';
import ProfileMain from '../../pages/Profile/Routes/ProfileMain/ProfileMain';
import CheckoutBilling from '../../pages/Billing/Routes/CheckoutBilling/CheckoutBilling';
import ChangeEmail from '../../pages/ChangeEmail/ChangeEmail';
import ChangePassword from '../../pages/ChangePassword/ChangePassword';
import PaymentMethods from '../../pages/PaymentMethods/PaymentMethods';
import PaymentMethod from '../../pages/PaymentMethod/PaymentMethod';
import MobileNavbar from '../MobileNavbar/MobileNavbar';
import Wallet from '../../pages/Wallet/Wallet';
import AddFunds from '../../pages/AddFunds/AddFunds';
import SignUp from '../../pages/Auth/SignUp';
import CampaignPage from '../../pages/Campaign/campaign';
import PlansPage from '../../pages/Plans/Plans';
import StaticRedirect from '../StaticRedirect/StaticRedirect';
import CustomReportForm from '../CustomReportForm';
import MarketingDashboard from '../../pages/MarketingDashboard/MarketingDashboard';
import { BillingProvider } from '../../context/BillingContext';
import Billing from '../../pages/Billing/Billing';
import GuestAutoLogin from '../../pages/Auth/GuestAutoLogin';
import SmartSegmentReport from '../SegmentReport';
const Layout = () => {
  const location = useLocation();

  // Hide sidebar & navbar only on /campaign, /plans, or /custom-report
  const hideLayout =
    location.pathname.startsWith('/campaign') ||
    location.pathname.startsWith('/plans') ||
    location.pathname.startsWith('/custom-report');

  const isBillingRoute = location.pathname.startsWith('/billing');

  const routesContent = (
    <>
      <GuestAutoLogin />

      <Routes>
        <Route path="*" element={<NotFound />} />
        <Route path={'/tabularView'} element={<></>} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/sign-up" element={<SignUp />} />
        <Route path="/sign-up/:source" element={<SignUp />} />
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
        <Route path="/smart-segment-report" element={<SmartSegmentReport />} />
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
    </>
  );

  return (
    <div className="flex flex-col ">
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
