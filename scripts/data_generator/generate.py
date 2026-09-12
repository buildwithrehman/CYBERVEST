import random
import sys
from config import get_args, PROFILES
from generators.core import (
    generate_organizations, generate_services, generate_assets, 
    generate_vulnerabilities, generate_events_incidents_controls
)
from validators import validate_data, generate_report
from exporter import export_to_sql

def main():
    args = get_args()
    random.seed(args.seed)
    
    cfg = PROFILES[args.profile]
    print(f"Generating '{args.profile}' profile with seed {args.seed}...")
    
    orgs = generate_organizations(cfg["org_count"])
    services = generate_services(orgs, cfg["services_per_org"])
    assets = generate_assets(orgs, services, cfg["assets_per_service"])
    vulns = generate_vulnerabilities(assets, cfg["vulns_per_asset"])
    events, incidents, controls = generate_events_incidents_controls(orgs, services, assets, vulns, cfg)
    
    data = {
        "organizations": orgs,
        "services": services,
        "assets": assets,
        "vulnerabilities": vulns,
        "events": events,
        "incidents": incidents,
        "controls": controls
    }
    
    print("Validating...")
    issues = validate_data(data)
    if issues:
        print("VALIDATION FAILED:")
        for i in issues[:10]:
            print(" -", i)
        if len(issues) > 10:
            print(f" ... and {len(issues) - 10} more.")
        sys.exit(1)
    
    print("Validation passed. Generating report...")
    report = generate_report(data)
    with open("../../docs/MILESTONE_2_DATA_VALIDATION.md", "w") as f:
        f.write(report)
        
    print("Exporting to Supabase via REST API...")
    from exporter import export_to_supabase
    export_to_supabase(data)
    print("Done!")

if __name__ == "__main__":
    main()
