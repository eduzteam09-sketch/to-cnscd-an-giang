import React from 'react';
import { ReportsView } from '../reports/ReportsView';

interface ToolsAndReportsViewProps {
  onSelectTask?: (task: any) => void;
  defaultSubTab?: string;
}

export const ToolsAndReportsView: React.FC<ToolsAndReportsViewProps> = () => {
  return <ReportsView />;
};
