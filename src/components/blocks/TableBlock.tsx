import React from 'react';
import { TableBlockClient } from './TableBlockClient';
import { TableBlockError } from './TableBlockError';

interface TableBlockProps {
  tableMetaId: string;
  orgId: string;
  orgIdentifier: string;
}

export async function TableBlock({ tableMetaId, orgId, orgIdentifier }: TableBlockProps) {
  try {
    // Fetch table schema and records
    const res = await fetch(`${process.env.UNIVERSE_API_URL}/api/tables/${tableMetaId}`, {
      headers: { 'x-org-id': orgId },
      next: { revalidate: 0 }, // no cache for live data
    });

    if (!res.ok) {
      return <TableBlockError message={res.status === 404 ? "Table not found (404)" : `Failed to fetch table data (${res.status})`} />;
    }
    const { schema, records } = await res.json();

    if (!schema?.columns || !records?.data) {
      return <div className="p-4 border rounded">No data available.</div>;
    }

    // Pass the table schema, records, and API URL to the client component
    return (
      <TableBlockClient 
        tableMetaId={tableMetaId} 
        orgId={orgId} 
        orgIdentifier={orgIdentifier}
        schema={schema} 
        initialRecords={records.data} 
        apiUrl={process.env.UNIVERSE_API_URL || ""}
      />
    );
  } catch (err: unknown) {
    return <TableBlockError message={err instanceof Error ? err.message : "Unknown error"} />;
  }
}
