"use client";

import React, { useEffect, useState } from "react";
import { FileText, Upload, X } from "lucide-react";

// the id for the google drive files
export interface DriveFileValue {
  fileId: string;
  fileUrl: string;
  fileName: string;
}

interface DrivePickerCellProps {
  value: DriveFileValue | null | undefined;
  onChange: (value: DriveFileValue | null) => void;
  orgId: string;
  tableName: string;
  onMarkForDeletion?: (fileId: string) => void;
}

export function DrivePickerCell({ value, onChange, orgId, tableName, onMarkForDeletion }: DrivePickerCellProps) {
  const [isOpening, setIsOpening] = useState(false);

  // a pop up for uploading the drive files
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'DRIVE_UPLOAD_SUCCESS') {
        onChange(event.data.payload);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [onChange]);

  const openUploadPopup = async () => {
    if (isOpening) return;
    setIsOpening(true);
    
    try {
      // get the folder id from the server and open the picker popup
      const serverUrl = process.env.NEXT_PUBLIC_UNIVERSE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${serverUrl}/api/drive/get-folder?orgId=${orgId}&tableName=${tableName}`);
      if (!response.ok) throw new Error("Failed to get folder");
      
      const { folderId } = await response.json();
      window.open(`${serverUrl}/embed/picker?folderId=${folderId}`, 'UniverseUpload', 'width=800,height=600,left=200,top=100');
    } catch (error) {
      console.error("Error opening picker popup:", error);
    } finally {
      setIsOpening(false);
    }
  };

  if (value?.fileUrl) {
    return (
      <div className="flex items-center w-full h-8 px-2 gap-1">
        <a
          href={value.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 max-w-[calc(100%-24px)] px-2 py-1 rounded-md text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors truncate"
          title={value.fileName || "Open file"}
        >
          <FileText className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{value.fileName || "Unnamed file"}</span>
        </a>
        <button
          type="button"
          onClick={() => {
            if (value?.fileId && onMarkForDeletion) {
              onMarkForDeletion(value.fileId);
            }
            onChange(null);
          }}
          className="shrink-0 p-0.5 rounded hover:bg-rose-100 text-slate-400 hover:text-rose-500 transition-colors"
          title="Remove file"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center w-full h-8 px-2">
      <button
        type="button"
        onClick={openUploadPopup}
        disabled={isOpening}
        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 hover:text-slate-700 transition-colors disabled:opacity-50"
      >
        <Upload className="w-3.5 h-3.5" />
        <span>{isOpening ? "Loading..." : "Upload File"}</span>
      </button>
    </div>
  );
}
