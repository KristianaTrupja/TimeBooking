export type User = {
    id: number;
    username: string;
    email: string | null;  // Optional for Developers, required for Admins
    role: string;
    password: string;
    createdAt?: string;
    updatedAt?: string;
    isActive: boolean;
    deletedAt: Date | null;
    totalVacations: number
  };
  
  export type UserFormData = {
    id: number;
    username: string;
    email: string;
    password: string;
    role: string;
    totalVacations: number
  };
  