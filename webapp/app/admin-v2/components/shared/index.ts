/**
 * Shared UI Components
 * 
 * Presentational components used across CRM, Analytics, and other admin pages.
 * These components are data-source agnostic - they receive data via props.
 */

export { KPICard } from './KPICard';
export type { KPICardProps } from './KPICard';

export { FunnelChart } from './FunnelChart';
export type { FunnelChartProps, FunnelStage } from './FunnelChart';

export { TimeSeriesChart } from './TimeSeriesChart';
export type { TimeSeriesChartProps, DataPoint } from './TimeSeriesChart';

export { DataTable } from './DataTable';
export type { DataTableProps, Column } from './DataTable';
