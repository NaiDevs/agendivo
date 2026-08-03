export const APP_SECTION = {
  DASHBOARD: "dashboard",
  APPOINTMENTS: "appointments",
  CUSTOMERS: "customers",
  EMPLOYEES: "employees",
  SERVICES: "services",
  PAYMENTS: "payments",
  REPORTS: "reports",
  SETTINGS: "settings",
} as const;

export type AppSection = (typeof APP_SECTION)[keyof typeof APP_SECTION];
