import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AcceptInvitation from "./pages/AcceptInvitation";
import PricingPage from "./pages/PricingPage";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminShell from "./layouts/AdminShell";
import AdminMembers from "./pages/admin/AdminMembers";
import AdminSquads from "./pages/admin/AdminSquads";
import AdminMatches from "./pages/admin/AdminMatches";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminOperations from "./pages/admin/AdminOperations";
import PlatformDashboard from "./pages/platform/PlatformDashboard";

import PlayerDashboard from "./pages/dashboard/roles/PlayerDashboard";
import CoachDashboard from "./pages/dashboard/roles/CoachDashboard";
import PhysioDashboard from "./pages/dashboard/roles/PhysioDashboard";
import ManagerDashboard from "./pages/dashboard/roles/ManagerDashboard";
import ClubAdminDashboard from "./pages/dashboard/roles/ClubAdminDashboard";
import AgentDashboard from "./pages/dashboard/roles/AgentDashboard";
import NutritionDashboard from "./pages/dashboard/roles/NutritionDashboard";
import PitchManagerDashboard from "./pages/dashboard/roles/PitchManagerDashboard";
import DashboardRouter from "./pages/dashboard/DashboardRouter";

import TrainingPage from "./pages/dashboard/sections/TrainingPage";
import MatchesPage from "./pages/dashboard/sections/MatchesPage";
import SquadManagementPage from "./pages/dashboard/sections/SquadManagementPage";
import StatsPage from "./pages/dashboard/sections/StatsPage";
import MedicalPage from "./pages/dashboard/sections/MedicalPage";
import MessagesPage from "./pages/dashboard/sections/MessagesPage";
import SettingsPage from "./pages/dashboard/sections/SettingsPage";
import BillingPage from "./pages/dashboard/sections/BillingPage";
import ProfilePage from "./pages/dashboard/sections/ProfilePage";
import OnboardingPage from "./pages/dashboard/sections/OnboardingPage";
import SchedulePage from "./pages/dashboard/sections/SchedulePage";
import MarketplaceModulePage from "./pages/marketplace/MarketplaceModulePage";
import SocialModulePage from "./pages/social/SocialModulePage";
import AIModulePage from "./pages/ai/AIModulePage";

import AppShell from "./layouts/AppShell";
import { PricingFeatureGate } from "./features/prototype-pricing/PricingFeatureGate";
import { PrototypePricingProvider } from "./features/prototype-pricing/PrototypePricingProvider";
import { getAccessToken } from "./utils/authStorage";
import { useMe } from "./hooks/useMe";
import {
  getDashboardRoleAccess,
  resolveDashboardLanding,
  type DashboardRole,
} from "./utils/dashboardRouting";
import {
  hasRolePermission,
  type RolePermission,
} from "./utils/rolePolicy";

function ProtectedRoute({ children }: { children: ReactNode }) {
  const token = getAccessToken();
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

function AdminRoute({ children }: { children: ReactNode }) {
  const token = getAccessToken();
  const { data, isLoading, isError } = useMe();

  if (!token) return <Navigate to="/login" replace />;
  if (isLoading) return <div className="p-6">Loading...</div>;
  if (isError) return <Navigate to="/dashboard" replace />;

  const membership =
    (data as any)?.activeMembership ||
    (data as any)?.memberships?.find(
      (m: any) => m?.clubId === (data as any)?.activeClubId
    ) ||
    (data as any)?.memberships?.[0] ||
    null;

  const primary = String(membership?.primary || "MEMBER") as
    | "ADMIN"
    | "MANAGER"
    | "PLAYER"
    | "MEMBER";
  const subRoles = Array.isArray(membership?.subRoles) ? membership.subRoles : [];
  if (hasRolePermission(primary, subRoles, "clubs.read")) return <>{children}</>;

  return <Navigate to="/dashboard" replace />;
}

function DashboardRoleRoute({
  children,
  requiredRole,
}: {
  children: ReactNode;
  requiredRole: DashboardRole;
}) {
  const token = getAccessToken();
  const { data, isLoading, isError } = useMe();

  if (!token) return <Navigate to="/login" replace />;
  if (isLoading) return <div className="p-6">Loading...</div>;
  if (isError) return <Navigate to="/dashboard" replace />;

  const access = getDashboardRoleAccess(data);
  const landing = resolveDashboardLanding(
    data,
    localStorage.getItem("activeDashboardRole")
  );

  if (!access.availableRoles.includes(requiredRole)) {
    return <Navigate to={landing.path} replace />;
  }

  return <>{children}</>;
}

function PlatformRoute({ children }: { children: ReactNode }) {
  const token = getAccessToken();
  const { data, isLoading, isError } = useMe();

  if (!token) return <Navigate to="/login" replace />;
  if (isLoading) return <div className="p-6">Loading...</div>;
  if (isError) return <Navigate to="/dashboard" replace />;

  if (!(data as any)?.isPlatformAdmin) {
    const landing = resolveDashboardLanding(
      data,
      localStorage.getItem("activeDashboardRole")
    );
    return <Navigate to={landing.path} replace />;
  }

  return <>{children}</>;
}

function DashboardPermissionRoute({
  children,
  permission,
}: {
  children: ReactNode;
  permission: RolePermission;
}) {
  const token = getAccessToken();
  const { data, isLoading, isError } = useMe();

  if (!token) return <Navigate to="/login" replace />;
  if (isLoading) return <div className="p-6">Loading...</div>;
  if (isError) return <Navigate to="/dashboard" replace />;

  const landing = resolveDashboardLanding(
    data,
    localStorage.getItem("activeDashboardRole")
  );
  const membership =
    (data as any)?.activeMembership ||
    (data as any)?.memberships?.find(
      (m: any) => m?.clubId === (data as any)?.activeClubId
    ) ||
    (data as any)?.memberships?.[0] ||
    null;

  const primary = String(membership?.primary || "MEMBER") as
    | "ADMIN"
    | "MANAGER"
    | "PLAYER"
    | "MEMBER";
  const subRoles = Array.isArray(membership?.subRoles) ? membership.subRoles : [];
  if (!hasRolePermission(primary, subRoles, permission)) {
    return <Navigate to={landing.path} replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <PrototypePricingProvider>
        <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/invitations/accept" element={<AcceptInvitation />} />
        <Route
          path="/marketplace"
          element={
            <ProtectedRoute>
              <PricingFeatureGate feature="marketplace_recruiting">
                <MarketplaceModulePage />
              </PricingFeatureGate>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ai"
          element={
            <ProtectedRoute>
              <PricingFeatureGate feature="ai_assistant">
                <AIModulePage />
              </PricingFeatureGate>
            </ProtectedRoute>
          }
        />
        <Route
          path="/social"
          element={
            <ProtectedRoute>
              <Navigate to="/dashboard/social" replace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/platform"
          element={
            <PlatformRoute>
              <PlatformDashboard />
            </PlatformRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminShell />
            </AdminRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="members" element={<AdminMembers />} />
          <Route path="squads" element={<AdminSquads />} />
          <Route path="matches" element={<AdminMatches />} />
          <Route path="operations" element={<AdminOperations />} />
          <Route
            path="analytics"
            element={
              <PricingFeatureGate feature="advanced_analytics">
                <AdminAnalytics />
              </PricingFeatureGate>
            }
          />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>

        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardRouter />} />

          <Route
            path="player"
            element={
              <DashboardRoleRoute requiredRole="PLAYER">
                <PlayerDashboard />
              </DashboardRoleRoute>
            }
          />
          <Route
            path="coach"
            element={
              <DashboardRoleRoute requiredRole="COACH">
                <CoachDashboard />
              </DashboardRoleRoute>
            }
          />
          <Route
            path="physio"
            element={
              <DashboardRoleRoute requiredRole="PHYSIO">
                <PhysioDashboard />
              </DashboardRoleRoute>
            }
          />
          <Route
            path="manager"
            element={
              <DashboardRoleRoute requiredRole="MANAGER">
                <ManagerDashboard />
              </DashboardRoleRoute>
            }
          />
          <Route
            path="admin"
            element={
              <DashboardRoleRoute requiredRole="ADMIN">
                <ClubAdminDashboard />
              </DashboardRoleRoute>
            }
          />
          <Route
            path="agent"
            element={
              <DashboardRoleRoute requiredRole="AGENT">
                <AgentDashboard />
              </DashboardRoleRoute>
            }
          />
          <Route
            path="nutrition"
            element={
              <DashboardRoleRoute requiredRole="NUTRITIONIST">
                <NutritionDashboard />
              </DashboardRoleRoute>
            }
          />
          <Route
            path="pitch"
            element={
              <DashboardRoleRoute requiredRole="PITCH_MANAGER">
                <PitchManagerDashboard />
              </DashboardRoleRoute>
            }
          />

          <Route
            path="members"
            element={
              <DashboardPermissionRoute permission="members.read">
                <AdminMembers />
              </DashboardPermissionRoute>
            }
          />
          <Route
            path="training"
            element={
              <DashboardPermissionRoute permission="operations.read">
                <TrainingPage />
              </DashboardPermissionRoute>
            }
          />
          <Route
            path="matches"
            element={
              <DashboardPermissionRoute permission="matches.read">
                <MatchesPage />
              </DashboardPermissionRoute>
            }
          />
          <Route
            path="schedule"
            element={
              <DashboardPermissionRoute permission="schedule.read">
                <SchedulePage />
              </DashboardPermissionRoute>
            }
          />
          <Route
            path="squad-management"
            element={
              <DashboardPermissionRoute permission="lineups.read">
                <SquadManagementPage />
              </DashboardPermissionRoute>
            }
          />
          <Route
            path="stats"
            element={
              <DashboardPermissionRoute permission="stats.read">
                <StatsPage />
              </DashboardPermissionRoute>
            }
          />
          <Route
            path="medical"
            element={
              <DashboardPermissionRoute permission="injuries.read">
                <PricingFeatureGate feature="medical_management">
                  <MedicalPage />
                </PricingFeatureGate>
              </DashboardPermissionRoute>
            }
          />
          <Route
            path="messages"
            element={
              <DashboardPermissionRoute permission="membership.self.read">
                <MessagesPage />
              </DashboardPermissionRoute>
            }
          />
          <Route
            path="social"
            element={
              <DashboardPermissionRoute permission="membership.self.read">
                <PricingFeatureGate feature="social_publishing">
                  <SocialModulePage />
                </PricingFeatureGate>
              </DashboardPermissionRoute>
            }
          />
          <Route
            path="profile"
            element={
              <DashboardPermissionRoute permission="membership.self.read">
                <ProfilePage />
              </DashboardPermissionRoute>
            }
          />
          <Route
            path="settings"
            element={
              <DashboardPermissionRoute permission="membership.self.read">
                <SettingsPage />
              </DashboardPermissionRoute>
            }
          />
          <Route
            path="billing"
            element={
              <DashboardPermissionRoute permission="membership.self.read">
                <BillingPage />
              </DashboardPermissionRoute>
            }
          />
          <Route
            path="onboarding"
            element={
              <DashboardPermissionRoute permission="membership.accept.assignment">
                <OnboardingPage />
              </DashboardPermissionRoute>
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </PrototypePricingProvider>
    </BrowserRouter>
  );
}
