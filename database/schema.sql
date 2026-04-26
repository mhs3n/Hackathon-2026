CREATE TABLE universities (
  id TEXT PRIMARY KEY,
  short_name TEXT NOT NULL,
  name TEXT NOT NULL,
  logo_path TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE institutions (
  id TEXT PRIMARY KEY,
  university_id TEXT NOT NULL REFERENCES universities(id),
  short_name TEXT NOT NULL,
  name TEXT NOT NULL,
  region TEXT NOT NULL,
  logo_path TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE app_users (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('ucar_admin', 'institution_admin', 'student')),
  institution_id TEXT REFERENCES institutions(id),
  student_profile_id TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE reporting_periods (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  year INTEGER NOT NULL,
  semester TEXT NOT NULL,
  starts_on TEXT NOT NULL,
  ends_on TEXT NOT NULL
);

CREATE TABLE academic_kpis (
  id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL REFERENCES institutions(id),
  reporting_period_id TEXT NOT NULL REFERENCES reporting_periods(id),
  success_rate REAL NOT NULL,
  attendance_rate REAL NOT NULL,
  repetition_rate REAL NOT NULL,
  dropout_rate REAL NOT NULL,
  abandonment_rate REAL NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE insertion_kpis (
  id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL REFERENCES institutions(id),
  reporting_period_id TEXT NOT NULL REFERENCES reporting_periods(id),
  national_convention_rate REAL NOT NULL,
  international_convention_rate REAL NOT NULL,
  employability_rate REAL NOT NULL,
  insertion_delay_months REAL NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE finance_kpis (
  id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL REFERENCES institutions(id),
  reporting_period_id TEXT NOT NULL REFERENCES reporting_periods(id),
  budget_allocated REAL NOT NULL,
  budget_consumed REAL NOT NULL,
  cost_per_student REAL NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE esg_kpis (
  id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL REFERENCES institutions(id),
  reporting_period_id TEXT NOT NULL REFERENCES reporting_periods(id),
  energy_consumption_index REAL NOT NULL,
  carbon_footprint_index REAL NOT NULL,
  recycling_rate REAL NOT NULL,
  mobility_index REAL NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE process_kpis (
  id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL REFERENCES institutions(id),
  reporting_period_id TEXT NOT NULL REFERENCES reporting_periods(id),
  process_key TEXT NOT NULL,
  process_label TEXT NOT NULL,
  metric_label TEXT NOT NULL,
  metric_value REAL NOT NULL,
  metric_unit TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE students (
  id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL REFERENCES institutions(id),
  student_code TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  program_name TEXT NOT NULL,
  level_label TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE student_metrics (
  id TEXT PRIMARY KEY,
  student_profile_id TEXT NOT NULL REFERENCES students(id),
  reporting_period_id TEXT NOT NULL REFERENCES reporting_periods(id),
  average_grade REAL NOT NULL,
  attendance_rate REAL NOT NULL,
  risk_score REAL NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE risk_alerts (
  id TEXT PRIMARY KEY,
  scope_type TEXT NOT NULL CHECK (scope_type IN ('institution', 'student')),
  institution_id TEXT REFERENCES institutions(id),
  student_profile_id TEXT REFERENCES students(id),
  reporting_period_id TEXT NOT NULL REFERENCES reporting_periods(id),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  title TEXT NOT NULL,
  explanation TEXT NOT NULL,
  predicted_impact TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE recommendations (
  id TEXT PRIMARY KEY,
  student_profile_id TEXT NOT NULL REFERENCES students(id),
  reporting_period_id TEXT NOT NULL REFERENCES reporting_periods(id),
  recommendation_text TEXT NOT NULL,
  display_order INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE generated_reports (
  id TEXT PRIMARY KEY,
  scope_type TEXT NOT NULL CHECK (scope_type IN ('ucar', 'institution', 'student')),
  institution_id TEXT REFERENCES institutions(id),
  student_profile_id TEXT REFERENCES students(id),
  reporting_period_id TEXT NOT NULL REFERENCES reporting_periods(id),
  title TEXT NOT NULL,
  generated_at TEXT NOT NULL,
  summary_text TEXT NOT NULL
);

CREATE TABLE hr_kpis (
  id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL REFERENCES institutions(id),
  reporting_period_id TEXT NOT NULL REFERENCES reporting_periods(id),
  teaching_headcount INTEGER NOT NULL,
  admin_headcount INTEGER NOT NULL,
  absenteeism_rate REAL NOT NULL,
  training_completed_pct REAL NOT NULL,
  teaching_load_hours REAL NOT NULL,
  team_stability_index REAL NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE research_kpis (
  id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL REFERENCES institutions(id),
  reporting_period_id TEXT NOT NULL REFERENCES reporting_periods(id),
  publications_count INTEGER NOT NULL,
  active_projects INTEGER NOT NULL,
  funding_secured_tnd REAL NOT NULL,
  academic_partnerships INTEGER NOT NULL,
  patents_filed INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE infrastructure_kpis (
  id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL REFERENCES institutions(id),
  reporting_period_id TEXT NOT NULL REFERENCES reporting_periods(id),
  classroom_occupancy_pct REAL NOT NULL,
  equipment_availability_pct REAL NOT NULL,
  it_equipment_status REAL NOT NULL,
  ongoing_projects_count INTEGER NOT NULL,
  maintenance_backlog_days INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE partnership_kpis (
  id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL REFERENCES institutions(id),
  reporting_period_id TEXT NOT NULL REFERENCES reporting_periods(id),
  active_agreements_count INTEGER NOT NULL,
  student_mobility_incoming INTEGER NOT NULL,
  student_mobility_outgoing INTEGER NOT NULL,
  international_projects INTEGER NOT NULL,
  academic_networks_count INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE import_batches (
  id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL REFERENCES institutions(id),
  reporting_period_id TEXT NOT NULL REFERENCES reporting_periods(id),
  user_id TEXT REFERENCES app_users(id),
  source_file TEXT NOT NULL,
  file_type TEXT NOT NULL,
  domains_written TEXT NOT NULL,
  raw_kpis TEXT,
  imported_at TEXT NOT NULL
);
