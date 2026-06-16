import React from 'react';
import { TableBlockClient } from './TableBlockClient';

interface TableBlockProps {
  tableMetaId: string;
  orgId: string;
}

export async function TableBlock({ tableMetaId, orgId }: TableBlockProps) {
  try {
    // Fetch table schema and records
    const res = await fetch(`${process.env.UNIVERSE_API_URL}/api/tables/${tableMetaId}`, {
      headers: { 'x-org-id': orgId },
      next: { revalidate: 0 }, // no cache for live data
    });

    if (!res.ok) throw new Error("Failed to fetch table data");
    const { schema, records } = await res.json();

    if (!schema?.columns || !records?.data) {
      return <div className="p-4 border rounded">No data available.</div>;
    }

    // Pass the table schema, records, and API URL to the client component
    return (
      <TableBlockClient 
        tableMetaId={tableMetaId} 
        orgId={orgId} 
        schema={schema} 
        initialRecords={records.data} 
        apiUrl={process.env.UNIVERSE_API_URL || ""}
      />
    );
  } catch (err: unknown) {
    return (
      <div className="p-4 my-4 border border-red-200 bg-red-50 text-red-800 rounded">
        Failed to load table: {err instanceof Error ? err.message : "Unknown error"}
      </div>
    );
  }
}
