import { 
  LayoutDashboard, 
  Compass, 
  Calculator, 
  GitMerge, 
  TrendingUp, 
  Server, 
  BrainCircuit, 
  ShieldCheck, 
  AlertTriangle, 
  FileCheck, 
  Bot, 
  Users, 
  History,
  FileText
} from 'lucide-react';

export const NAVIGATION_CONFIG = [
  {
    group: 'Overview',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Risk Explorer', href: '/risk-explorer', icon: Compass },
    ],
  },
  {
    group: 'Risk',
    items: [
      { name: 'FAIR', href: '/fair', icon: Calculator },
      { name: 'What-If Scenarios', href: '/scenarios', icon: GitMerge },
      { name: 'Optimizer', href: '/optimizer', icon: TrendingUp },
    ],
  },
  {
    group: 'Security',
    items: [
      { name: 'Assets', href: '/assets', icon: Server },
      { name: 'ML Intelligence', href: '/ml', icon: BrainCircuit },
    ],
  },
  {
    group: 'Compliance',
    items: [
      { name: 'Compliance Center', href: '/compliance', icon: ShieldCheck },
      { name: 'Findings', href: '/findings', icon: AlertTriangle },
      { name: 'Evidence', href: '/evidence', icon: FileCheck },
    ],
  },
  {
    group: 'AI',
    items: [
      { name: 'Risk Assistant', href: '/ai', icon: Bot },
    ],
  },
  {
    group: 'Administration',
    items: [
      { name: 'Reports', href: '/reports', icon: FileText },
      { name: 'Roles & Access', href: '/admin/roles', icon: Users },
      { name: 'Audit Activity', href: '/audit', icon: History },
    ],
  },
];
