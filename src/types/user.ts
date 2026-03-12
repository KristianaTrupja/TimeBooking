export type User = {
    id: number;
    username: string;
    email: string | null;  // Optional for Developers, required for Admins
    role: string;
    password: string;
    locationId: number;
    locationName?: string | null;
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
    locationId: number;
    totalVacations: number
  };

  export type LocationOption = {
    id: number;
    name: string;
  };
  
