import React, { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import type { User } from "@shared/schema";
import { queryClient, apiRequest } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type UserWithProfessional = User & {
  professional?: any;
  isAdmin?: boolean;
  isBanned?: boolean;
  suspendedUntil?: Date | null;
  suspensionReason?: string | null;
};

type AuthContextType = {
  user: UserWithProfessional | null;
  isLoading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  loginMutation: UseMutationResult<UserWithProfessional, Error, LoginData>;
  logoutMutation: UseMutationResult<any, Error, void>;
  registerMutation: UseMutationResult<UserWithProfessional, Error, RegisterData>;
  logout: () => void;
};

type LoginData = {
  email: string;
  password: string;
};

type RegisterData = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  userType: "client" | "professional";
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<UserWithProfessional>({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al iniciar sesión");
      }
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.setQueryData(["/api/auth/user"], data);
      toast({
        title: "Sesión iniciada",
        description: "Has iniciado sesión exitosamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al iniciar sesión",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterData) => {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al registrar usuario");
      }
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.setQueryData(["/api/auth/user"], data);
      toast({
        title: "Registro exitoso",
        description: "Tu cuenta ha sido creada e iniciaste sesión automáticamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error en el registro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al cerrar sesión");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
      queryClient.clear();
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión exitosamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al cerrar sesión",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logout = () => {
    logoutMutation.mutate();
  };

  return React.createElement(AuthContext.Provider, {
    value: {
      user: user ?? null,
      isLoading,
      error,
      isAuthenticated: !!user && !error,
      loginMutation,
      logoutMutation,
      registerMutation,
      logout,
    }
  }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
