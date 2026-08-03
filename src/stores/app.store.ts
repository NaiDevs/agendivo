import { create } from "zustand";

import type { Business } from "@/domain/entities/business";
import type { Appointment } from "@/domain/entities/appointment";
import type { Customer } from "@/domain/entities/customer";
import type { Employee } from "@/domain/entities/employee";
import type { Expense } from "@/domain/entities/expense";
import type { Payment } from "@/domain/entities/payment";
import type { Service } from "@/domain/entities/service";
import { createBusiness } from "@/domain/services/business.service";
import {
  cancelAppointment as cancelAppointmentRecord,
  createAppointment,
  updateAppointment,
} from "@/domain/services/appointment.service";
import { createCustomer } from "@/domain/services/customer.service";
import { createEmployee } from "@/domain/services/employee.service";
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
import { createService } from "@/domain/services/service.service";
import { getDatabaseClient } from "@/infrastructure/database/connection";
import { getDeviceId } from "@/infrastructure/database/device-metadata";
import { SqliteBusinessRepository } from "@/infrastructure/repositories/sqlite-business.repository";
import { SqliteAppointmentRepository } from "@/infrastructure/repositories/sqlite-appointment.repository";
import { SqliteCustomerRepository } from "@/infrastructure/repositories/sqlite-customer.repository";
import { SqliteEmployeeRepository } from "@/infrastructure/repositories/sqlite-employee.repository";
import { SqliteExpenseRepository } from "@/infrastructure/repositories/sqlite-expense.repository";
import { SqlitePaymentRepository } from "@/infrastructure/repositories/sqlite-payment.repository";
import { SqliteServiceRepository } from "@/infrastructure/repositories/sqlite-service.repository";
import { getErrorMessage } from "@/lib/error-message";
import type { BusinessFormValues } from "@/schemas/business.schema";
import type { AppointmentFormValues } from "@/schemas/appointment.schema";
import type { CustomerFormValues } from "@/schemas/customer.schema";
import type { EmployeeFormValues } from "@/schemas/employee.schema";
import type { ExpenseFormValues } from "@/schemas/expense.schema";
import type { PaymentFormValues } from "@/schemas/payment.schema";
import type { ServiceFormValues } from "@/schemas/service.schema";

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
  appointments: Appointment[];
  customers: Customer[];
  employees: Employee[];
  services: Service[];
  payments: Payment[];
  expenses: Expense[];
  isSaving: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  saveBusiness: (values: BusinessFormValues) => Promise<boolean>;
  addAppointment: (values: AppointmentFormValues) => Promise<boolean>;
  editAppointment: (
    appointmentId: string,
    values: AppointmentFormValues,
  ) => Promise<boolean>;
  cancelAppointment: (appointmentId: string) => Promise<boolean>;
  addCustomer: (values: CustomerFormValues) => Promise<boolean>;
  addEmployee: (values: EmployeeFormValues) => Promise<boolean>;
  addService: (values: ServiceFormValues) => Promise<boolean>;
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
  appointments: [],
  customers: [],
  employees: [],
  services: [],
  payments: [],
  expenses: [],
  isSaving: false,
  error: null,

  initialize: async (): Promise<void> => {
    if (get().phase === APP_PHASE.LOADING) {
      return;
    }

    set({ phase: APP_PHASE.LOADING, error: null });

    try {
      const database = await getDatabaseClient();
      await getDeviceId(database);
      const businessRepository = new SqliteBusinessRepository(database);
      const business = await businessRepository.findActive();

      if (business === null) {
        set({
          phase: APP_PHASE.SETUP,
          business: null,
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
      const [appointments, customers, employees, services, payments, expenses] =
        await Promise.all([
          appointmentRepository.findActiveByBusiness(business.id),
          customerRepository.findActiveByBusiness(business.id),
          employeeRepository.findActiveByBusiness(business.id),
          serviceRepository.findActiveByBusiness(business.id),
          paymentRepository.findActiveByBusiness(business.id),
          expenseRepository.findActiveByBusiness(business.id),
        ]);
      set({
        phase: APP_PHASE.READY,
        business,
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

  saveBusiness: async (values: BusinessFormValues): Promise<boolean> => {
    set({ isSaving: true, error: null });

    try {
      const database = await getDatabaseClient();
      const deviceId = await getDeviceId(database);
      const repository = new SqliteBusinessRepository(database);
      const business = await createBusiness(values, deviceId, repository);
      set({
        phase: APP_PHASE.READY,
        business,
        appointments: [],
        customers: [],
        employees: [],
        services: [],
        payments: [],
        expenses: [],
        isSaving: false,
      });
      return true;
    } catch (error: unknown) {
      set({ isSaving: false, error: getErrorMessage(error) });
      return false;
    }
  },

  addAppointment: async (values: AppointmentFormValues): Promise<boolean> => {
    const business = get().business;
    if (business === null) {
      set({ error: "Configura el negocio antes de registrar una cita." });
      return false;
    }

    set({ isSaving: true, error: null });
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
      set({
        appointments: [...get().appointments, appointment].sort((left, right) =>
          left.startsAt.localeCompare(right.startsAt),
        ),
        isSaving: false,
      });
      return true;
    } catch (error: unknown) {
      set({ isSaving: false, error: getErrorMessage(error) });
      return false;
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
      set({ error: "La cita seleccionada ya no está disponible." });
      return false;
    }

    set({ isSaving: true, error: null });
    try {
      const database = await getDatabaseClient();
      const repository = new SqliteAppointmentRepository(database);
      const appointment = await updateAppointment(current, values, repository);
      set({
        appointments: get()
          .appointments.map((item) =>
            item.id === appointment.id ? appointment : item,
          )
          .sort((left, right) => left.startsAt.localeCompare(right.startsAt)),
        isSaving: false,
      });
      return true;
    } catch (error: unknown) {
      set({ isSaving: false, error: getErrorMessage(error) });
      return false;
    }
  },

  cancelAppointment: async (appointmentId: string): Promise<boolean> => {
    const current = get().appointments.find(
      (item) => item.id === appointmentId,
    );
    if (current === undefined) {
      set({ error: "La cita seleccionada ya no está disponible." });
      return false;
    }

    set({ isSaving: true, error: null });
    try {
      const database = await getDatabaseClient();
      const repository = new SqliteAppointmentRepository(database);
      const appointment = await cancelAppointmentRecord(current, repository);
      set({
        appointments: get().appointments.map((item) =>
          item.id === appointment.id ? appointment : item,
        ),
        isSaving: false,
      });
      return true;
    } catch (error: unknown) {
      set({ isSaving: false, error: getErrorMessage(error) });
      return false;
    }
  },

  addCustomer: async (values: CustomerFormValues): Promise<boolean> => {
    const business = get().business;
    if (business === null) {
      set({ error: "Configura el negocio antes de registrar clientes." });
      return false;
    }

    set({ isSaving: true, error: null });

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
      const customers = [...get().customers, customer].sort((left, right) =>
        left.name.localeCompare(right.name),
      );
      set({ customers, isSaving: false });
      return true;
    } catch (error: unknown) {
      set({ isSaving: false, error: getErrorMessage(error) });
      return false;
    }
  },

  addEmployee: async (values: EmployeeFormValues): Promise<boolean> => {
    const business = get().business;
    if (business === null) {
      set({ error: "Configura el negocio antes de registrar al equipo." });
      return false;
    }

    set({ isSaving: true, error: null });

    try {
      const database = await getDatabaseClient();
      const deviceId = await getDeviceId(database);
      const repository = new SqliteEmployeeRepository(database);
      const employee = await createEmployee(
        values,
        business.id,
        deviceId,
        repository,
      );
      const employees = [...get().employees, employee].sort((left, right) =>
        left.name.localeCompare(right.name),
      );
      set({ employees, isSaving: false });
      return true;
    } catch (error: unknown) {
      set({ isSaving: false, error: getErrorMessage(error) });
      return false;
    }
  },

  addService: async (values: ServiceFormValues): Promise<boolean> => {
    const business = get().business;
    if (business === null) {
      set({ error: "Configura el negocio antes de registrar servicios." });
      return false;
    }

    set({ isSaving: true, error: null });

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
      const services = [...get().services, service].sort((left, right) =>
        left.name.localeCompare(right.name),
      );
      set({ services, isSaving: false });
      return true;
    } catch (error: unknown) {
      set({ isSaving: false, error: getErrorMessage(error) });
      return false;
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
      set({ error: "Configura el negocio antes de registrar un pago." });
      return false;
    }

    set({ isSaving: true, error: null });
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
      return true;
    } catch (error: unknown) {
      set({ isSaving: false, error: getErrorMessage(error) });
      return false;
    }
  },

  voidPayment: async (paymentId: string): Promise<boolean> => {
    const current = get().payments.find((item) => item.id === paymentId);
    if (current === undefined) {
      set({ error: "El pago seleccionado ya no está disponible." });
      return false;
    }

    set({ isSaving: true, error: null });
    try {
      const database = await getDatabaseClient();
      const repository = new SqlitePaymentRepository(database);
      await voidPaymentRecord(current, repository);
      set({
        payments: get().payments.filter((item) => item.id !== paymentId),
        isSaving: false,
      });
      return true;
    } catch (error: unknown) {
      set({ isSaving: false, error: getErrorMessage(error) });
      return false;
    }
  },

  addExpense: async (values: ExpenseFormValues): Promise<boolean> => {
    const business = get().business;
    if (business === null) {
      set({ error: "Configura el negocio antes de registrar un gasto." });
      return false;
    }

    set({ isSaving: true, error: null });
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
      return true;
    } catch (error: unknown) {
      set({ isSaving: false, error: getErrorMessage(error) });
      return false;
    }
  },

  editExpense: async (
    expenseId: string,
    values: ExpenseFormValues,
  ): Promise<boolean> => {
    const current = get().expenses.find((item) => item.id === expenseId);
    if (current === undefined) {
      set({ error: "El gasto seleccionado ya no está disponible." });
      return false;
    }

    set({ isSaving: true, error: null });
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
      return true;
    } catch (error: unknown) {
      set({ isSaving: false, error: getErrorMessage(error) });
      return false;
    }
  },

  deleteExpense: async (expenseId: string): Promise<boolean> => {
    const current = get().expenses.find((item) => item.id === expenseId);
    if (current === undefined) {
      set({ error: "El gasto seleccionado ya no está disponible." });
      return false;
    }

    set({ isSaving: true, error: null });
    try {
      const database = await getDatabaseClient();
      const repository = new SqliteExpenseRepository(database);
      await deleteExpenseRecord(current, repository);
      set({
        expenses: get().expenses.filter((item) => item.id !== expenseId),
        isSaving: false,
      });
      return true;
    } catch (error: unknown) {
      set({ isSaving: false, error: getErrorMessage(error) });
      return false;
    }
  },

  clearError: (): void => set({ error: null }),
}));
