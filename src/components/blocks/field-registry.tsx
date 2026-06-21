import React from 'react';
import { ColumnDef } from './TableBlockClient';
import { Checkbox } from "@/components/ui/checkbox";
import { DrivePickerCell } from "@/components/blocks/DrivePickerCell";

export interface CellProps {
  value: any;
  column: ColumnDef;
  context?: any;
}

export interface InputProps {
  value: any;
  column: ColumnDef;
  onChange: (value: any) => void;
  rowId: string;
  context?: any;
}
// the current currency system support only 4 types of currency
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  ILS: '₪',
  GBP: '£'
};

function getCurrencySymbol(code?: string) {
  if (!code) return '';
  return CURRENCY_SYMBOLS[code.toUpperCase()] || code;
}
// display the selected value in the relation field and if there no value in the field display the id 
function getRelationDisplayLabel(opt: any, column: ColumnDef) {
  if (!opt) return "רשומה חסרה";
  
  const val = column.displayField && opt.data ? opt.data[column.displayField] : undefined;
  if (val !== undefined && val !== null && val !== '') {
    return String(val);
  }
  
  if (opt.data) {
    const fallbackField = Object.keys(opt.data).find(k => {
      if (k === '_id' || k === 'id') return false;
      const v = opt.data[k];
      if (typeof v === 'string' && v.trim() !== '') return true;
      if (typeof v === 'number') return true;
      return false;
    });
    if (fallbackField) return String(opt.data[fallbackField]);
  }
  return "ערך ריק";
}

//cell renderers are the renderers for the cells in the table 
export const CELL_RENDERERS: Record<string, React.FC<CellProps>> = {
  CURRENCY: ({ value, column }) => {
    const symbol = getCurrencySymbol(column.currencySymbol);
    const num = Number(value);
    return (
      <span className="px-2 py-1 flex items-center h-full">
        {symbol && <span className="text-slate-400 mr-1">{symbol}</span>}
        {isNaN(num) ? '' : num}
      </span>
    );
  },
  TIME: ({ value }) => {
    return <span className="px-2 py-1 flex items-center h-full">{value}</span>;
  },
  LINK: ({ value }) => {
    if (!value || typeof value !== 'object') return null;
    return (
      <div className="px-2 py-1 flex items-center h-full">
        <a href={value.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
          {value.label || value.url}
        </a>
      </div>
    );
  },
  BOOLEAN: ({ value }) => (
    <div className="flex items-center justify-center w-full h-full p-2">
      <Checkbox checked={!!value} disabled />
    </div>
  ),
  GOOGLE_DRIVE_FILE: ({ value }) => (
    <span className="px-2 py-1 flex items-center h-full text-sm truncate">
      {value?.name || ''}
    </span>
  ),
  RELATION: ({ value, column, context }) => {
    const options = context?.relationOptions?.[column.name] || [];
    const opt = options.find((o: any) => o.id === value);
    const displayVal = opt ? getRelationDisplayLabel(opt, column) : (value ? "רשומה לא זמינה" : "");
    return <span className="px-2 py-1 flex items-center h-full">{displayVal}</span>;
  },
  NUMBER: ({ value }) => (
    <span className="px-2 py-1 flex items-center h-full">{value}</span>
  ),
  DEFAULT: ({ value }) => (
    <span className="px-2 py-1 flex items-center h-full">{value}</span>
  )
};

// form inputs are the inputs for the fields in the table form
export const FORM_INPUTS: Record<string, React.FC<InputProps>> = {
  CURRENCY: ({ value, column, onChange }) => {
    const symbol = getCurrencySymbol(column.currencySymbol);
    return (
      <div className="relative w-full h-full">
        {symbol && (
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-sm">
            {symbol}
          </span>
        )}
        <input
          type="number"
          step="any"
          className={`w-full h-8 ${symbol ? 'pl-6 pr-2' : 'px-2'} bg-transparent focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 text-sm`}
          value={value !== undefined && value !== null ? value : ''}
          onChange={(e) => {
            const val = e.target.value;
            onChange(val === '' ? '' : Number(val));
          }}
        />
      </div>
    );
  },
  TIME: ({ value, onChange }) => (
    <input
      type="time"
      className="w-full h-8 px-2 bg-transparent focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 text-sm"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
  LINK: ({ value, onChange }) => {
    const [isEditing, setIsEditing] = React.useState(false);
    const label = value?.label || '';
    const url = value?.url || '';

    if (!isEditing) {
      return (
        <div className="flex items-center gap-2 px-2 py-1 h-full w-full">
          {url ? (
            <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex-1 truncate">
              {label || url}
            </a>
          ) : (
            <span className="text-slate-400 italic flex-1 text-sm">ריק</span>
          )}
          <button 
            onClick={() => setIsEditing(true)}
            className="text-xs font-medium text-slate-400 hover:text-blue-500 p-1 rounded transition-colors"
            title="ערוך קישור"
          >
            עריכה
          </button>
        </div>
      );
    }

    return (
      <div className="flex gap-2 p-1 w-full min-w-[250px] items-center bg-white border border-blue-200 rounded shadow-sm z-10">
        <input
          type="text"
          placeholder="Label"
          className="flex-1 h-8 px-2 bg-transparent focus:outline-none text-sm border-r"
          value={label}
          onChange={(e) => onChange({ label: e.target.value, url })}
        />
        <input
          type="url"
          placeholder="URL"
          className="flex-1 h-8 px-2 bg-transparent focus:outline-none text-sm"
          value={url}
          onChange={(e) => onChange({ label, url: e.target.value })}
        />
        <button 
          onClick={() => setIsEditing(false)}
          className="text-xs font-medium text-green-600 hover:text-green-700 p-1 mx-1 rounded transition-colors"
          title="שמור"
        >
          שמור
        </button>
      </div>
    );
  },
  BOOLEAN: ({ value, onChange }) => (
    <div className="flex items-center justify-center w-full h-full p-2">
      <Checkbox 
        checked={!!value}
        onCheckedChange={(c) => onChange(!!c)}
      />
    </div>
  ),
  GOOGLE_DRIVE_FILE: ({ value, onChange, context }) => (
    <DrivePickerCell
      value={value || null}
      onChange={onChange}
      orgId={context?.orgIdentifier}
      tableName={context?.tableName}
      onMarkForDeletion={context?.onMarkForDeletion}
    />
  ),
  RELATION: ({ value, onChange, column, context }) => {
    const options = context?.relationOptions?.[column.name] || [];
    
    React.useEffect(() => {
      if (typeof value === 'string' && value !== '' && options.length > 0) {
        const isValidId = options.some((o: any) => String(o.id) === String(value));
        if (!isValidId) {
          const match = options.find((o: any) => 
            String(getRelationDisplayLabel(o, column)).trim() === String(value).trim()
          );
          if (match) {
            onChange(match.id); // Valid match found, inject ID
          } else {
            onChange(''); // Fallback: Invalid default string, clear it
          }
        }
      }
    }, [value, options, column, onChange]);

    const processedOptions = options.map((opt: any) => ({
      ...opt,
      _displayLabel: getRelationDisplayLabel(opt, column)
    }));
    const validOptions = processedOptions.filter((o: any) => o._displayLabel !== "הערך שברשומה המקושרת נשאר ריק");

    return (
      <select
        className="w-full h-8 px-2 bg-transparent focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 text-sm"
        value={value !== undefined && value !== null ? String(value) : ""}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => {
          if (context?.refetchRelation) {
            context.refetchRelation(column.name);
          }
        }}
      >
        <option value="">בחר...</option>
        {validOptions.length > 0 ? (
          validOptions.map((opt: any) => (
            <option key={opt.id} value={opt.id}>
              {opt._displayLabel}
            </option>
          ))
        ) : options.length > 0 ? (
          <option value="empty_all" disabled>כל הערכים בטבלה המקושרת ריקים</option>
        ) : null}
      </select>
    );
  },
  NUMBER: ({ value, onChange }) => (
    <input
      type="number"
      className="w-full h-8 px-2 bg-transparent focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 text-sm"
      value={value !== undefined && value !== null ? value : ''}
      onChange={(e) => {
        const val = e.target.value;
        onChange(val === '' ? '' : Number(val));
      }}
    />
  ),
  DEFAULT: ({ value, onChange }) => (
    <input
      type="text"
      className="w-full h-8 px-2 bg-transparent focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 text-sm"
      value={value !== undefined && value !== null ? String(value) : ''}
      onChange={(e) => onChange(e.target.value)}
    />
  )
};
