export type User = {
    id: number;
    username: string;
    email: string;
    role: string;
    password: string;
    createdAt?: string;
    updatedAt?: string;
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
  