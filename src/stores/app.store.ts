import { create } from "zustand";

import type { Business } from "@/domain/entities/business";
import type { FiscalConfiguration } from "@/domain/entities/fiscal-configuration";
import type { Appointment } from "@/domain/entities/appointment";
import type { Customer } from "@/domain/entities/customer";
import type { Employee } from "@/domain/entities/employee";
import { EMPLOYEE_ACCOUNT_ROLE } from "@/domain/entities/employee";
import type { Expense } from "@/domain/entities/expense";
import type { Payment } from "@/domain/entities/payment";
import type { Service } from "@/domain/entities/service";
import {
  createBusinessOnboarding,
  updateBusinessProfile,
  updateFiscalCorrelative,
} from "@/domain/services/business.service";
import {
  cancelAppointment as cancelAppointmentRecord,
  createAppointment,
  updateAppointment,
} from "@/domain/services/appointment.service";
import {
  createCustomer,
  updateCustomer,
} from "@/domain/services/customer.service";
import {
  createEmployee,
  updateEmployee,
} from "@/domain/services/employee.service";
import {
  createExpense,
  deleteExpense as deleteExpenseRecord,
  updateExpense,
} from "@/domain/services/expense.service";
import {
  createPayment,
  pendingBalance,
  voidPayment as voidPaymentRecord,
} from "@/domain/services/payment.service";
import {
  createService,
  updateService,
} from "@/domain/services/service.service";
import { getDatabaseClient } from "@/infrastructure/database/connection";
import {
  assertDeviceAccount,
  getDeviceId,
} from "@/infrastructure/database/device-metadata";
import { SqliteBusinessRepository } from "@/infrastructure/repositories/sqlite-business.repository";
import { SqliteAppointmentRepository } from "@/infrastructure/repositories/sqlite-appointment.repository";
import { SqliteCustomerRepository } from "@/infrastructure/repositories/sqlite-customer.repository";
import { SqliteEmployeeRepository } from "@/infrastructure/repositories/sqlite-employee.repository";
import { SupabaseTeamInvitationRepository } from "@/infrastructure/repositories/supabase-team-invitation.repository";
import { SqliteExpenseRepository } from "@/infrastructure/repositories/sqlite-expense.repository";
import { SqlitePaymentRepository } from "@/infrastructure/repositories/sqlite-payment.repository";
import { SqliteServiceRepository } from "@/infrastructure/repositories/sqlite-service.repository";
import { getErrorMessage } from "@/lib/error-message";
import type { BusinessOnboardingValues } from "@/schemas/fiscal.schema";
import type { FiscalCorrelativeFormValues } from "@/schemas/fiscal.schema";
import type { BusinessFormValues } from "@/schemas/business.schema";
import type { AppointmentFormValues } from "@/schemas/appointment.schema";
import type { CustomerFormValues } from "@/schemas/customer.schema";
import type { EmployeeFormValues } from "@/schemas/employee.schema";
import { employeeFormSchema } from "@/schemas/employee.schema";
import type { ExpenseFormValues } from "@/schemas/expense.schema";
import type { PaymentFormValues } from "@/schemas/payment.schema";
import type { ServiceFormValues } from "@/schemas/service.schema";
import { loadingService, toastService } from "@/stores/feedback.store";
import { useSyncStore } from "@/stores/sync.store";
import { useAuthStore } from "@/stores/auth.store";

async function markPendingSync(): Promise<void> {
  await useSyncStore.getState().markPendingChanges();
}

function byPaidAtDesc(left: Payment, right: Payment): number {
  return right.paidAt.localeCompare(left.paidAt);
}

function bySpentAtDesc(left: Expense, right: Expense): number {
  return right.spentAt.localeCompare(left.spentAt);
}

export const APP_PHASE = {
  IDLE: "idle",
  LOADING: "loading",
  SETUP: "setup",
  READY: "ready",
  ERROR: "error",
} as const;

type AppPhase = (typeof APP_PHASE)[keyof typeof APP_PHASE];

interface AppStore {
  phase: AppPhase;
  business: Business | null;
  fiscalConfiguration: FiscalConfiguration | null;
  appointments: Appointment[];
  customers: Customer[];
  employees: Employee[];
  services: Service[];
  payments: Payment[];
  expenses: Expense[];
  isSaving: boolean;
  error: string | null;
  initialize: (authenticatedUserId?: string) => Promise<void>;
  completeBusinessOnboarding: (
    values: BusinessOnboardingValues,
  ) => Promise<boolean>;
  editBusinessProfile: (values: BusinessFormValues) => Promise<boolean>;
  editFiscalCorrelative: (
    values: FiscalCorrelativeFormValues,
  ) => Promise<boolean>;
  addAppointment: (values: AppointmentFormValues) => Promise<boolean>;
  editAppointment: (
    appointmentId: string,
    values: AppointmentFormValues,
  ) => Promise<boolean>;
  cancelAppointment: (appointmentId: string) => Promise<boolean>;
  addCustomer: (values: CustomerFormValues) => Promise<boolean>;
  editCustomer: (
    customerId: string,
    values: CustomerFormValues,
  ) => Promise<boolean>;
  addEmployee: (values: EmployeeFormValues) => Promise<boolean>;
  editEmployee: (
    employeeId: string,
    values: EmployeeFormValues,
  ) => Promise<boolean>;
  addService: (values: ServiceFormValues) => Promise<boolean>;
  editService: (
    serviceId: string,
    values: ServiceFormValues,
  ) => Promise<boolean>;
  addPayment: (values: PaymentFormValues) => Promise<boolean>;
  voidPayment: (paymentId: string) => Promise<boolean>;
  appointmentBalance: (appointmentId: string) => number;
  addExpense: (values: ExpenseFormValues) => Promise<boolean>;
  editExpense: (
    expenseId: string,
    values: ExpenseFormValues,
  ) => Promise<boolean>;
  deleteExpense: (expenseId: string) => Promise<boolean>;
  clearError: () => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  phase: APP_PHASE.IDLE,
  business: null,
  fiscalConfiguration: null,
  appointments: [],
  customers: [],
  employees: [],
  services: [],
  payments: [],
  expenses: [],
  isSaving: false,
  error: null,

  initialize: async (authenticatedUserId?: string): Promise<void> => {
    if (get().phase === APP_PHASE.LOADING) {
      return;
    }

    set({ phase: APP_PHASE.LOADING, error: null });

    try {
      const database = await getDatabaseClient();
      const deviceId = await getDeviceId(database);
      if (authenticatedUserId !== undefined) {
        await assertDeviceAccount(database, authenticatedUserId);
      }
      const businessRepository = new SqliteBusinessRepository(database);
      const business = await businessRepository.findActive();

      if (business === null) {
        set({
          phase: APP_PHASE.SETUP,
          business: null,
          fiscalConfiguration: null,
          appointments: [],
          customers: [],
          employees: [],
          services: [],
          payments: [],
          expenses: [],
        });
        return;
      }

      const customerRepository = new SqliteCustomerRepository(database);
      const appointmentRepository = new SqliteAppointmentRepository(database);
      const employeeRepository = new SqliteEmployeeRepository(database);
      const serviceRepository = new SqliteServiceRepository(database);
      const paymentRepository = new SqlitePaymentRepository(database);
      const expenseRepository = new SqliteExpenseRepository(database);
      const [
        appointments,
        customers,
        loadedEmployees,
        services,
        payments,
        expenses,
        fiscalConfiguration,
      ] = await Promise.all([
        appointmentRepository.findActiveByBusiness(business.id),
        customerRepository.findActiveByBusiness(business.id),
        employeeRepository.findActiveByBusiness(business.id),
        serviceRepository.findActiveByBusiness(business.id),
        paymentRepository.findActiveByBusiness(business.id),
        expenseRepository.findActiveByBusiness(business.id),
        businessRepository.findFiscalConfiguration(business.id),
      ]);
      let employees = loadedEmployees;
      const authenticatedUser = useAuthStore.getState().user;
      if (
        authenticatedUserId !== undefined &&
        authenticatedUser?.id === authenticatedUserId &&
        !employees.some(
          (employee) => employee.accountRole === EMPLOYEE_ACCOUNT_ROLE.OWNER,
        )
      ) {
        const existingOwnerRecord = employees.find(
          (employee) =>
            employee.email?.toLowerCase() ===
            authenticatedUser.email.toLowerCase(),
        );
        if (existingOwnerRecord === undefined) {
          const ownerEmployee = await createEmployee(
            {
              email: authenticatedUser.email,
              name: authenticatedUser.fullName,
              phone: "",
            },
            business.id,
            deviceId,
            employeeRepository,
            {
              role: EMPLOYEE_ACCOUNT_ROLE.OWNER,
              userId: authenticatedUser.id,
            },
          );
          employees = [...employees, ownerEmployee];
        } else {
          const ownerEmployee: Employee = {
            ...existingOwnerRecord,
            accountRole: EMPLOYEE_ACCOUNT_ROLE.OWNER,
            userId: authenticatedUser.id,
            updatedAt: new Date().toISOString(),
            version: existingOwnerRecord.version + 1,
          };
          await employeeRepository.update(ownerEmployee);
          employees = employees.map((employee) =>
            employee.id === ownerEmployee.id ? ownerEmployee : employee,
          );
        }
        employees.sort((left, right) => left.name.localeCompare(right.name));
        await markPendingSync();
      }
      set({
        phase: APP_PHASE.READY,
        business,
        fiscalConfiguration,
        appointments,
        customers,
        employees,
        services,
        payments,
        expenses,
      });
    } catch (error: unknown) {
      set({ phase: APP_PHASE.ERROR, error: getErrorMessage(error) });
    }
  },

  completeBusinessOnboarding: async (
    values: BusinessOnboardingValues,
  ): Promise<boolean> => {
    set({ isSaving: true, error: null });

    const operationId = loadingService.start("Guardando la configuración…");
    try {
      const database = await getDatabaseClient();
      const deviceId = await getDeviceId(database);
      const repository = new SqliteBusinessRepository(database);
      const business = await createBusinessOnboarding(
        values,
        deviceId,
        repository,
      );
      const owner = useAuthStore.getState().user;
      if (owner === null) {
        throw new Error("No encontramos la cuenta propietaria activa.");
      }
      const employeeRepository = new SqliteEmployeeRepository(database);
      const ownerEmployee = await createEmployee(
        { email: owner.email, name: owner.fullName, phone: "" },
        business.id,
        deviceId,
        employeeRepository,
        { role: EMPLOYEE_ACCOUNT_ROLE.OWNER, userId: owner.id },
      );
      const fiscalConfiguration = await repository.findFiscalConfiguration(
        business.id,
      );
      await markPendingSync();
      set({
        phase: APP_PHASE.READY,
        business,
        fiscalConfiguration,
        appointments: [],
        customers: [],
        employees: [ownerEmployee],
        services: [],
        payments: [],
        expenses: [],
        isSaving: false,
      });
      toastService.success("Negocio configurado correctamente");
      return true;
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      set({ isSaving: false, error: message });
      toastService.error("No pudimos guardar el negocio", message);
      return false;
    } finally {
      loadingService.stop(operationId);
    }
  },

  editBusinessProfile: async (values: BusinessFormValues): Promise<boolean> => {
    const current = get().business;
    if (current === null) return false;
    set({ isSaving: true, error: null });
    const operationId = loadingService.start("Actualizando el perfil…");
    try {
      const repository = new SqliteBusinessRepository(
        await getDatabaseClient(),
      );
      const business = await updateBusinessProfile(current, values, repository);
      await markPendingSync();
      set({ business, isSaving: false });
      toastService.success("Perfil actualizado correctamente");
      return true;
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      set({ isSaving: false, error: message });
      toastService.error("No pudimos actualizar el perfil", message);
      return false;
    } finally {
      loadingService.stop(operationId);
    }
  },

  editFiscalCorrelative: async (
    values: FiscalCorrelativeFormValues,
  ): Promise<boolean> => {
    const current = get().fiscalConfiguration;
    const business = get().business;
    if (business === null) return false;
    set({ isSaving: true, error: null });
    const operationId = loadingService.start("Actualizando el correlativo…");
    try {
      const database = await getDatabaseClient();
      const repository = new SqliteBusinessRepository(database);
      const deviceId = await getDeviceId(database);
      const fiscalConfiguration = await updateFiscalCorrelative(
        current,
        business.id,
        deviceId,
        values,
        repository,
      );
      await markPendingSync();
      set({ fiscalConfiguration, isSaving: false });
      toastService.success("Correlativo actualizado correctamente");
      return true;
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      set({ isSaving: false, error: message });
      toastService.error("No pudimos actualizar el correlativo", message);
      return false;
    } finally {
      loadingService.stop(operationId);
    }
  },

  addAppointment: async (values: AppointmentFormValues): Promise<boolean> => {
    const business = get().business;
    if (business === null) {
      const message = "Configura el negocio antes de registrar una cita.";
      set({ error: message });
      toastService.error("No pudimos registrar la cita", message);
      return false;
    }

    set({ isSaving: true, error: null });
    const operationId = loadingService.start("Guardando la cita…");
    try {
      const database = await getDatabaseClient();
      const deviceId = await getDeviceId(database);
      const repository = new SqliteAppointmentRepository(database);
      const appointment = await createAppointment(
        values,
        business.id,
        deviceId,
        repository,
      );
      await markPendingSync();
      set({
        appointments: [...get().appointments, appointment].sort((left, right) =>
          left.startsAt.localeCompare(right.startsAt),
        ),
        isSaving: false,
      });
      toastService.success("Cita creada correctamente");
      return true;
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      set({ isSaving: false, error: message });
      toastService.error("No pudimos guardar la cita", message);
      return false;
    } finally {
      loadingService.stop(operationId);
    }
  },

  editAppointment: async (
    appointmentId: string,
    values: AppointmentFormValues,
  ): Promise<boolean> => {
    const current = get().appointments.find(
      (item) => item.id === appointmentId,
    );
    if (current === undefined) {
      const message = "La cita seleccionada ya no está disponible.";
      set({ error: message });
      toastService.error("No pudimos actualizar la cita", message);
      return false;
    }

    set({ isSaving: true, error: null });
    const operationId = loadingService.start("Actualizando la cita…");
    try {
      const database = await getDatabaseClient();
      const repository = new SqliteAppointmentRepository(database);
      const appointment = await updateAppointment(current, values, repository);
      await markPendingSync();
      set({
        appointments: get()
          .appointments.map((item) =>
            item.id === appointment.id ? appointment : item,
          )
          .sort((left, right) => left.startsAt.localeCompare(right.startsAt)),
        isSaving: false,
      });
      toastService.success("Cita actualizada correctamente");
      return true;
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      set({ isSaving: false, error: message });
      toastService.error("No pudimos actualizar la cita", message);
      return false;
    } finally {
      loadingService.stop(operationId);
    }
  },

  cancelAppointment: async (appointmentId: string): Promise<boolean> => {
    const current = get().appointments.find(
      (item) => item.id === appointmentId,
    );
    if (current === undefined) {
      const message = "La cita seleccionada ya no está disponible.";
      set({ error: message });
      toastService.error("No pudimos cancelar la cita", message);
      return false;
    }

    set({ isSaving: true, error: null });
    const operationId = loadingService.start("Cancelando la cita…");
    try {
      const database = await getDatabaseClient();
      const repository = new SqliteAppointmentRepository(database);
      const appointment = await cancelAppointmentRecord(current, repository);
      await markPendingSync();
      set({
        appointments: get().appointments.map((item) =>
          item.id === appointment.id ? appointment : item,
        ),
        isSaving: false,
      });
      toastService.success("Cita cancelada correctamente");
      return true;
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      set({ isSaving: false, error: message });
      toastService.error("No pudimos cancelar la cita", message);
      return false;
    } finally {
      loadingService.stop(operationId);
    }
  },

  addCustomer: async (values: CustomerFormValues): Promise<boolean> => {
    const business = get().business;
    if (business === null) {
      const message = "Configura el negocio antes de registrar clientes.";
      set({ error: message });
      toastService.error("No pudimos registrar el cliente", message);
      return false;
    }

    set({ isSaving: true, error: null });

    const operationId = loadingService.start("Guardando el cliente…");
    try {
      const database = await getDatabaseClient();
      const deviceId = await getDeviceId(database);
      const repository = new SqliteCustomerRepository(database);
      const customer = await createCustomer(
        values,
        business.id,
        deviceId,
        repository,
      );
      await markPendingSync();
      const customers = [...get().customers, customer].sort((left, right) =>
        left.name.localeCompare(right.name),
      );
      set({ customers, isSaving: false });
      toastService.success("Cliente registrado correctamente");
      return true;
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      set({ isSaving: false, error: message });
      toastService.error("No pudimos guardar el cliente", message);
      return false;
    } finally {
      loadingService.stop(operationId);
    }
  },

  editCustomer: async (
    customerId: string,
    values: CustomerFormValues,
  ): Promise<boolean> => {
    const current = get().customers.find((item) => item.id === customerId);
    if (current === undefined) return false;
    set({ isSaving: true, error: null });
    const operationId = loadingService.start("Actualizando el cliente…");
    try {
      const repository = new SqliteCustomerRepository(
        await getDatabaseClient(),
      );
      const customer = await updateCustomer(current, values, repository);
      await markPendingSync();
      set({
        customers: get()
          .customers.map((item) => (item.id === customer.id ? customer : item))
          .sort((left, right) => left.name.localeCompare(right.name)),
        isSaving: false,
      });
      toastService.success("Cliente actualizado correctamente");
      return true;
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      set({ isSaving: false, error: message });
      toastService.error("No pudimos actualizar el cliente", message);
      return false;
    } finally {
      loadingService.stop(operationId);
    }
  },

  addEmployee: async (values: EmployeeFormValues): Promise<boolean> => {
    const business = get().business;
    if (business === null) {
      const message = "Configura el negocio antes de registrar al equipo.";
      set({ error: message });
      toastService.error("No pudimos registrar al profesional", message);
      return false;
    }

    set({ isSaving: true, error: null });

    const operationId = loadingService.start("Guardando al profesional…");
    try {
      const database = await getDatabaseClient();
      const deviceId = await getDeviceId(database);
      const repository = new SqliteEmployeeRepository(database);
      const input = employeeFormSchema.parse(values);
      if (!navigator.onLine) {
        throw new Error(
          "Conéctate a Internet para enviar la invitación al nuevo miembro.",
        );
      }
      const synchronized = await useSyncStore.getState().syncNow(business);
      if (!synchronized) {
        throw new Error(
          useSyncStore.getState().error ??
            "No pudimos preparar el negocio en la nube.",
        );
      }
      const employeeId = crypto.randomUUID();
      const createdAt = new Date().toISOString();
      const invitation = await new SupabaseTeamInvitationRepository().invite({
        businessId: business.id,
        employeeId,
        name: input.name,
        phone: input.phone === "" ? null : input.phone,
        email: input.email,
        color: "copper",
        deviceId,
        createdAt,
      });
      const employee = await createEmployee(
        input,
        business.id,
        deviceId,
        repository,
        {
          id: employeeId,
          role: EMPLOYEE_ACCOUNT_ROLE.EMPLOYEE,
          userId: invitation.userId,
        },
      );
      await markPendingSync();
      const employees = [...get().employees, employee].sort((left, right) =>
        left.name.localeCompare(right.name),
      );
      set({ employees, isSaving: false });
      toastService.success(
        "Invitación enviada",
        `${employee.email} podrá configurar su contraseña desde el correo.`,
      );
      return true;
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      set({ isSaving: false, error: message });
      toastService.error("No pudimos guardar al profesional", message);
      return false;
    } finally {
      loadingService.stop(operationId);
    }
  },

  editEmployee: async (
    employeeId: string,
    values: EmployeeFormValues,
  ): Promise<boolean> => {
    const current = get().employees.find((item) => item.id === employeeId);
    if (current === undefined) return false;
    set({ isSaving: true, error: null });
    const operationId = loadingService.start("Actualizando al profesional…");
    try {
      const repository = new SqliteEmployeeRepository(
        await getDatabaseClient(),
      );
      const employee = await updateEmployee(current, values, repository);
      await markPendingSync();
      set({
        employees: get()
          .employees.map((item) => (item.id === employee.id ? employee : item))
          .sort((left, right) => left.name.localeCompare(right.name)),
        isSaving: false,
      });
      toastService.success("Profesional actualizado correctamente");
      return true;
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      set({ isSaving: false, error: message });
      toastService.error("No pudimos actualizar al profesional", message);
      return false;
    } finally {
      loadingService.stop(operationId);
    }
  },

  addService: async (values: ServiceFormValues): Promise<boolean> => {
    const business = get().business;
    if (business === null) {
      const message = "Configura el negocio antes de registrar servicios.";
      set({ error: message });
      toastService.error("No pudimos registrar el servicio", message);
      return false;
    }

    set({ isSaving: true, error: null });

    const operationId = loadingService.start("Guardando el servicio…");
    try {
      const database = await getDatabaseClient();
      const deviceId = await getDeviceId(database);
      const repository = new SqliteServiceRepository(database);
      const service = await createService(
        values,
        business.id,
        deviceId,
        repository,
      );
      await markPendingSync();
      const services = [...get().services, service].sort((left, right) =>
        left.name.localeCompare(right.name),
      );
      set({ services, isSaving: false });
      toastService.success("Servicio registrado correctamente");
      return true;
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      set({ isSaving: false, error: message });
      toastService.error("No pudimos guardar el servicio", message);
      return false;
    } finally {
      loadingService.stop(operationId);
    }
  },

  editService: async (
    serviceId: string,
    values: ServiceFormValues,
  ): Promise<boolean> => {
    const current = get().services.find((item) => item.id === serviceId);
    if (current === undefined) return false;
    set({ isSaving: true, error: null });
    const operationId = loadingService.start("Actualizando el servicio…");
    try {
      const repository = new SqliteServiceRepository(await getDatabaseClient());
      const service = await updateService(current, values, repository);
      await markPendingSync();
      set({
        services: get()
          .services.map((item) => (item.id === service.id ? service : item))
          .sort((left, right) => left.name.localeCompare(right.name)),
        isSaving: false,
      });
      toastService.success("Servicio actualizado correctamente");
      return true;
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      set({ isSaving: false, error: message });
      toastService.error("No pudimos actualizar el servicio", message);
      return false;
    } finally {
      loadingService.stop(operationId);
    }
  },

  appointmentBalance: (appointmentId: string): number => {
    const appointment = get().appointments.find(
      (item) => item.id === appointmentId,
    );
    if (appointment === undefined) {
      return 0;
    }
    const appointmentPayments = get().payments.filter(
      (payment) => payment.appointmentId === appointmentId,
    );
    return pendingBalance(appointment.price, appointmentPayments);
  },

  addPayment: async (values: PaymentFormValues): Promise<boolean> => {
    const business = get().business;
    if (business === null) {
      const message = "Configura el negocio antes de registrar un pago.";
      set({ error: message });
      toastService.error("No pudimos registrar el pago", message);
      return false;
    }

    set({ isSaving: true, error: null });
    const operationId = loadingService.start("Registrando el pago…");
    try {
      const database = await getDatabaseClient();
      const deviceId = await getDeviceId(database);
      const repository = new SqlitePaymentRepository(database);
      const remainingBalance =
        values.appointmentId === ""
          ? null
          : get().appointmentBalance(values.appointmentId);
      const payment = await createPayment(
        values,
        business.id,
        deviceId,
        repository,
        remainingBalance,
      );
      set({
        payments: [payment, ...get().payments].sort(byPaidAtDesc),
        isSaving: false,
      });
      toastService.success("Pago registrado correctamente");
      return true;
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      set({ isSaving: false, error: message });
      toastService.error("No pudimos registrar el pago", message);
      return false;
    } finally {
      loadingService.stop(operationId);
    }
  },

  voidPayment: async (paymentId: string): Promise<boolean> => {
    const current = get().payments.find((item) => item.id === paymentId);
    if (current === undefined) {
      const message = "El pago seleccionado ya no está disponible.";
      set({ error: message });
      toastService.error("No pudimos anular el pago", message);
      return false;
    }

    set({ isSaving: true, error: null });
    const operationId = loadingService.start("Anulando el pago…");
    try {
      const database = await getDatabaseClient();
      const repository = new SqlitePaymentRepository(database);
      await voidPaymentRecord(current, repository);
      set({
        payments: get().payments.filter((item) => item.id !== paymentId),
        isSaving: false,
      });
      toastService.success("Pago anulado correctamente");
      return true;
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      set({ isSaving: false, error: message });
      toastService.error("No pudimos anular el pago", message);
      return false;
    } finally {
      loadingService.stop(operationId);
    }
  },

  addExpense: async (values: ExpenseFormValues): Promise<boolean> => {
    const business = get().business;
    if (business === null) {
      const message = "Configura el negocio antes de registrar un gasto.";
      set({ error: message });
      toastService.error("No pudimos registrar el gasto", message);
      return false;
    }

    set({ isSaving: true, error: null });
    const operationId = loadingService.start("Guardando el gasto…");
    try {
      const database = await getDatabaseClient();
      const deviceId = await getDeviceId(database);
      const repository = new SqliteExpenseRepository(database);
      const expense = await createExpense(
        values,
        business.id,
        deviceId,
        repository,
      );
      set({
        expenses: [expense, ...get().expenses].sort(bySpentAtDesc),
        isSaving: false,
      });
      toastService.success("Gasto registrado correctamente");
      return true;
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      set({ isSaving: false, error: message });
      toastService.error("No pudimos guardar el gasto", message);
      return false;
    } finally {
      loadingService.stop(operationId);
    }
  },

  editExpense: async (
    expenseId: string,
    values: ExpenseFormValues,
  ): Promise<boolean> => {
    const current = get().expenses.find((item) => item.id === expenseId);
    if (current === undefined) {
      const message = "El gasto seleccionado ya no está disponible.";
      set({ error: message });
      toastService.error("No pudimos actualizar el gasto", message);
      return false;
    }

    set({ isSaving: true, error: null });
    const operationId = loadingService.start("Actualizando el gasto…");
    try {
      const database = await getDatabaseClient();
      const repository = new SqliteExpenseRepository(database);
      const expense = await updateExpense(current, values, repository);
      set({
        expenses: get()
          .expenses.map((item) => (item.id === expense.id ? expense : item))
          .sort(bySpentAtDesc),
        isSaving: false,
      });
      toastService.success("Gasto actualizado correctamente");
      return true;
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      set({ isSaving: false, error: message });
      toastService.error("No pudimos actualizar el gasto", message);
      return false;
    } finally {
      loadingService.stop(operationId);
    }
  },

  deleteExpense: async (expenseId: string): Promise<boolean> => {
    const current = get().expenses.find((item) => item.id === expenseId);
    if (current === undefined) {
      const message = "El gasto seleccionado ya no está disponible.";
      set({ error: message });
      toastService.error("No pudimos eliminar el gasto", message);
      return false;
    }

    set({ isSaving: true, error: null });
    const operationId = loadingService.start("Eliminando el gasto…");
    try {
      const database = await getDatabaseClient();
      const repository = new SqliteExpenseRepository(database);
      await deleteExpenseRecord(current, repository);
      set({
        expenses: get().expenses.filter((item) => item.id !== expenseId),
        isSaving: false,
      });
      toastService.success("Gasto eliminado correctamente");
      return true;
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      set({ isSaving: false, error: message });
      toastService.error("No pudimos eliminar el gasto", message);
      return false;
    } finally {
      loadingService.stop(operationId);
    }
  },

  clearError: (): void => set({ error: null }),
}));
