import AlertSection from "@/components/dashboard/AlertSection";
import { DashboardService, MembershipAlertDTO } from "@/lib/services/dashboard.service";

/**
 * Alerts Section Component – Fetches real data for expiring memberships
 */
export async function AlertsSection() {
  const alerts = await DashboardService.getAlertasVencimientos();

  // Convert to the format expected by AlertSection
  const formattedAlerts = alerts.map((alert: MembershipAlertDTO) => ({
    id: alert.id,
    clientName: alert.clientName,
    clientEmail: alert.clientEmail || "",
    endDate: alert.endDate,
    daysLeft: alert.daysLeft,
  }));

  return <AlertSection alerts={formattedAlerts} />;
}
