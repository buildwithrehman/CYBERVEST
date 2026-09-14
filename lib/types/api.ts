// Extracted from API_CONTRACT.md

export interface PERTDistribution {
  min_val: number;
  likely_val: number;
  max_val: number;
}

export interface FAIRScenarioInput {
  scenario_id: string;
  scenario_name: string;
  organization_id?: string;
  asset_id?: string;
  tef: PERTDistribution;
  susceptibility: PERTDistribution; // bounded 0 to 1
  productivity_loss: PERTDistribution;
  response_cost: PERTDistribution;
  regulatory_loss: PERTDistribution;
  reputation_loss: PERTDistribution;
  simulation_count?: number;
}

export interface FAIRResultOutput {
  scenario_id: string;
  scenario_name: string;
  tef_mean: number;
  susceptibility_mean: number;
  lef_mean: number;
  primary_loss_mean: number;
  secondary_loss_mean: number;
  total_loss_mean: number;
  p10: number;
  p50: number;
  p90: number;
  eal: number;
}


export interface ControlUpdatePayload {
  status: string;
  notes?: string;
  owner?: string;
}

export interface EvidencePayload {
  organization_control_id: string;
  finding: string;
  description: string;
  storage_path: string;
  evidence_type: string;
  source: string;
}

export interface AIQuery {
  query: string;
}

export interface AIResponse {
  status: string;
  query: string;
  verified_data_source: string;
  verified_data?: Record<string, unknown>;
  llm_explanation: string;
}
export interface RiskReductionParameters {
  tef_multiplier: number;
  susceptibility_multiplier: number;
  productivity_loss_multiplier: number;
  response_cost_multiplier: number;
  regulatory_loss_multiplier: number;
  reputation_loss_multiplier: number;
}

export interface Mitigation {
  id: string;
  name: string;
  description: string;
  category: string;
  cost: number;
  implementation_time: number;
  risk_reduction_parameters: RiskReductionParameters;
  affected_assets?: string[];
  affected_risk_drivers?: string[];
  dependencies?: string[];
  minimum_budget?: number;
  maximum_budget?: number;
  status: string;
}

export interface OptimizationConstraints {
  mutual_exclusions?: string[][];
  max_mitigations?: number;
}

export interface OptimizationRequest {
  organization_id: string;
  budget: number;
  mitigations: Mitigation[];
  constraints?: OptimizationConstraints;
  baseline_scenario: FAIRScenarioInput;
}

export interface SelectedMitigationDetail {
  id: string;
  name: string;
  cost: number;
  modeled_eal_reduction: number;
  risk_drivers_affected?: string[];
  dependencies?: string[];
  assumptions: string[];
  reason_for_selection: string;
}

export interface OptimizationResponse {
  status: string;
  portfolio_validation: string;
  feasible_portfolio_count: number;
  evaluated_portfolio_count: number;
  mip_exact_match: boolean;
  budget: number;
  selected_mitigations: SelectedMitigationDetail[];
  total_investment: number;
  remaining_budget: number;
  baseline_eal: number;
  optimized_eal: number;
  absolute_risk_reduction: number;
  percentage_risk_reduction: number;
  rosi: number;
  portfolio_score: number;
  constraints: Record<string, unknown>;
  assumptions: string[];
  calculation_version: string;
}

export interface MLFeaturePayload {
  asset_type: string;
  criticality: string;
  internet_exposed: boolean;
  vuln_count: number;
  cvss_max: number;
  known_exploited_count: number;
  recent_event_count_30d: number;
  prior_incident_count: number;
}

export interface MLPredictRequest {
  asset_id: string;
}

export interface MLPredictResponse {
  status: string;
  asset_id: string;
  prediction: {
    probability: number;
    label: string;
  };
  features: Record<string, any>;
  model: {
    name: string;
    version: string;
    training_metrics?: Record<string, any>;
  };
  prediction_timestamp?: string;
}

export interface OrganizationMember {
  user_id: string;
  email: string;
  full_name?: string;
  role: string;
  created_at: string;
  status: string;
}

export interface RoleListResponse {
  members: OrganizationMember[];
}

export interface RoleUpdateRequest {
  target_user_id: string;
  role: string;
}

export interface RoleUpdateResponse {
  status: string;
}

export interface AuditRecord {
  id: string;
  timestamp: string;
  actor_id: string;
  actor_email?: string;
  actor_name?: string;
  action: string;
  resource_type: string;
  resource_id: string;
  status: string;
  details?: string;
}

export interface PaginationMeta {
  page: number;
  page_size: number;
  total: number;
}

export interface AuditListResponse {
  data: AuditRecord[];
  pagination: PaginationMeta;
}

export interface ReportRequest {
  report_type: string;
  parameters?: Record<string, unknown>;
}

export interface ReportResponse {
  metadata: ReportMetadata;
  content: ReportContent;
  limitations?: string;
}

export interface FrameworkData {
  short_name: string;
}

export interface FrameworkControlData {
  control_code: string;
  title: string;
  frameworks?: FrameworkData;
}

export interface ReportControl {
  id: string;
  status: string;
  framework_controls?: FrameworkControlData;
}

export interface ReportFinding {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
}

export interface ReportMetadata {
  report_type: string;
  organization_id: string;
  generated_timestamp: string;
}

export interface ReportContent {
  controls?: ReportControl[];
  findings?: ReportFinding[];
}

export interface Asset {
  id: string;
  organization_id: string;
  name: string;
  asset_type?: string;
  environment?: string;
  criticality?: string;
  internet_exposed: boolean;
  data_sensitivity?: string;
  owner?: string;
  location?: string;
  description?: string;
  business_service_id?: string;
  created_at: string;
  updated_at: string;
}

export interface RiskAsset {
  id: string;
  name: string;
  asset_type?: string;
  environment?: string;
  criticality?: string;
  internet_exposed: boolean;
  business_service_id?: string;
  vuln_critical_count: number;
  vuln_high_count: number;
  epss_max?: number;
  event_count_30d: number;
  incident_count: number;
}

export interface Framework {
  id: string;
  name: string;
  short_name: string;
  version: string;
  description: string;
}

export interface FrameworkControl {
  id: string;
  framework_id: string;
  control_code: string;
  title: string;
  description: string;
  domain: string;
}

export interface OrganizationControl {
  id: string;
  organization_id: string;
  framework_control_id: string;
  status: string;
  owner?: string;
  notes?: string;
  framework_controls?: {
    framework_id: string;
    control_code: string;
    title: string;
    frameworks?: {
      short_name: string;
    }
  }
}

export interface ComplianceOverview {
  organization_id: string;
  framework_posture: Record<string, {
    IMPLEMENTED: number;
    PARTIALLY_IMPLEMENTED: number;
    GAP: number;
    NOT_ASSESSED: number;
  }>;
  critical_gaps: number;
  high_gaps: number;
}

export interface ComplianceFinding {
  id: string;
  organization_id: string;
  organization_control_id?: string;
  finding: string;
  severity: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ComplianceGap {
  organization_control_id: string;
  framework_id: string;
  control_code: string;
  title: string;
  status: string;
  has_gap: boolean;
}

export interface Vulnerability {
  id: string;
  cve_id?: string;
  asset_id: string;
  cvss_score?: number;
  severity?: string;
  attack_vector?: string;
  known_exploited: boolean;
  epss_score?: number;
  published_at?: string;
}

export interface SecurityEvent {
  id: string;
  asset_id: string;
  event_type: string;
  severity: string;
  source: string;
  timestamp: string;
  description?: string;
}

export interface Incident {
  id: string;
  organization_id: string;
  asset_id: string;
  incident_type: string;
  severity: string;
  detected_at: string;
  resolved_at?: string;
  financial_loss?: number;
  description?: string;
}

export interface AssetTelemetryResponse {
  vulnerabilities: Vulnerability[];
  security_events: SecurityEvent[];
  incidents: Incident[];
}
