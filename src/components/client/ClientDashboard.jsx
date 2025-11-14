import { RoleAwareSidebar } from "@/components/dashboard/RoleAwareSidebar";
import { DashboardContent } from "@/components/freelancer/FreelancerDashboard";

const ClientDashboard = () => {
  return (
    <RoleAwareSidebar>
      <DashboardContent roleOverride="CLIENT" />
    </RoleAwareSidebar>
  );
};

export default ClientDashboard;
