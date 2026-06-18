"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { DrivePickerCell } from "@/components/blocks/DrivePickerCell";

export interface ColumnDef {
  name: string;
  type?: string;
  defaultValue?: any;
  isRequired?: boolean;
  isUnique?: boolean;
  referencedTableId?: string;
  displayField?: string;
}

export interface SchemaDef {
  columns?: ColumnDef[];
  [key: string]: any;
}

export interface RecordData {
  id: string;
  data: Record<string, any>;
}

interface TableBlockClientProps {
  tableMetaId: string;
  orgId: string;
  orgIdentifier: string;
  schema: SchemaDef;
  initialRecords: RecordData[];
  apiUrl: string;
}

export function TableBlockClient({ tableMetaId, orgId, orgIdentifier, schema, initialRecords, apiUrl }: TableBlockClientProps) {
  const router = useRouter();

  const [data, setData] = useState<RecordData[]>(initialRecords);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const [dirty, setDirty] = useState<{
    added: RecordData[];
    modified: Record<string, Record<string, any>>;
    deleted: string[];
  }>({ added: [], modified: {}, deleted: [] });

  const [pendingDeletions, setPendingDeletions] = useState<string[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [relationOptions, setRelationOptions] = useState<Record<string, any[]>>({});

  const schemaColsString = useMemo(() => JSON.stringify(schema?.columns || []), [schema?.columns]);

  useEffect(() => {
    let parsedCols: ColumnDef[] = [];
    try { parsedCols = JSON.parse(schemaColsString); } catch(e) {}
    
    const relationCols = parsedCols.filter((c: ColumnDef) => c.type?.toUpperCase() === 'RELATION') || [];
    
    relationCols.forEach((col: ColumnDef) => {
      const refTableId = col.referencedTableId;
      if (!refTableId) return;
      
      const baseApiUrl = apiUrl || process.env.NEXT_PUBLIC_UNIVERSE_API_URL || "";
      
      const fetchRelation = async () => {
        try {
          const res = await fetch(`${baseApiUrl}/api/tables/${refTableId}?limit=1000`, {
            headers: { 'x-org-id': orgId, 'ngrok-skip-browser-warning': '69420' }
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const json = await res.json();
          if (json.records?.data) {
            setRelationOptions(prev => ({ ...prev, [col.name]: json.records.data }));
          }
        } catch (err: unknown) {
          toast.error(`שגיאה בטעינת אפשרויות לעמודה ${col.name}`);
        }
      };
      
      fetchRelation();
    });
  }, [schemaColsString, apiUrl, orgId]);


  const filteredColumns = useMemo(() => {
    const systemFields = ['_id', 'createdAt', 'updatedAt', 'orgId', 'tableId'];
    return schema.columns?.filter((col: ColumnDef) => !systemFields.includes(col.name)) || [];
  }, [schema.columns]);

  const generateTempId = () => `temp_${Math.random().toString(36).substr(2, 9)}`;

  const handleAddRow = () => {
    const defaultData: Record<string, any> = {};
    schema.columns?.forEach((col: ColumnDef) => {
      if (col.type?.toUpperCase() === 'NUMBER') {
        defaultData[col.name] = col.defaultValue !== undefined && col.defaultValue !== null && col.defaultValue !== "" ? Number(col.defaultValue) : 0;
      } else if (col.type?.toUpperCase() === 'BOOLEAN') {
        defaultData[col.name] = col.defaultValue === 'true' || col.defaultValue === true ? true : false;
      } else {
        defaultData[col.name] = col.defaultValue !== undefined && col.defaultValue !== null ? col.defaultValue : "";
      }
    });
    const newRow = { id: generateTempId(), data: defaultData };
    setData((prev) => [newRow, ...prev]);
    setDirty((prev) => ({ ...prev, added: [newRow, ...prev.added] }));
  };

  const handleCellChange = (rowId: string, colName: string, value: string | boolean | Record<string, any> | null) => {
    setData((prev) => prev.map(row => 
      row.id === rowId ? { ...row, data: { ...row.data, [colName]: value } } : row
    ));

    const isAdded = dirty.added.some(r => r.id === rowId);
    if (isAdded) {
      setDirty(prev => ({
        ...prev,
        added: prev.added.map(r => 
          r.id === rowId ? { ...r, data: { ...r.data, [colName]: value } } : r
        )
      }));
    } else {
      setDirty(prev => ({
        ...prev,
        modified: {
          ...prev.modified,
          [rowId]: {
            ...(prev.modified[rowId] || data.find(r => r.id === rowId)?.data || {}),
            [colName]: value
          }
        }
      }));
    }
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredData.map(r => r.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const toggleSelectRow = (rowId: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) newSelected.add(rowId);
    else newSelected.delete(rowId);
    setSelectedIds(newSelected);
  };

  const handleDeleteSelected = () => {
    const idsToDelete = Array.from(selectedIds);
    if(idsToDelete.length === 0) return;
    
    if(!confirm("האם למחוק את הרשומות שנבחרו?")) return;

    const filesToDelete: string[] = [];
    const driveCols = schema.columns?.filter((c: ColumnDef) => c.type?.toUpperCase() === 'GOOGLE_DRIVE_FILE') || [];
    
    // delete the drive files from the server and drive folder
    if (driveCols.length > 0) {
      idsToDelete.forEach(id => {
        const row = data.find(r => r.id === id);
        if (row) {
          driveCols.forEach(col => {
            const fileObj = row.data[col.name];
            if (fileObj && fileObj.fileId) {
              filesToDelete.push(fileObj.fileId);
            }
          });
        }
      });
    }

    if (filesToDelete.length > 0) {
      setPendingDeletions(prev => [...prev, ...filesToDelete]);
    }

    setData(prev => prev.filter(row => !idsToDelete.includes(row.id)));

    setDirty(prev => {
      const newAdded = prev.added.filter(r => !idsToDelete.includes(r.id));
      const newModified = { ...prev.modified };
      const newDeleted = [...prev.deleted];

      idsToDelete.forEach(id => {
        if (!prev.added.some(r => r.id === id)) {
          newDeleted.push(id);
        }
        delete newModified[id];
      });

      return { added: newAdded, modified: newModified, deleted: newDeleted };
    });

    setSelectedIds(new Set());
  };

  const formatPayload = (payload: any) => {
    const formatted: Record<string, any> = {};
    schema.columns?.forEach((col: any) => {
      // Remove any system keys or UI-only properties
      if (['_id', 'id', 'createdAt', 'updatedAt', 'orgId', 'tableId', 'isSelected'].includes(col.name)) return;
      
      let val = payload[col.name];
      if (val !== undefined) {
        if (val === null) {
          formatted[col.name] = null;
        } else {
          if (col.type?.toUpperCase() === 'NUMBER') {
            val = val === "" ? 0 : Number(val);
            if (isNaN(val)) val = 0;
          }
          formatted[col.name] = val;
        }
      }
    });
    return formatted;
  };

  const hasChanges = dirty.added.length > 0 || Object.keys(dirty.modified).length > 0 || dirty.deleted.length > 0;

  const handleSave = async () => {
    if (!hasChanges) {
      toast("אין שינויים לשמור");
      return;
    }

    // Validation for isRequired
    const systemFields = ['_id', 'id', 'createdAt', 'updatedAt', 'orgId', 'tableId', 'isSelected'];
    const requiredCols = schema.columns?.filter((c: ColumnDef) => c.isRequired && !systemFields.includes(c.name)) || [];
    const isEmpty = (val: any) => val === undefined || val === null || val === "";
    
    for (const col of requiredCols) {
      for (const row of dirty.added) {
        if (isEmpty(row.data[col.name])) {
          toast.error(`שגיאת ולידציה: השדה ${col.name} הוא חובה.`);
          return;
        }
      }
      for (const [rowId, mods] of Object.entries(dirty.modified)) {
        const rowData = data.find(r => r.id === rowId)?.data || {};
        const mergedData = { ...rowData, ...mods };
        if (isEmpty(mergedData[col.name])) {
          toast.error(`שגיאת ולידציה: השדה ${col.name} הוא חובה.`);
          return;
        }
      }
    }

    const baseApiUrl = apiUrl || process.env.NEXT_PUBLIC_UNIVERSE_API_URL || "";

    setIsSaving(true);
    try {
      const performFetch = async (url: string, options: any) => {
        options.headers = { ...options.headers, 'ngrok-skip-browser-warning': '69420' };
        const res = await fetch(url, options);
        if (!res.ok) {
          let errMsg = `Error ${res.status}`;
          try {
            const errJson = await res.json();
            errMsg = errJson.error || errJson.message || errMsg;
          } catch (e) {}
          throw new Error(errMsg);
        }
        return res;
      };

      const addedPromises = dirty.added.map(row => {
        const finalPayload = formatPayload(row.data);
        return performFetch(`${baseApiUrl}/api/tables/${tableMetaId}/records`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-org-id': orgId },
          body: JSON.stringify(finalPayload)
        });
      });

      const modifiedPromises = Object.entries(dirty.modified).map(([recordId, changedData]) => {
        const finalPayload = formatPayload(changedData);
        return performFetch(`${baseApiUrl}/api/tables/${tableMetaId}/records/${recordId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'x-org-id': orgId },
          body: JSON.stringify(finalPayload)
        });
      });

      const deletedPromises = dirty.deleted.map(recordId => 
        performFetch(`${baseApiUrl}/api/tables/${tableMetaId}/records/${recordId}`, {
          method: 'DELETE',
          headers: { 'x-org-id': orgId }
        })
      );

      const results = await Promise.allSettled([
        ...addedPromises,
        ...modifiedPromises,
        ...deletedPromises
      ]);

      const failed = results.filter(res => res.status === 'rejected') as PromiseRejectedResult[];
      
      if (failed.length > 0) {
        const errorMessages = Array.from(new Set(failed.map(f => f.reason.message)));
        throw new Error(errorMessages.join(" | "));
      }

      toast.success("השינויים נשמרו בהצלחה");

      // Process delayed deletions
      if (pendingDeletions.length > 0) {
        for (const fileId of pendingDeletions) {
          try {
            await fetch(`${baseApiUrl}/api/drive/delete-file?fileId=${fileId}`, { method: 'DELETE' });
          } catch (e) {
            console.error("Failed to delete file from drive:", fileId);
          }
        }
        setPendingDeletions([]);
      }
      
      // We must fetch the latest data to get real IDs for added records
      const freshRes = await fetch(`${baseApiUrl}/api/tables/${tableMetaId}?limit=100`, {
        headers: { 'x-org-id': orgId, 'ngrok-skip-browser-warning': '69420' },
        cache: 'no-store'
      });
      if(freshRes.ok) {
        const freshJson = await freshRes.json();
        if(freshJson.records?.data) {
          setData(freshJson.records.data);
        }
      }

      setDirty({ added: [], modified: {}, deleted: [] });
      router.refresh();

    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      toast.error("שגיאה בשמירת השינויים", {
        description: errorMsg,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const filteredData = useMemo(() => {
    if (!searchQuery) return data;
    const lowerQuery = searchQuery.toLowerCase();
    return data.filter(row => 
      Object.values(row.data).some(val => 
        String(val).toLowerCase().includes(lowerQuery)
      )
    );
  }, [data, searchQuery]);

  return (
    <div className="flex flex-col w-full bg-white border border-slate-200 rounded-md shadow-sm" dir="rtl">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 bg-[#e0e5eb] border-b border-slate-300">
        <div className="flex items-center gap-2">
          {/* Add Button */}
          <button 
            onClick={handleAddRow}
            className="flex items-center justify-center w-8 h-8 rounded text-green-600 hover:bg-white/50 transition-colors"
            title="הוסף שורה"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
          </button>

          {/* Delete Button */}
          <button 
            onClick={handleDeleteSelected}
            disabled={selectedIds.size === 0}
            className="flex items-center justify-center w-8 h-8 rounded text-rose-500 hover:bg-white/50 transition-colors disabled:opacity-30"
            title="מחק שורות נבחרות"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          
          <div className="h-5 w-px bg-slate-300 mx-1" />

          {/* Search */}
          <div className="relative">
             <input 
              placeholder="חיפוש..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 px-3 pr-8 text-sm border border-slate-300 rounded shadow-inner focus:outline-none focus:border-brand w-48"
            />
            <svg className="w-4 h-4 text-slate-400 absolute right-2.5 top-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {hasChanges && (
            <span className="text-sm font-bold text-amber-500 animate-in fade-in zoom-in duration-200">
              יש שינויים שלא נשמרו
            </span>
          )}
          <Button 
            onClick={handleSave} 
            disabled={isSaving || !hasChanges}
            size="sm"
            variant={hasChanges ? "default" : "secondary"}
            className={`h-8 px-4 text-xs font-semibold rounded shadow transition-all ${
              hasChanges 
                ? 'bg-brand hover:brightness-110 text-white' 
                : 'opacity-50 grayscale'
            }`}
          >
            {isSaving ? "שומר..." : "שמור (שינויים)"}
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-right border-collapse">
          <thead className="bg-[#e9ecf0] text-[#556885] sticky top-0 z-10">
            <tr>
              <th className="border-b border-l border-slate-300 p-2 w-10 text-center">
                <Checkbox 
                  checked={filteredData.length > 0 && selectedIds.size === filteredData.length}
                  onCheckedChange={toggleSelectAll}
                />
              </th>
              {filteredColumns.map((col: ColumnDef, idx: number) => (
                <th key={idx} className="border-b border-l border-slate-300 p-2 font-semibold whitespace-nowrap min-w-[120px]">
                  {col.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white">
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={filteredColumns.length + 1} className="text-center py-10 text-slate-400">
                  אין רשומות להצגה.
                </td>
              </tr>
            ) : (
              filteredData.map((row: any) => (
                <tr key={row.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="border-b border-l border-slate-200 p-1.5 text-center bg-white group-hover:bg-transparent">
                    <Checkbox 
                      checked={selectedIds.has(row.id)}
                      onCheckedChange={(checked) => toggleSelectRow(row.id, !!checked)}
                    />
                  </td>
                  {filteredColumns.map((col: ColumnDef, cIdx: number) => (
                    <td key={cIdx} className="border-b border-l border-slate-200 p-0 relative">
                      {col.type?.toUpperCase() === 'BOOLEAN' ? (
                        <div className="flex items-center justify-center w-full h-full p-2">
                          <Checkbox 
                            checked={!!row.data[col.name]}
                            onCheckedChange={(c) => handleCellChange(row.id, col.name, !!c)}
                          />
                        </div>
                      ) : col.type?.toUpperCase() === 'GOOGLE_DRIVE_FILE' ? (
                        <DrivePickerCell
                          value={row.data[col.name] || null}
                          onChange={(fileVal) => handleCellChange(row.id, col.name, fileVal as any)}
                          orgId={orgIdentifier}
                          tableName={schema.name || "Unknown_Table"}
                          onMarkForDeletion={(fileId) => setPendingDeletions(prev => [...prev, fileId])}
                        />
                      ) : col.type?.toUpperCase() === 'RELATION' ? (
                        <select
                          className="w-full h-8 px-2 bg-transparent focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 text-sm"
                          value={row.data[col.name] !== undefined && row.data[col.name] !== null ? String(row.data[col.name]) : ""}
                          onChange={(e) => handleCellChange(row.id, col.name, e.target.value)}
                        >
                          <option value="">בחר...</option>
                          {relationOptions[col.name]?.map((opt: any) => (
                            <option key={opt.id} value={opt.id}>
                              {col.displayField && opt.data[col.displayField] ? opt.data[col.displayField] : opt.id}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={col.type?.toUpperCase() === 'NUMBER' ? 'number' : 'text'}
                          className="w-full h-8 px-2 bg-transparent focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 text-sm"
                          value={row.data[col.name] !== undefined ? String(row.data[col.name]) : (col.defaultValue !== undefined && col.defaultValue !== null ? String(col.defaultValue) : "")}
                          onChange={(e) => handleCellChange(row.id, col.name, e.target.value)}
                        />
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
