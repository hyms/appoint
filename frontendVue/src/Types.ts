export interface MenuItem {
  label: string;
  url: string;
  activate?: string[];
  icon?: string;
  subItems?: MenuItem[];
  onClick?: () => void;
}
