export type UserRole = "ADMIN" | "OPERADOR" | "CLIENTE";

export interface UserContext {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon?: React.ReactNode;
}
