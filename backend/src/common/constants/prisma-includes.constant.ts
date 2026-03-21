export const INCLUDE_PATIENT_PROFILE = {
  patient: { include: { profile: true } },
};
export const INCLUDE_PROFESSIONAL_PROFILE = {
  professional: { include: { profile: true } },
};
export const INCLUDE_LOCATION = { location: true };

export const INCLUDE_PARTICIPANTS_WITH_PROFILES = {
  ...INCLUDE_PATIENT_PROFILE,
  ...INCLUDE_PROFESSIONAL_PROFILE,
  ...INCLUDE_LOCATION,
};
