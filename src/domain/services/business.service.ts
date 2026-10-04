import type { Business } from "@/domain/entities/business";
import {
  FISCAL_DOCUMENT_TYPE,
  type EmissionPoint,
  type FiscalAuthorization,
  type FiscalConfiguration,
  type FiscalProfile,
} from "@/domain/entities/fiscal-configuration";
import type { BusinessRepository } from "@/domain/repositories/business.repository";
import {
  businessFormSchema,
  type BusinessFormValues,
} from "@/schemas/business.schema";
import {
  businessOnboardingSchema,
  type BusinessOnboardingValues,
  fiscalCorrelativeFormSchema,
  type FiscalCorrelativeFormValues,
} from "@/schemas/fiscal.schema";

function optionalText(value: string): string | null {
  return value === "" ? null : value;
}

export async function createBusinessOnboarding(
  values: BusinessOnboardingValues,
  deviceId: string,
  repository: BusinessRepository,
): Promise<Business> {
  const input = businessOnboardingSchema.parse(values);
  const now = new Date().toISOString();
  const businessId = crypto.randomUUID();
  const business: Business = {
    id: businessId,
    name: input.name,
    phone: optionalText(input.phone),
    email: optionalText(input.email),
    address: optionalText(input.address),
    timezone: input.timezone,
    currency: input.currency,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    version: 1,
    deviceId,
  };
  const fiscalProfile: FiscalProfile = {
    id: crypto.randomUUID(),
    businessId,
    countryCode: input.countryCode.toUpperCase(),
    legalName: input.legalName,
    taxId: optionalText(input.taxId),
    invoicesEnabled: input.invoicesEnabled,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    version: 1,
    deviceId,
  };

  let emissionPoint: EmissionPoint | null = null;
  let fiscalAuthorization: FiscalAuthorization | null = null;
  if (input.invoicesEnabled) {
    emissionPoint = {
      id: crypto.randomUUID(),
      businessId,
      name: input.emissionPointName,
      establishmentCode: input.establishmentCode,
      emissionPointCode: input.emissionPointCode,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: 1,
      deviceId,
    };
    fiscalAuthorization = {
      id: crypto.randomUUID(),
      businessId,
      emissionPointId: emissionPoint.id,
      cai: input.cai.toUpperCase(),
      documentType: FISCAL_DOCUMENT_TYPE.INVOICE,
      rangeStart: input.rangeStart,
      rangeEnd: input.rangeEnd,
      nextNumber: input.nextNumber,
      validUntil: input.validUntil,
      active: true,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: 1,
      deviceId,
    };
  }

  await repository.createOnboarding({
    business,
    fiscalProfile,
    emissionPoint,
    fiscalAuthorization,
  });

  return business;
}

export async function updateBusinessProfile(
  current: Business,
  values: BusinessFormValues,
  repository: BusinessRepository,
): Promise<Business> {
  const input = businessFormSchema.parse(values);
  const business: Business = {
    ...current,
    name: input.name,
    phone: optionalText(input.phone),
    email: optionalText(input.email),
    address: optionalText(input.address),
    timezone: input.timezone,
    currency: input.currency,
    updatedAt: new Date().toISOString(),
    version: current.version + 1,
  };
  await repository.update(business);
  return business;
}

export async function updateFiscalCorrelative(
  current: FiscalConfiguration | null,
  businessId: string,
  deviceId: string,
  values: FiscalCorrelativeFormValues,
  repository: BusinessRepository,
): Promise<FiscalConfiguration> {
  const input = fiscalCorrelativeFormSchema.parse(values);
  const now = new Date().toISOString();
  const pointId = current?.emissionPoint?.id ?? crypto.randomUUID();
  const configuration: FiscalConfiguration = {
    profile: {
      id: current?.profile.id ?? crypto.randomUUID(),
      businessId,
      countryCode: current?.profile.countryCode ?? "HN",
      legalName: input.legalName,
      taxId: optionalText(input.taxId),
      invoicesEnabled: true,
      createdAt: current?.profile.createdAt ?? now,
      updatedAt: now,
      deletedAt: null,
      version: (current?.profile.version ?? 0) + 1,
      deviceId,
    },
    emissionPoint: {
      id: pointId,
      businessId,
      name: input.emissionPointName,
      establishmentCode: input.establishmentCode,
      emissionPointCode: input.emissionPointCode,
      createdAt: current?.emissionPoint?.createdAt ?? now,
      updatedAt: now,
      deletedAt: null,
      version: (current?.emissionPoint?.version ?? 0) + 1,
      deviceId,
    },
    authorization: {
      id: current?.authorization?.id ?? crypto.randomUUID(),
      businessId,
      emissionPointId: pointId,
      cai: input.cai.toUpperCase(),
      documentType: FISCAL_DOCUMENT_TYPE.INVOICE,
      rangeStart: input.rangeStart,
      rangeEnd: input.rangeEnd,
      nextNumber: input.nextNumber,
      validUntil: input.validUntil,
      active: true,
      createdAt: current?.authorization?.createdAt ?? now,
      updatedAt: now,
      deletedAt: null,
      version: (current?.authorization?.version ?? 0) + 1,
      deviceId,
    },
  };
  await repository.saveFiscalConfiguration(configuration);
  return configuration;
}

export async function updateFiscalDocumentMode(
  current: FiscalConfiguration | null,
  invoicesEnabled: boolean,
  deviceId: string,
  repository: BusinessRepository,
): Promise<FiscalConfiguration> {
  if (current === null) {
    throw new Error("No encontramos el perfil fiscal del negocio.");
  }
  const configuration: FiscalConfiguration = {
    ...current,
    profile: {
      ...current.profile,
      invoicesEnabled,
      updatedAt: new Date().toISOString(),
      version: current.profile.version + 1,
      deviceId,
    },
  };
  await repository.saveFiscalConfiguration(configuration);
  return configuration;
}

export async function createBusiness(
  values: BusinessFormValues,
  deviceId: string,
  repository: BusinessRepository,
): Promise<Business> {
  const input = businessFormSchema.parse(values);
  const now = new Date().toISOString();
  const business: Business = {
    id: crypto.randomUUID(),
    name: input.name,
    phone: optionalText(input.phone),
    email: optionalText(input.email),
    address: optionalText(input.address),
    timezone: input.timezone,
    currency: input.currency,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    version: 1,
    deviceId,
  };

  await repository.create(business);

  return business;
}
