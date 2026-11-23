import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { Suspense, lazy, type ReactNode } from 'react';
import { AuthProvider } from './AuthContext';
import { Spinner } from '../components/Spinner';
import { ErrorBoundary } from './ErrorBoundary';
import { ToastProvider } from '../components/Toast';
import { ProtectedRoute } from './ProtectedRoute';
import type { Permission } from '@aranax/contracts';
import { CACHE_TTL } from '@aranax/contracts';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: CACHE_TTL.analytics.ms, // 30s default; individual queries override with longer TTLs
      retry: (count, err: unknown) => {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status && status >= 400 && status < 500) return false;
        return count < 2;
      },
    },
  },
});

// Auth
const Login          = lazy(() => import('../features/auth/Login'));
const ForgotPassword = lazy(() => import('../features/auth/ForgotPassword'));
// Core
const Dashboard  = lazy(() => import('../features/dashboard/Dashboard'));
// Leads
const Leads      = lazy(() => import('../features/leads/Leads'));
const LeadDetail = lazy(() => import('../features/leads/LeadDetail'));
const LeadForm   = lazy(() => import('../features/leads/LeadForm'));
// Opportunities
const Opportunities     = lazy(() => import('../features/opportunities/Opportunities'));
const OpportunityDetail = lazy(() => import('../features/opportunities/OpportunityDetail'));
const OpportunityForm   = lazy(() => import('../features/opportunities/OpportunityForm'));
// Follow-ups
const FollowUps    = lazy(() => import('../features/followups/FollowUps'));
const FollowUpForm = lazy(() => import('../features/followups/FollowUpForm'));
// Customers
const Customers      = lazy(() => import('../features/customers/Customers'));
const CustomerDetail = lazy(() => import('../features/customers/CustomerDetail'));
const CustomerForm   = lazy(() => import('../features/customers/CustomerForm'));
// Revenue
const Revenue     = lazy(() => import('../features/revenue/Revenue'));
const RevenueForm = lazy(() => import('../features/revenue/RevenueForm'));
// Campaigns
const Campaigns      = lazy(() => import('../features/campaigns/Campaigns'));
const CampaignDetail = lazy(() => import('../features/campaigns/CampaignDetail'));
const CampaignForm   = lazy(() => import('../features/campaigns/CampaignForm'));
// Referrals
const Referrals      = lazy(() => import('../features/referrals/Referrals'));
const ReferralDetail = lazy(() => import('../features/referrals/ReferralDetail'));
const ReferralForm   = lazy(() => import('../features/referrals/ReferralForm'));
// Users
const Users      = lazy(() => import('../features/users/Users'));
const UserDetail = lazy(() => import('../features/users/UserDetail'));
const UserForm   = lazy(() => import('../features/users/UserForm'));
// Analytics
const AttributionPage = lazy(() => import('../features/analytics/AttributionPage'));
// Settings
const SettingsHome   = lazy(() => import('../features/settings/SettingsHome'));
const LlmSettings    = lazy(() => import('../features/settings/LlmSettings'));
const UserRoles      = lazy(() => import('../features/settings/UserRoles'));
const UserRoleForm   = lazy(() => import('../features/settings/UserRoleForm'));
const RbacSettings   = lazy(() => import('../features/settings/RbacSettings'));
const GeneralSettings = lazy(() => import('../features/settings/GeneralSettings'));
const SecuritySettings = lazy(() => import('../features/settings/SecuritySettings'));
// Public (unauthenticated)
const CaptureChat = lazy(() => import('../features/public/CaptureChat'));
const Enquiry    = lazy(() => import('../features/public/Enquiry'));
const Discovery  = lazy(() => import('../features/public/Discovery'));
const Assessment = lazy(() => import('../features/public/Assessment'));

function Guard({ permission, children }: { permission?: Permission; children: ReactNode }) {
  return <ProtectedRoute permission={permission}>{children}</ProtectedRoute>;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <ErrorBoundary>
              <Suspense fallback={<Spinner />}>
                <Routes>
                  {/* Public / auth */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/enquiry" element={<CaptureChat />} />
                  <Route path="/enquiry/form" element={<Enquiry />} />
                  <Route path="/discovery" element={<Discovery />} />
                  <Route path="/assessments/:slug" element={<Assessment />} />

                  {/* App */}
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Guard><Dashboard /></Guard>} />

                  <Route path="/leads" element={<Guard permission="leads.read"><Leads /></Guard>} />
                  <Route path="/leads/new" element={<Guard permission="leads.create"><LeadForm /></Guard>} />
                  <Route path="/leads/:id" element={<Guard permission="leads.read"><LeadDetail /></Guard>} />

                  <Route path="/opportunities" element={<Guard permission="opportunities.read"><Opportunities /></Guard>} />
                  <Route path="/opportunities/new" element={<Guard permission="opportunities.create"><OpportunityForm /></Guard>} />
                  <Route path="/opportunities/:id" element={<Guard permission="opportunities.read"><OpportunityDetail /></Guard>} />

                  <Route path="/follow-ups" element={<Guard permission="follow_ups.manage"><FollowUps /></Guard>} />
                  <Route path="/follow-ups/new" element={<Guard permission="follow_ups.manage"><FollowUpForm /></Guard>} />

                  <Route path="/customers" element={<Guard permission="customers.read"><Customers /></Guard>} />
                  <Route path="/customers/new" element={<Guard permission="customers.manage"><CustomerForm /></Guard>} />
                  <Route path="/customers/:id" element={<Guard permission="customers.read"><CustomerDetail /></Guard>} />

                  <Route path="/revenue" element={<Guard permission="revenue.read"><Revenue /></Guard>} />
                  <Route path="/revenue/new" element={<Guard permission="revenue.manage"><RevenueForm /></Guard>} />

                  <Route path="/campaigns" element={<Guard permission="campaigns.manage"><Campaigns /></Guard>} />
                  <Route path="/campaigns/new" element={<Guard permission="campaigns.manage"><CampaignForm /></Guard>} />
                  <Route path="/campaigns/:id" element={<Guard permission="campaigns.manage"><CampaignDetail /></Guard>} />

                  <Route path="/referrals" element={<Guard permission="referrals.manage"><Referrals /></Guard>} />
                  <Route path="/referrals/new" element={<Guard permission="referrals.manage"><ReferralForm /></Guard>} />
                  <Route path="/referrals/:id" element={<Guard permission="referrals.manage"><ReferralDetail /></Guard>} />

                  <Route path="/users" element={<Guard permission="users.manage"><Users /></Guard>} />
                  <Route path="/users/new" element={<Guard permission="users.manage"><UserForm /></Guard>} />
                  <Route path="/users/:id" element={<Guard permission="users.manage"><UserDetail /></Guard>} />
                  <Route path="/users/:id/edit" element={<Guard permission="users.manage"><UserForm /></Guard>} />

                  <Route path="/analytics/attribution" element={<Guard permission="analytics.read"><AttributionPage /></Guard>} />
                  <Route path="/settings" element={<Guard permission="users.manage"><SettingsHome /></Guard>} />
                  <Route path="/settings/llm" element={<Guard permission="users.manage"><LlmSettings /></Guard>} />
                  <Route path="/settings/user-roles" element={<Guard permission="users.manage"><UserRoles /></Guard>} />
                  <Route path="/settings/user-roles/new" element={<Guard permission="users.manage"><UserRoleForm /></Guard>} />
                  <Route path="/settings/user-roles/:role/edit" element={<Guard permission="users.manage"><UserRoleForm /></Guard>} />
                  <Route path="/settings/rbac" element={<Guard permission="users.manage"><RbacSettings /></Guard>} />
                  <Route path="/settings/general" element={<Guard permission="users.manage"><GeneralSettings /></Guard>} />
                  <Route path="/settings/security" element={<Guard permission="users.manage"><SecuritySettings /></Guard>} />

                  {/* Unknown → dashboard */}
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
