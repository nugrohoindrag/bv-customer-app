import { lazy, Suspense, type ReactNode } from "react";
import { createBrowserRouter, Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./auth";
import { useAppConfig } from "./app-config";
import { BrandLogo, Wordmark } from "@/components/illustrations";

const OnboardingPage = lazy(() => import("@/features/onboarding/OnboardingPage"));
const PhonePage = lazy(() => import("@/features/auth/PhonePage"));
const OtpPage = lazy(() => import("@/features/auth/OtpPage"));
const RegisterPage = lazy(() => import("@/features/auth/RegisterPage"));
const ChangePinPage = lazy(() => import("@/features/account/ChangePinPage"));
const HomePage = lazy(() => import("@/features/home/HomePage"));
const CatalogPage = lazy(() => import("@/features/catalog/CatalogPage"));
const PropertyPage = lazy(() => import("@/features/property/PropertyPage"));
const PhotosPage = lazy(() => import("@/features/property/PhotosPage"));
const DatesPage = lazy(() => import("@/features/search/DatesPage"));
const GuestsPage = lazy(() => import("@/features/search/GuestsPage"));
const ProcessingPage = lazy(() => import("@/features/booking/ProcessingPage"));
const BookingsPage = lazy(() => import("@/features/booking/BookingsPage"));
const BookingDetailPage = lazy(() => import("@/features/booking/BookingDetailPage"));
const PaymentMethodPage = lazy(() => import("@/features/booking/PaymentMethodPage"));
const PaymentPage = lazy(() => import("@/features/booking/PaymentPage"));
const CancelPage = lazy(() => import("@/features/booking/CancelPage"));
const GuestDataPage = lazy(() => import("@/features/booking/GuestDataPage"));
const ReviewPage = lazy(() => import("@/features/booking/ReviewPage"));
const SavedPage = lazy(() => import("@/features/saved/SavedPage"));
const InboxPage = lazy(() => import("@/features/inbox/InboxPage"));
const AccountPage = lazy(() => import("@/features/account/AccountPage"));
const EditAccountPage = lazy(() => import("@/features/account/EditAccountPage"));
const LegalPage = lazy(() => import("@/features/legal/LegalPage"));

/** Splash Figma: logo + wordmark di tengah layar putih. */
export function Splash() {
  return (
    <div className="app-shell flex min-h-dvh flex-col items-center justify-center gap-4">
      <BrandLogo size={110} />
      <Wordmark />
    </div>
  );
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { customer, ready, onboarded } = useAuth();
  const loc = useLocation();
  if (!ready) return <Splash />;
  if (!customer) return <Navigate to={onboarded ? "/login" : "/welcome"} replace state={{ from: loc.pathname + loc.search }} />;
  return <>{children}</>;
}

function PublicOnly({ children }: { children: ReactNode }) {
  const { customer, ready } = useAuth();
  if (!ready) return <Splash />;
  if (customer) return <Navigate to="/home" replace />;
  return <>{children}</>;
}

/** Root: belum onboarding → welcome; org satu properti → langsung Detail (requirements §1 HOME). */
function Root() {
  const { ready, onboarded, customer, guest } = useAuth();
  const { config } = useAppConfig();
  if (!ready) return <Splash />;
  if (!onboarded && !customer && !guest) return <Navigate to="/welcome" replace />;
  if (config.single_property_slug) return <Navigate to={`/property/${config.single_property_slug}`} replace />;
  return <Navigate to="/home" replace />;
}

function Lazy() {
  return (
    <Suspense fallback={<Splash />}>
      <Outlet />
    </Suspense>
  );
}

function NotFound() {
  return (
    <div className="app-shell flex min-h-dvh flex-col items-center justify-center gap-2 p-6 text-center">
      <div className="text-4xl font-extrabold text-brand-500">404</div>
      <div className="text-neutral-500">Halaman tidak ditemukan.</div>
      <a href="/home" className="mt-3 font-bold text-brand-600">
        Kembali ke Beranda
      </a>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    element: <Lazy />,
    children: [
      { path: "/", element: <Root /> },
      { path: "/welcome", element: <PublicOnly><OnboardingPage /></PublicOnly> },
      { path: "/login", element: <PublicOnly><PhonePage /></PublicOnly> },
      { path: "/login/otp", element: <PublicOnly><OtpPage /></PublicOnly> },
      { path: "/register", element: <PublicOnly><RegisterPage /></PublicOnly> },
      { path: "/register/otp", element: <PublicOnly><OtpPage /></PublicOnly> },
      // publik (guest boleh)
      { path: "/home", element: <HomePage /> },
      { path: "/catalog", element: <CatalogPage /> },
      { path: "/property/:slug", element: <PropertyPage /> },
      { path: "/property/:slug/photos", element: <PhotosPage /> },
      { path: "/search/dates", element: <DatesPage /> },
      { path: "/search/guests", element: <GuestsPage /> },
      { path: "/terms", element: <LegalPage kind="terms" /> },
      { path: "/privacy", element: <LegalPage kind="privacy" /> },
      {
        element: (
          <RequireAuth>
            <Outlet />
          </RequireAuth>
        ),
        children: [
          { path: "/booking/new", element: <ProcessingPage /> },
          { path: "/bookings", element: <BookingsPage /> },
          { path: "/bookings/:code", element: <BookingDetailPage /> },
          { path: "/bookings/:code/pay", element: <PaymentMethodPage /> },
          { path: "/bookings/:code/payment", element: <PaymentPage /> },
          { path: "/bookings/:code/cancel", element: <CancelPage /> },
          { path: "/bookings/:code/guest", element: <GuestDataPage /> },
          { path: "/bookings/:code/review", element: <ReviewPage /> },
          { path: "/saved", element: <SavedPage /> },
          { path: "/inbox", element: <InboxPage /> },
          { path: "/account", element: <AccountPage /> },
          { path: "/account/edit", element: <EditAccountPage /> },
          { path: "/account/otp", element: <OtpPage /> },
          { path: "/account/pin", element: <ChangePinPage /> },
        ],
      },
      { path: "*", element: <NotFound /> },
    ],
  },
]);
