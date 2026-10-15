import {
  LayoutDashboard,
  Map as MapIcon,
  Gauge,
  Cloud,
  Brain,
  TrendingUp,
  Bell,
  Upload,
  FileText,
  Settings,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/** Single source of truth for primary navigation (sidebar, command palette). */
export const navGroups: NavGroup[] = [
  {
    label: 'Monitor',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'Network overview and key metrics' },
      { to: '/map', label: 'Methane Map', icon: MapIcon, description: 'Interactive hotspot map' },
      { to: '/aqi', label: 'Air Quality', icon: Gauge, description: 'AQI by city with pollutant breakdown' },
      { to: '/weather', label: 'Weather', icon: Cloud, description: 'Conditions and environment correlation' },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { to: '/source-analysis', label: 'Source Analysis', icon: Brain, description: 'Probable emission source attribution' },
      { to: '/predictions', label: 'Predictions', icon: TrendingUp, description: 'Risk projection and forecast' },
      { to: '/alerts', label: 'Alerts', icon: Bell, description: 'Severity-filtered alert center' },
    ],
  },
  {
    label: 'Data',
    items: [
      { to: '/data-upload', label: 'Data Upload', icon: Upload, description: 'Import CSV or JSON datasets' },
      { to: '/reports', label: 'Reports', icon: FileText, description: 'Generate, preview and export reports' },
      { to: '/settings', label: 'Settings', icon: Settings, description: 'Profile, appearance and data sources' },
    ],
  },
];
