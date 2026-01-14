'use client';

/**
 * DataTable - Shared presentational component
 * 
 * Flexible table for displaying records with:
 * - Sortable columns
 * - Row selection
 * - Row click action
 * - Custom cell renderers
 */

import { useState, ReactNode } from 'react';
import { motion } from 'framer-motion';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  width?: string;
  sortable?: boolean;
  render?: (row: T, index: number) => ReactNode;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyField: keyof T;
  
  // Selection
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  
  // Row actions
  onRowClick?: (row: T) => void;
  
  // Sorting
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  
  // Loading & empty states
  loading?: boolean;
  emptyMessage?: string;
  emptyIcon?: string;
  
  testId?: string;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  keyField,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  onRowClick,
  sortBy,
  sortOrder,
  onSort,
  loading = false,
  emptyMessage = 'No data found',
  emptyIcon = '📭',
  testId,
}: DataTableProps<T>) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  
  const toggleSelectAll = () => {
    if (!onSelectionChange) return;
    if (selectedIds.length === data.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(data.map(row => String(row[keyField])));
    }
  };
  
  const toggleSelect = (id: string) => {
    if (!onSelectionChange) return;
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(sid => sid !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };
  
  const getCellValue = (row: T, col: Column<T>, index: number): ReactNode => {
    if (col.render) {
      return col.render(row, index);
    }
    const value = row[col.key as keyof T];
    return value !== undefined && value !== null ? String(value) : '—';
  };
  
  return (
    <div className="rounded-xl border border-white/10 overflow-hidden" data-testid={testId}>
      <table className="w-full">
        <thead className="bg-white/5">
          <tr>
            {selectable && (
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedIds.length === data.length && data.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-white/30"
                />
              </th>
            )}
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={`px-4 py-3 text-left text-sm font-medium text-white/60 ${
                  col.sortable ? 'cursor-pointer hover:text-white' : ''
                }`}
                style={{ width: col.width }}
                onClick={() => col.sortable && onSort?.(String(col.key))}
              >
                <div className="flex items-center gap-1">
                  {col.header}
                  {col.sortable && sortBy === col.key && (
                    <span className="text-[#39FF14]">
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {loading ? (
            <tr>
              <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-4 py-12 text-center">
                <div className="w-8 h-8 border-2 border-[#39FF14]/30 border-t-[#39FF14] rounded-full animate-spin mx-auto" />
                <div className="text-white/40 mt-3">Loading...</div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-4 py-12 text-center">
                <div className="text-4xl mb-3">{emptyIcon}</div>
                <div className="text-white/40">{emptyMessage}</div>
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => {
              const rowId = String(row[keyField]);
              const isSelected = selectedIds.includes(rowId);
              const isHovered = hoveredRow === rowId;
              
              return (
                <motion.tr
                  key={rowId}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: rowIndex * 0.02 }}
                  className={`
                    transition group
                    ${onRowClick ? 'cursor-pointer' : ''}
                    ${isSelected ? 'bg-[#39FF14]/10' : isHovered ? 'bg-white/5' : ''}
                  `}
                  onClick={() => onRowClick?.(row)}
                  onMouseEnter={() => setHoveredRow(rowId)}
                  onMouseLeave={() => setHoveredRow(null)}
                  data-testid={`row-${rowId}`}
                >
                  {selectable && (
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(rowId)}
                        className="rounded border-white/30"
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={String(col.key)} className="px-4 py-3 text-white/80">
                      {getCellValue(row, col, rowIndex)}
                    </td>
                  ))}
                </motion.tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
