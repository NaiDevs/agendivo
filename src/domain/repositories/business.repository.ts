import type { Business } from "@/domain/entities/business";
import type {
  EmissionPoint,
  FiscalAuthorization,
  FiscalConfiguration,
  FiscalProfile,
} from "@/domain/entities/fiscal-configuration";

export interface BusinessOnboardingRecords {
  business: Business;
  fiscalProfile: FiscalProfile;
  emissionPoint: EmissionPoint | null;
  fiscalAuthorization: FiscalAuthorization | null;
}

export interface BusinessRepository {
  findActive(): Promise<Business | null>;
  create(business: Business): Promise<void>;
  createOnboarding(records: BusinessOnboardingRecords): Promise<void>;
  update(business: Business): Promise<void>;
  findFiscalConfiguration(
    businessId: string,
  ): Promise<FiscalConfiguration | null>;
  saveFiscalConfiguration(configuration: FiscalConfiguration): Promise<void>;
}
