"""Generates seed.sql with the official 35 UCAR institutions and 4 historical periods of KPI data."""
from __future__ import annotations
import random
from pathlib import Path

random.seed(42)

INSTITUTIONS = [
    ("fsjpst", "FSJPST", "Faculty of Juridical, Political and Social Sciences of Tunis", "Tunis"),
    ("fsb", "FSB", "Faculty of Sciences of Bizerte", "Bizerte"),
    ("fsegn", "FSEGN", "Faculty of Economic Sciences and Management of Nabeul", "Nabeul"),
    ("enau", "ENAU", "National School of Architecture and Urbanism of Tunis", "Tunis"),
    ("ept", "EPT", "Tunisia Polytechnic School", "La Marsa"),
    ("enicarthage", "ENICar", "National Engineering School of Carthage", "Tunis"),
    ("enstab", "ENSTAB", "National School of Sciences and Advanced Technologies of Borj Cedria", "Borj Cedria"),
    ("essai", "ESSAI", "Higher School of Statistics and Information Analysis", "Tunis"),
    ("esac", "ESAC", "Higher School of Audiovisual and Cinema of Gammarth", "Gammarth"),
    ("ipeib", "IPEIB", "Preparatory Institute for Engineering Studies of Bizerte", "Bizerte"),
    ("ihec", "IHEC", "Institute of Advanced Business Studies of Carthage", "Carthage"),
    ("insat", "INSAT", "National Institute of Applied Science and Technology", "Ariana"),
    ("instm", "INSTM", "National Institute of Marine Science and Technology", "Salammbo"),
    ("issatm", "ISSATM", "Higher Institute of Applied Sciences and Technology of Mateur", "Bizerte"),
    ("ipein", "IPEIN", "Preparatory Institute for Engineering Studies of Nabeul", "Nabeul"),
    ("ipest", "IPEST", "Preparatory Institute for Scientific and Technical Studies of La Marsa", "La Marsa"),
    ("isban", "ISBAN", "Higher Institute of Fine Arts of Nabeul", "Nabeul"),
    ("isteub", "ISTEUB", "Higher Institute of Environment, Urbanism and Building Technologies", "Tunis"),
    ("islt", "ISLT", "Higher Institute of Languages of Tunis", "Tunis"),
    ("isln", "ISLN", "Higher Institute of Languages of Nabeul", "Nabeul"),
    ("isste", "ISSTE", "Higher Institute of Sciences and Technology of Environment of Borj Cedria", "Borj Cedria"),
    ("istic", "ISTIC", "Higher Institute of Information and Communication Technologies", "Borj Cedria"),
    ("isgb", "ISGB", "Higher Institute of Management of Bizerte", "Bizerte"),
    ("isepbg", "ISEP-BG", "Higher Institute of Preparatory Studies in Biology and Geology of Soukra", "Ariana"),
    ("supcom", "SupCom", "Higher School of Communication of Tunis", "Tunis"),
    ("esamograne", "ESAMograne", "Higher School of Agriculture of Mograne", "Zaghouan"),
    ("esamateur", "ESAMateur", "Higher School of Agriculture of Mateur", "Bizerte"),
    ("esiat", "ESIAT", "Higher School of Food Industries of Tunis", "Tunis"),
    ("ispab", "ISPAB", "Higher Institute of Fishing and Aquaculture of Bizerte", "Bizerte"),
    ("intes", "INTES", "National Institute of Labor and Social Studies of Tunis", "Tunis"),
    ("isce", "ISCE", "Higher Institute for Childhood Educators of Carthage", "Carthage"),
    ("inat", "INAT", "National Agronomic Institute of Tunisia", "Tunis"),
    ("ihet", "IHET", "Institute of Advanced Tourism Studies of Sidi Dhrif", "Sidi Dhrif"),
    ("inrat", "INRAT", "National Agronomic Research Institute of Tunisia", "Ariana"),
    ("enib", "ENIB", "National Engineering School of Bizerte", "Bizerte"),
]

assert len(INSTITUTIONS) == 35

# 4 reporting periods (oldest -> newest)
PERIODS = [
    ("rp_2024_s2", "Semester 2 - 2024", 2024, "S2", "2024-09-01", "2025-01-31"),
    ("rp_2025_s1", "Semester 1 - 2025", 2025, "S1", "2025-02-01", "2025-06-30"),
    ("rp_2025_s2", "Semester 2 - 2025", 2025, "S2", "2025-09-01", "2026-01-31"),
    ("rp_2026_s2", "Semester 2 - 2026", 2026, "S2", "2026-02-01", "2026-06-30"),
]
CURRENT_PERIOD = PERIODS[-1][0]

TS = "2026-04-25T10:00:00Z"
LOGO = "/assets/ucar-logo.png"
INSAT_LOGO = "/assets/insat-logo.png"


# Realistic created_at / updated_at per period:
#   created_at = a few days after the period starts (when admins first uploaded)
#   updated_at = a few days before the period ends (last refresh during that semester)
# Final/current period gets a fresh updated_at near "now".
PERIOD_TIMESTAMPS = {
    "rp_2024_s2": ("2024-09-12T09:00:00Z", "2025-01-20T15:00:00Z"),
    "rp_2025_s1": ("2025-02-14T09:00:00Z", "2025-06-22T15:00:00Z"),
    "rp_2025_s2": ("2025-09-10T09:00:00Z", "2026-01-25T15:00:00Z"),
    "rp_2026_s2": ("2026-02-08T09:00:00Z", TS),
}


def rnd(a, b, ndigits=1):
    return round(random.uniform(a, b), ndigits)


def trend(base: float, period_idx: int, drift: float, noise: float, lo=0, hi=100, ndigits=1) -> float:
    """Generate trended value for a given period index (0..3)."""
    val = base + drift * period_idx + random.uniform(-noise, noise)
    return round(max(lo, min(hi, val)), ndigits)


def trend_int(base: int, period_idx: int, drift: float, noise: int, lo=0) -> int:
    val = base + drift * period_idx + random.randint(-noise, noise)
    return max(lo, int(round(val)))


lines: list[str] = []
lines.append(f"INSERT INTO universities (id, short_name, name, logo_path, created_at) VALUES")
lines.append(f"('ucar', 'UCAR', 'University of Carthage', '{LOGO}', '{TS}');\n")

# institutions
lines.append("INSERT INTO institutions (id, university_id, short_name, name, region, logo_path, created_at) VALUES")
inst_rows = []
for iid, short, full, region in INSTITUTIONS:
    logo = INSAT_LOGO if iid == "insat" else LOGO
    inst_rows.append(f"('{iid}', 'ucar', '{short}', '{full}', '{region}', '{logo}', '{TS}')")
lines.append(",\n".join(inst_rows) + ";\n")

lines.append(
    "INSERT INTO app_users (id, full_name, email, role, institution_id, student_profile_id, created_at) VALUES\n"
    "('user_ucar_01', 'UCAR Owner', 'owner@ucar.tn', 'ucar_admin', NULL, NULL, '2026-04-25T10:00:00Z'),\n"
    "('user_inst_01', 'INSAT Administrator', 'insat@ucar.tn', 'institution_admin', 'insat', NULL, '2026-04-25T10:00:00Z'),\n"
    "('user_student_01', 'Takwa Bouheni', 'takwa.bouheni@enstab.ucar.tn', 'student', 'insat', 'student_insat_01', '2026-04-25T10:00:00Z');\n"
)

# Reporting periods
lines.append("INSERT INTO reporting_periods (id, label, year, semester, starts_on, ends_on) VALUES")
period_rows = []
for pid, label, year, sem, start, end in PERIODS:
    period_rows.append(f"('{pid}', '{label}', {year}, '{sem}', '{start}', '{end}')")
lines.append(",\n".join(period_rows) + ";\n")


# Build per-institution baseline + drift profiles for time series realism
def build_profile(iid: str) -> dict:
    """Each institution gets stable baselines with mild trend (some improving, some declining)."""
    rng = random.Random(hash(iid) % (2**32))
    return {
        "academic": {
            "success": (rng.uniform(60, 88), rng.uniform(-2, 2)),
            "attendance": (rng.uniform(65, 90), rng.uniform(-1.5, 1.5)),
            "repetition": (rng.uniform(4, 11), rng.uniform(-0.5, 0.8)),
            "dropout": (rng.uniform(6, 18), rng.uniform(-0.7, 1.2)),
            "abandonment": (rng.uniform(2.5, 8), rng.uniform(-0.3, 0.6)),
        },
        "insertion": {
            "national": (rng.uniform(38, 70), rng.uniform(-2, 3)),
            "international": (rng.uniform(12, 38), rng.uniform(-1, 2)),
            "employability": (rng.uniform(62, 88), rng.uniform(-1.5, 2.5)),
            "delay": (rng.uniform(2.8, 6.5), rng.uniform(-0.3, 0.4)),
        },
        "finance": {
            "alloc": (rng.randint(4_000_000, 16_000_000), rng.randint(-200_000, 500_000)),
            "cps": (rng.randint(3800, 8500), rng.randint(-100, 400)),
        },
        "esg": {
            "energy": (rng.uniform(45, 78), rng.uniform(-1, 1)),
            "carbon": (rng.uniform(45, 72), rng.uniform(-1, 1)),
            "recycling": (rng.uniform(22, 50), rng.uniform(0, 1.5)),
            "mobility": (rng.uniform(38, 62), rng.uniform(0, 1.2)),
        },
        "hr": {
            "teach": (rng.randint(50, 180), rng.randint(-3, 6)),
            "admin": (rng.randint(18, 55), rng.randint(-2, 3)),
            "absent": (rng.uniform(2, 7.5), rng.uniform(-0.2, 0.4)),
            "training": (rng.uniform(48, 88), rng.uniform(0, 2)),
            "load": (rng.uniform(13, 21), rng.uniform(-0.3, 0.4)),
            "stability": (rng.uniform(62, 92), rng.uniform(-0.5, 0.7)),
        },
        "research": {
            "pubs": (rng.randint(10, 80), rng.randint(0, 5)),
            "projects": (rng.randint(3, 28), rng.randint(0, 2)),
            "funding": (rng.randint(180_000, 1_500_000), rng.randint(-30_000, 80_000)),
            "partners": (rng.randint(4, 16), rng.randint(0, 1)),
            "patents": (rng.randint(0, 8), rng.randint(0, 1)),
        },
        "infra": {
            "occupancy": (rng.uniform(62, 92), rng.uniform(-1, 1.5)),
            "equipment": (rng.uniform(72, 95), rng.uniform(-0.5, 1)),
            "it": (rng.uniform(66, 92), rng.uniform(-0.5, 1.2)),
            "projects": (rng.randint(2, 8), rng.randint(0, 1)),
            "backlog": (rng.randint(4, 24), rng.randint(-2, 3)),
        },
        "partnership": {
            "agreements": (rng.randint(8, 48), rng.randint(0, 3)),
            "in_mob": (rng.randint(5, 38), rng.randint(0, 3)),
            "out_mob": (rng.randint(4, 32), rng.randint(0, 3)),
            "intl": (rng.randint(1, 13), rng.randint(0, 1)),
            "networks": (rng.randint(2, 13), rng.randint(0, 1)),
        },
    }


profiles = {iid: build_profile(iid) for iid, *_ in INSTITUTIONS}


def gen_for_period(iid: str, period_idx: int) -> dict:
    p = profiles[iid]
    return {
        "academic": {
            "success_rate": trend(*p["academic"]["success"], period_idx, 1.5, 50, 95),
            "attendance_rate": trend(*p["academic"]["attendance"], period_idx, 1, 55, 95),
            "repetition_rate": trend(*p["academic"]["repetition"], period_idx, 0.4, 2, 14),
            "dropout_rate": trend(*p["academic"]["dropout"], period_idx, 0.5, 3, 25),
            "abandonment_rate": trend(*p["academic"]["abandonment"], period_idx, 0.2, 1.5, 12),
        },
        "insertion": {
            "national_convention_rate": trend(*p["insertion"]["national"], period_idx, 1.5, 30, 85),
            "international_convention_rate": trend(*p["insertion"]["international"], period_idx, 1, 8, 50),
            "employability_rate": trend(*p["insertion"]["employability"], period_idx, 1.2, 55, 95),
            "insertion_delay_months": trend(*p["insertion"]["delay"], period_idx, 0.2, 2, 8),
        },
        "finance": {
            "budget_allocated": trend_int(*p["finance"]["alloc"], period_idx, 250_000, 1_000_000),
            "cost_per_student": trend_int(*p["finance"]["cps"], period_idx, 200, 1500),
        },
        "esg": {
            "energy_consumption_index": trend(*p["esg"]["energy"], period_idx, 0.5, 30, 85),
            "carbon_footprint_index": trend(*p["esg"]["carbon"], period_idx, 0.5, 30, 85),
            "recycling_rate": trend(*p["esg"]["recycling"], period_idx, 0.5, 15, 65),
            "mobility_index": trend(*p["esg"]["mobility"], period_idx, 0.5, 25, 75),
        },
        "hr": {
            "teaching_headcount": trend_int(*p["hr"]["teach"], period_idx, 4, 10),
            "admin_headcount": trend_int(*p["hr"]["admin"], period_idx, 2, 5),
            "absenteeism_rate": trend(*p["hr"]["absent"], period_idx, 0.2, 1.5, 9),
            "training_completed_pct": trend(*p["hr"]["training"], period_idx, 0.5, 35, 95),
            "teaching_load_hours": trend(*p["hr"]["load"], period_idx, 0.3, 10, 25),
            "team_stability_index": trend(*p["hr"]["stability"], period_idx, 0.5, 50, 98),
        },
        "research": {
            "publications_count": trend_int(*p["research"]["pubs"], period_idx, 4, 0),
            "active_projects": trend_int(*p["research"]["projects"], period_idx, 1, 0),
            "funding_secured_tnd": trend_int(*p["research"]["funding"], period_idx, 50_000, 50_000),
            "academic_partnerships": trend_int(*p["research"]["partners"], period_idx, 1, 0),
            "patents_filed": trend_int(*p["research"]["patents"], period_idx, 1, 0),
        },
        "infra": {
            "classroom_occupancy_pct": trend(*p["infra"]["occupancy"], period_idx, 1, 50, 98),
            "equipment_availability_pct": trend(*p["infra"]["equipment"], period_idx, 0.5, 60, 99),
            "it_equipment_status": trend(*p["infra"]["it"], period_idx, 0.8, 55, 98),
            "ongoing_projects_count": trend_int(*p["infra"]["projects"], period_idx, 1, 0),
            "maintenance_backlog_days": trend_int(*p["infra"]["backlog"], period_idx, 2, 0),
        },
        "partnership": {
            "active_agreements_count": trend_int(*p["partnership"]["agreements"], period_idx, 2, 0),
            "student_mobility_incoming": trend_int(*p["partnership"]["in_mob"], period_idx, 2, 0),
            "student_mobility_outgoing": trend_int(*p["partnership"]["out_mob"], period_idx, 2, 0),
            "international_projects": trend_int(*p["partnership"]["intl"], period_idx, 1, 0),
            "academic_networks_count": trend_int(*p["partnership"]["networks"], period_idx, 1, 0),
        },
    }


# Pre-generate all KPIs (per institution per period)
all_kpis = {}
for iid, *_ in INSTITUTIONS:
    all_kpis[iid] = []
    for idx in range(len(PERIODS)):
        all_kpis[iid].append(gen_for_period(iid, idx))


# Academic
lines.append(
    "INSERT INTO academic_kpis (id, institution_id, reporting_period_id, success_rate, attendance_rate, repetition_rate, dropout_rate, abandonment_rate, created_at, updated_at) VALUES"
)
rows = []
for iid, *_ in INSTITUTIONS:
    for idx, (pid, *_) in enumerate(PERIODS):
        a = all_kpis[iid][idx]["academic"]
        ca, ua = PERIOD_TIMESTAMPS[pid]
        rows.append(
            f"('ak_{iid}_{pid}', '{iid}', '{pid}', {a['success_rate']}, {a['attendance_rate']}, {a['repetition_rate']}, {a['dropout_rate']}, {a['abandonment_rate']}, '{ca}', '{ua}')"
        )
lines.append(",\n".join(rows) + ";\n")

# Insertion
lines.append(
    "INSERT INTO insertion_kpis (id, institution_id, reporting_period_id, national_convention_rate, international_convention_rate, employability_rate, insertion_delay_months, created_at, updated_at) VALUES"
)
rows = []
for iid, *_ in INSTITUTIONS:
    for idx, (pid, *_) in enumerate(PERIODS):
        i = all_kpis[iid][idx]["insertion"]
        ca, ua = PERIOD_TIMESTAMPS[pid]
        rows.append(
            f"('ik_{iid}_{pid}', '{iid}', '{pid}', {i['national_convention_rate']}, {i['international_convention_rate']}, {i['employability_rate']}, {i['insertion_delay_months']}, '{ca}', '{ua}')"
        )
lines.append(",\n".join(rows) + ";\n")

# Finance (compute consumed from allocated * realistic ratio)
lines.append(
    "INSERT INTO finance_kpis (id, institution_id, reporting_period_id, budget_allocated, budget_consumed, cost_per_student, created_at, updated_at) VALUES"
)
rows = []
for iid, *_ in INSTITUTIONS:
    for idx, (pid, *_) in enumerate(PERIODS):
        f = all_kpis[iid][idx]["finance"]
        consumed = int(f["budget_allocated"] * random.uniform(0.55, 0.92))
        ca, ua = PERIOD_TIMESTAMPS[pid]
        rows.append(
            f"('fk_{iid}_{pid}', '{iid}', '{pid}', {f['budget_allocated']}, {consumed}, {f['cost_per_student']}, '{ca}', '{ua}')"
        )
lines.append(",\n".join(rows) + ";\n")

# ESG
lines.append(
    "INSERT INTO esg_kpis (id, institution_id, reporting_period_id, energy_consumption_index, carbon_footprint_index, recycling_rate, mobility_index, created_at, updated_at) VALUES"
)
rows = []
for iid, *_ in INSTITUTIONS:
    for idx, (pid, *_) in enumerate(PERIODS):
        e = all_kpis[iid][idx]["esg"]
        ca, ua = PERIOD_TIMESTAMPS[pid]
        rows.append(
            f"('ek_{iid}_{pid}', '{iid}', '{pid}', {e['energy_consumption_index']}, {e['carbon_footprint_index']}, {e['recycling_rate']}, {e['mobility_index']}, '{ca}', '{ua}')"
        )
lines.append(",\n".join(rows) + ";\n")

# Process KPIs - just for current period + insat
_pk_ca, _pk_ua = PERIOD_TIMESTAMPS["rp_2026_s2"]
lines.append(
    "INSERT INTO process_kpis (id, institution_id, reporting_period_id, process_key, process_label, metric_label, metric_value, metric_unit, created_at, updated_at) VALUES\n"
    f"('pk1', 'insat', 'rp_2026_s2', 'scolarite', 'Scolarite', 'Attendance rate', 76, '%', '{_pk_ca}', '{_pk_ua}'),\n"
    f"('pk2', 'insat', 'rp_2026_s2', 'examens', 'Exams', 'Success rate', 73, '%', '{_pk_ca}', '{_pk_ua}'),\n"
    f"('pk3', 'insat', 'rp_2026_s2', 'finance', 'Finance', 'Budget consumed', 59, '%', '{_pk_ca}', '{_pk_ua}'),\n"
    f"('pk4', 'insat', 'rp_2026_s2', 'recherche', 'Research', 'Active projects', 18, 'count', '{_pk_ca}', '{_pk_ua}'),\n"
    f"('pk5', 'insat', 'rp_2026_s2', 'infrastructure', 'Infrastructure', 'Energy index', 72, 'index', '{_pk_ca}', '{_pk_ua}');\n"
)

# Students
lines.append(
    "INSERT INTO students (id, institution_id, student_code, full_name, program_name, level_label, created_at, updated_at) VALUES\n"
    f"('student_insat_01', 'insat', 'INSAT-2026-001', 'Takwa Bouheni', 'Computer Engineering', '2nd Year', '{_pk_ca}', '{_pk_ua}'),\n"
    f"('student_insat_02', 'insat', 'INSAT-2026-002', 'Sarra Louati', 'Industrial Systems', '3rd Year', '{_pk_ca}', '{_pk_ua}'),\n"
    f"('student_fsb_01', 'fsb', 'FSB-2026-003', 'Amira Ben Salem', 'Applied Mathematics', '1st Year', '{_pk_ca}', '{_pk_ua}');\n"
)

lines.append(
    "INSERT INTO student_metrics (id, student_profile_id, reporting_period_id, average_grade, attendance_rate, risk_score, created_at, updated_at) VALUES\n"
    f"('sm_insat_01', 'student_insat_01', 'rp_2026_s2', 9.1, 58, 88, '{_pk_ca}', '{_pk_ua}'),\n"
    f"('sm_insat_02', 'student_insat_02', 'rp_2026_s2', 10.4, 62, 74, '{_pk_ca}', '{_pk_ua}'),\n"
    f"('sm_fsb_01', 'student_fsb_01', 'rp_2026_s2', 11.2, 71, 68, '{_pk_ca}', '{_pk_ua}');\n"
)

# Risk alerts will be auto-generated by AI engine; seed empty (or one demo)
lines.append(
    "INSERT INTO risk_alerts (id, scope_type, institution_id, student_profile_id, reporting_period_id, severity, title, explanation, predicted_impact, created_at) VALUES\n"
    f"('ra_student_takwa', 'student', 'insat', 'student_insat_01', 'rp_2026_s2', 'high', 'Student at academic risk', 'Attendance dropped sharply and recent grades remain below cohort average.', 'Likely increased dropout risk without intervention', '{_pk_ua}');\n"
)

lines.append(
    "INSERT INTO recommendations (id, student_profile_id, reporting_period_id, recommendation_text, display_order, created_at) VALUES\n"
    f"('rec1', 'student_insat_01', 'rp_2026_s2', 'Meet your academic advisor this week.', 1, '{_pk_ua}'),\n"
    f"('rec2', 'student_insat_01', 'rp_2026_s2', 'Prioritize the two modules with the steepest grade decline.', 2, '{_pk_ua}'),\n"
    f"('rec3', 'student_insat_01', 'rp_2026_s2', 'Follow the attendance recovery plan for the next 14 days.', 3, '{_pk_ua}');\n"
)

lines.append(
    "INSERT INTO generated_reports (id, scope_type, institution_id, student_profile_id, reporting_period_id, title, generated_at, summary_text) VALUES\n"
    "('gr_ucar_01', 'ucar', NULL, NULL, 'rp_2026_s2', 'UCAR Consolidated Performance Report', '2026-04-25T12:00:00Z', 'Cross-establishment monitoring shows multiple high-priority intervention sites this period.'),\n"
    "('gr_inst_01', 'institution', 'insat', NULL, 'rp_2026_s2', 'INSAT Institutional Summary', '2026-04-25T12:00:00Z', 'Attendance, student risk, and budget execution require immediate follow-up.'),\n"
    "('gr_student_01', 'student', 'insat', 'student_insat_01', 'rp_2026_s2', 'Student Risk Summary', '2026-04-25T12:00:00Z', 'The student requires coordinated academic and attendance intervention.');\n"
)

# HR
lines.append(
    "INSERT INTO hr_kpis (id, institution_id, reporting_period_id, teaching_headcount, admin_headcount, absenteeism_rate, training_completed_pct, teaching_load_hours, team_stability_index, created_at, updated_at) VALUES"
)
rows = []
for iid, *_ in INSTITUTIONS:
    for idx, (pid, *_) in enumerate(PERIODS):
        h = all_kpis[iid][idx]["hr"]
        ca, ua = PERIOD_TIMESTAMPS[pid]
        rows.append(
            f"('hr_{iid}_{pid}', '{iid}', '{pid}', {h['teaching_headcount']}, {h['admin_headcount']}, {h['absenteeism_rate']}, {h['training_completed_pct']}, {h['teaching_load_hours']}, {h['team_stability_index']}, '{ca}', '{ua}')"
        )
lines.append(",\n".join(rows) + ";\n")

# Research
lines.append(
    "INSERT INTO research_kpis (id, institution_id, reporting_period_id, publications_count, active_projects, funding_secured_tnd, academic_partnerships, patents_filed, created_at, updated_at) VALUES"
)
rows = []
for iid, *_ in INSTITUTIONS:
    for idx, (pid, *_) in enumerate(PERIODS):
        r = all_kpis[iid][idx]["research"]
        ca, ua = PERIOD_TIMESTAMPS[pid]
        rows.append(
            f"('rk_{iid}_{pid}', '{iid}', '{pid}', {r['publications_count']}, {r['active_projects']}, {r['funding_secured_tnd']}, {r['academic_partnerships']}, {r['patents_filed']}, '{ca}', '{ua}')"
        )
lines.append(",\n".join(rows) + ";\n")

# Infrastructure
lines.append(
    "INSERT INTO infrastructure_kpis (id, institution_id, reporting_period_id, classroom_occupancy_pct, equipment_availability_pct, it_equipment_status, ongoing_projects_count, maintenance_backlog_days, created_at, updated_at) VALUES"
)
rows = []
for iid, *_ in INSTITUTIONS:
    for idx, (pid, *_) in enumerate(PERIODS):
        x = all_kpis[iid][idx]["infra"]
        ca, ua = PERIOD_TIMESTAMPS[pid]
        rows.append(
            f"('infk_{iid}_{pid}', '{iid}', '{pid}', {x['classroom_occupancy_pct']}, {x['equipment_availability_pct']}, {x['it_equipment_status']}, {x['ongoing_projects_count']}, {x['maintenance_backlog_days']}, '{ca}', '{ua}')"
        )
lines.append(",\n".join(rows) + ";\n")

# Partnership
lines.append(
    "INSERT INTO partnership_kpis (id, institution_id, reporting_period_id, active_agreements_count, student_mobility_incoming, student_mobility_outgoing, international_projects, academic_networks_count, created_at, updated_at) VALUES"
)
rows = []
for iid, *_ in INSTITUTIONS:
    for idx, (pid, *_) in enumerate(PERIODS):
        p = all_kpis[iid][idx]["partnership"]
        ca, ua = PERIOD_TIMESTAMPS[pid]
        rows.append(
            f"('partk_{iid}_{pid}', '{iid}', '{pid}', {p['active_agreements_count']}, {p['student_mobility_incoming']}, {p['student_mobility_outgoing']}, {p['international_projects']}, {p['academic_networks_count']}, '{ca}', '{ua}')"
        )
lines.append(",\n".join(rows) + ";\n")

out = "\n".join(lines) + "\n"
Path(__file__).parent.joinpath("seed.sql").write_text(out)
print(f"Generated seed.sql with {len(INSTITUTIONS)} institutions × {len(PERIODS)} periods")
