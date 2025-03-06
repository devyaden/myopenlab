export interface User {
  id: string;
  email: string;
  role: string;
  name?: string;
  avatar_url?: string;
  company_name?: string;
  company_email?: string;
  company_sector?: string;
  company_size?: string;
  user_position?: string;
  username?: string;
  application?: string;
  lastActive?: Date;
  isActive?: boolean;
}
