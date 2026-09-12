def validate_data(data):
    issues = []
    
    # Check orphans
    org_ids = set(o["id"] for o in data["organizations"])
    srv_ids = set(s["id"] for s in data["services"])
    asset_ids = set(a["id"] for a in data["assets"])
    
    for s in data["services"]:
        if s["organization_id"] not in org_ids:
            issues.append(f"Service {s['id']} has invalid org_id")
            
    for a in data["assets"]:
        if a["organization_id"] not in org_ids:
            issues.append(f"Asset {a['id']} has invalid org_id")
        if a["business_service_id"] and a["business_service_id"] not in srv_ids:
            issues.append(f"Asset {a['id']} has invalid business_service_id")
            
    for v in data["vulnerabilities"]:
        if v["asset_id"] not in asset_ids:
            issues.append(f"Vuln {v['id']} has invalid asset_id")
        if not (0 <= v["cvss_score"] <= 10):
            issues.append(f"Vuln {v['id']} has invalid CVSS")
        if not (0 <= v["epss_score"] <= 1):
            issues.append(f"Vuln {v['id']} has invalid EPSS")
            
    for e in data["events"]:
        if e["asset_id"] not in asset_ids:
            issues.append(f"Event {e['id']} has invalid asset_id")
            
    for i in data["incidents"]:
        if i["organization_id"] not in org_ids:
            issues.append(f"Incident {i['id']} has invalid org_id")
        if i["asset_id"] not in asset_ids:
            issues.append(f"Incident {i['id']} has invalid asset_id")
        if i["total_loss"] < 0:
            issues.append(f"Incident {i['id']} has negative loss")
            
    for c in data["controls"]:
        if c["organization_id"] not in org_ids:
            issues.append(f"Control {c['id']} has invalid org_id")
        if not (0 <= c["effectiveness"] <= 1):
            issues.append(f"Control {c['id']} has invalid effectiveness")
            
    return issues

def generate_report(data):
    report = ["# Milestone 2 Data Validation & Distribution Report\n"]
    
    report.append("## Dataset Profile")
    report.append(f"- Organizations: {len(data['organizations'])}")
    report.append(f"- Business Services: {len(data['services'])}")
    report.append(f"- Assets: {len(data['assets'])}")
    report.append(f"- Vulnerabilities: {len(data['vulnerabilities'])}")
    report.append(f"- Security Events: {len(data['events'])}")
    report.append(f"- Incidents: {len(data['incidents'])}")
    report.append(f"- Controls: {len(data['controls'])}\n")
    
    # Asset Criticality
    crits = {}
    for a in data['assets']: crits[a['criticality']] = crits.get(a['criticality'], 0) + 1
    report.append("## Asset Criticality Distribution")
    for k, v in crits.items():
        report.append(f"- {k}: {v/len(data['assets']):.1%} ({v})")
        
    # Vulnerability Severity
    sevs = {}
    for v in data['vulnerabilities']: sevs[v['severity']] = sevs.get(v['severity'], 0) + 1
    report.append("\n## Vulnerability Severity Distribution")
    for k, v in sevs.items():
        report.append(f"- {k}: {v/len(data['vulnerabilities']):.1%} ({v})")
        
    # Exposure
    exp = sum(1 for a in data['assets'] if a['internet_exposed'])
    report.append(f"\n## Internet Exposure\n- Exposed: {exp/len(data['assets']):.1%} ({exp})")
    
    # Averages
    avg_cvss = sum(v['cvss_score'] for v in data['vulnerabilities']) / max(1, len(data['vulnerabilities']))
    report.append(f"\n## Metrics\n- Average CVSS: {avg_cvss:.2f}")
    
    # Correlations
    exposed_assets = {a['id'] for a in data['assets'] if a['internet_exposed']}
    internal_assets = {a['id'] for a in data['assets'] if not a['internet_exposed']}
    
    exp_incidents = sum(1 for i in data['incidents'] if i['asset_id'] in exposed_assets)
    int_incidents = sum(1 for i in data['incidents'] if i['asset_id'] in internal_assets)
    
    exp_rate = exp_incidents / max(1, len(exposed_assets))
    int_rate = int_incidents / max(1, len(internal_assets))
    
    report.append("\n## Correlation Validation")
    report.append(f"- Incident rate for exposed assets: {exp_rate:.2f} per asset")
    report.append(f"- Incident rate for internal assets: {int_rate:.2f} per asset")
    report.append(f"- Logical validation: {'PASS' if exp_rate >= int_rate else 'FAIL'} (Exposed rate should be >= internal rate)")
    
    return "\n".join(report)
