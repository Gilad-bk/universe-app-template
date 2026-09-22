"use client";

import React, { useState, useCallback, useEffect, Component as ReactComponent, ReactNode } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  UNIVERSE_COMPONENTS,
  UniverseComponentType,
  BaseComponentProps,
  ComponentPermissions,
} from "@universe-platform/ui";
import { executeAction as defaultExecuteAction } from "@/services/universeApi";
import { usePermissions } from "@/components/PermissionsProvider";

const DEFAULT_PERMISSIONS: ComponentPermissions = {
  canCreate: true,
  canRead: true,
  canUpdate: true,
  canDelete: true,
};

// Error boundary preventing an individual crashing component from taking down the entire page
class ComponentErrorBoundary extends ReactComponent<
  { componentId: string; children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { componentId: string; children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    // Log component-level rendering failure for diagnostics
    console.error(`[DynamicComponentRenderer] Component ${this.props.componentId} render error:`, error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 border border-red-200 bg-red-50 text-red-600 rounded-md text-sm font-medium">
          Table data could not be loaded.
        </div>
      );
    }
    return this.props.children;
  }
}

export interface ComponentConfigData {
  id: string;
  type: string;
  config?: Record<string, any>;
  data?: any;
  permissions?: ComponentPermissions;
  error?: string | Error | null;
}

export interface DynamicComponentRendererProps {
  components?: ComponentConfigData[];
  orgId: string;
  defaultPermissions?: ComponentPermissions;
  initialPageState?: Record<string, any>;
  onEmitEvent?: (eventName: string, payload: any) => void;
  customExecuteAction?: (
    actionType: string,
    payload: Record<string, any>
  ) => Promise<any>;
  className?: string;
}

// Generic component renderer that dynamically resolves UI components using the UI library registry
export function DynamicComponentRenderer({
  components = [],
  orgId,
  defaultPermissions = DEFAULT_PERMISSIONS,
  initialPageState = {},
  onEmitEvent,
  customExecuteAction,
  className = "flex flex-col gap-6",
}: DynamicComponentRendererProps) {
  const [pageState, setPageState] = useState<Record<string, any>>(initialPageState);
  const [componentErrors, setComponentErrors] = useState<Record<string, string>>({});
  const { getToken, isSignedIn } = useAuth();
  const { canMutate } = usePermissions();

  // Unified event emission handler for updating page state across components
  const handleEmitEvent = useCallback(
    (eventName: string, payload: any) => {
      setPageState((prev) => ({
        ...prev,
        [eventName]: payload,
      }));
      onEmitEvent?.(eventName, payload);
    },
    [onEmitEvent]
  );

  // Top-level action execution handler forwarding authenticated session token
  const handleExecuteAction = useCallback(
    async (componentId: string, actionType: string, payload: Record<string, any>) => {
      if (customExecuteAction) {
        return customExecuteAction(actionType, payload);
      }
      // Prevent unauthenticated calls during logout
      if (!isSignedIn) {
        return;
      }
      try {
        // Ensure getToken is properly awaited
        const token = (await getToken()) || undefined;
        return await defaultExecuteAction(
          actionType,
          payload,
          {
            orgId,
            componentId,
          },
          token
        );
      } catch (err: any) {
        // Gracefully handle missing or deleted table errors without crashing the page
        if (
          actionType === "FETCH_RECORDS" &&
          (err?.message?.includes("not found") ||
           err?.message?.toLowerCase().includes("table") ||
           err?.message?.includes("Malformed ObjectID"))
        ) {
          console.warn(`[DynamicComponentRenderer] Table not found for component ${componentId}:`, err.message);
          setComponentErrors((prev) => ({
            ...prev,
            [componentId]: "Table data could not be loaded.",
          }));
          return { data: [], meta: { totalRecords: 0 } };
        }

        throw err;
      }
    },
    [customExecuteAction, orgId, getToken, isSignedIn]
  );

  // Unmount completely if user is signed out
  if (!isSignedIn) {
    return null;
  }

  if (!components || components.length === 0) {
    return null;
  }

  return (
    
    <div className={className}>
      {components.map((component) => {
        // Render graceful fallback UI if this specific block encountered a missing table error
        if (componentErrors[component.id]) {
          return (
            <div
              key={component.id}
              className="p-4 border border-red-200 bg-red-50 text-red-600 rounded-md text-sm font-medium"
            >
              Table data could not be loaded.
            </div>
          );
        }

        // Look up component strictly via UNIVERSE_COMPONENTS[component.type]
        const componentType = component.type as UniverseComponentType;
        const Component = UNIVERSE_COMPONENTS[componentType];

        // Fallback UI block if component type is not supported in the installed library version
        if (!Component) {
          return (
            <div
              key={component.id || Math.random().toString()}
              className="p-4 border border-dashed border-red-300 bg-red-50 text-red-700 rounded-md dir-rtl"
              data-testid={`unsupported-component-${component.type}`}
            >
              <strong>Render Error:</strong> Component type "{component.type}" is not supported in the installed UI library version.
            </div>
          );
        }

        const basePermissions = component.permissions || defaultPermissions;
        
        // Explicitly set mutation permissions for UI components based on precise boolean RBAC evaluation
        const componentPermissions = {
          ...basePermissions,
          canCreate: canMutate ? Boolean(basePermissions.canCreate ?? true) : false,
          canUpdate: canMutate ? Boolean(basePermissions.canUpdate ?? true) : false,
          canDelete: canMutate ? Boolean(basePermissions.canDelete ?? true) : false,
        };

        const componentSettings = component.config || {};
        const componentError = component.error || componentSettings.error || component.data?.error || null;

        const componentProps: BaseComponentProps = {
          componentId: component.id,
          orgId,
          settings: componentSettings,
          data: component.data,
          permissions: componentPermissions,
          error: componentError,
          pageState,
          emitEvent: handleEmitEvent,
          executeAction: (actionType, payload) =>
            handleExecuteAction(component.id, actionType, payload),
        };

        return (
          <ComponentErrorBoundary key={component.id} componentId={component.id}>
            <Component {...componentProps} />
          </ComponentErrorBoundary>
        );
      })}
    </div>
  );
}
