// Shared data types mirroring the backend API response schema.

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
}

export interface App {
  id: string;
  organizationId: string;
  organization: Organization;
  pages: Page[];
}
