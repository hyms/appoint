export interface MenuItem {
  label: string;
  url: string;
  activate?: string[];
  icon?: string;
  subItems?: MenuItem[];
  onClick?: () => void;
}
export interface UserInfo {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
}
export enum Role{
  admin = 'Admin',
  doctor = 'Doctor',
  patient = 'Patient',
  staff = 'Staff',
}
export enum Permissions{
  admin = 'Admin',
}
