"use client";

import React, { useEffect, useState } from "react";

export function TableBlockError({ message }: { message: string }) {
  const [isBuilder, setIsBuilder] = useState(false);

  useEffect(() => {
    // Determine if we're running inside the Model Builder's iframe
    setIsBuilder(window !== window.parent);
  }, []);

  // In the live app view, gracefully degrade and show nothing so we don't alarm the user
  if (!isBuilder) {
    return null;
  }

  // In the builder view, show a friendly placeholder warning
  return (
    <div className="p-4 my-4 border border-rose-200 bg-rose-50 text-rose-800 rounded-md text-sm shadow-sm" dir="rtl">
      <strong>שגיאה:</strong> המודל אליו רכיב זה מקושר כבר אינו קיים במערכת (הוא נמחק). נא למחוק את הרכיב כדי למנוע תקלות.
      <br />
      <span className="text-xs text-rose-600/70 mt-1 block">
        פרטים: {message}
      </span>
    </div>
  );
}
