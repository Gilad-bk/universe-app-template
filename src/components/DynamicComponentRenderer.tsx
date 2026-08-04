"use client";

import React, { useState, useCallback } from "react";
import {
  UNIVERSE_COMPONENTS,
  UniverseComponentType,
  BaseComponentProps,
  ComponentPermissions,
} from "@universe-platform/ui";
import { executeAction as defaultExecuteAction } from "@/services/universeApi";

const DEFAULT_PERMISSIONS: ComponentPermissions = {
  canCreate: true,
  canRead: true,
  canUpdate: true,
  canDelete: true,
};

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

/**
 * DynamicComponentRenderer
 * Generic component renderer that dynamically resolves UI components using 
 * the component registry exported by @universe-platform/ui without hardcoded component checks.
 * Thin consumer shell for the universe-platform UI library.
 */
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

  // Top-level action execution handler
  const handleExecuteAction = useCallback(
    (componentId: string, actionType: string, payload: Record<string, any>) => {
      if (customExecuteAction) {
        return customExecuteAction(actionType, payload);
      }
      return defaultExecuteAction(actionType, payload, {
        orgId,
        componentId,
      });
    },
    [customExecuteAction, orgId]
  );

  if (!components || components.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      {components.map((component) => {
        // Look up component strictly via UNIVERSE_COMPONENTS[component.type] without hardcoded type checks
        const componentType = component.type as UniverseComponentType;
        const Component = UNIVERSE_COMPONENTS[componentType];

        // Fallback UI block if the component type is not supported in the installed library version
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

        const componentPermissions = component.permissions || defaultPermissions;
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
          <Component
            key={component.id}
            {...componentProps}
          />
        );
      })}
    </div>
  );
}
