"use client";

import React, { createContext, useContext, ReactNode } from "react";

export type OrgRole = "OWNER" | "EDITOR" | "VIEWER" | string;
export type SystemRole = "PLATFORM_ADMIN" | "ORGANIZATION_ADMIN" | "END_USER" | string;

export interface PermissionsContextType {
  orgRole: OrgRole;
  systemRole: SystemRole;
  isViewer: boolean;
  isEditor: boolean;
  isOwner: boolean;
  isPlatformAdmin: boolean;
  canMutate: boolean;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export interface PermissionsProviderProps {
  role?: OrgRole;
  systemRole?: SystemRole;
  children: ReactNode;
}

export function PermissionsProvider({ role = "VIEWER", systemRole = "END_USER", children }: PermissionsProviderProps) {
  const normalizedOrgRole = (role || "VIEWER").toUpperCase();
  const normalizedSystemRole = (systemRole || "END_USER").toUpperCase();
  
  const isPlatformAdmin = normalizedSystemRole === "PLATFORM_ADMIN";
  const isOwner = normalizedOrgRole === "OWNER";
  const isEditor = normalizedOrgRole === "EDITOR";
  const isViewer = normalizedOrgRole === "VIEWER";
  
  const canMutate = isPlatformAdmin || isOwner || isEditor;
  
  const value: PermissionsContextType = {
    orgRole: normalizedOrgRole,
    systemRole: normalizedSystemRole,
    isViewer,
    isEditor,
    isOwner,
    isPlatformAdmin,
    canMutate,
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error("usePermissions must be used within a PermissionsProvider");
  }
  return context;
}

export interface RequireRoleProps {
  allowedRoles: OrgRole[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function RequireRole({ allowedRoles, children, fallback = null }: RequireRoleProps) {
  const { orgRole, isPlatformAdmin } = usePermissions();
  const normalizedRoles = allowedRoles.map((r) => r.toUpperCase());
  
  if (isPlatformAdmin || normalizedRoles.includes(orgRole)) {
    return <>{children}</>;
  }
  return <>{fallback}</>;
}
