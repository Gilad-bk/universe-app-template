// Shared data types mirroring the backend API response schema.

export type OrgRole = 'OWNER' | 'EDITOR' | 'VIEWER';

export interface Page {
  id: string;
  appId: string;
  pageName: string;
  pageTitle: string;
  slug: string;
  order: number;
  components: any[];
}

export interface Organization {
  name: string;
  orgIdentifier: string;
  role?: OrgRole | null;
}

export interface User {
  id: string;
  systemRole?: string;
}

export interface App {
  id: string;
  organizationId: string;
  organization: Organization;
  pages: Page[];
  user?: User;
  currentUserRole?: OrgRole | null;
}
