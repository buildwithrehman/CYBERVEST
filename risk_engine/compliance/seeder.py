import os
from supabase import create_client

def get_supabase_client():
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    return create_client(url, key)

def seed_frameworks():
    client = get_supabase_client()
    
    frameworks = [
        {
            "name": "RBI Master Direction on IT Governance, Risk, Controls and Assurance Practices",
            "short_name": "RBI IT Governance 2023",
            "version": "2023",
            "description": "Comprehensive IT and cyber risk framework for Banks and NBFCs.",
            "source_url": "https://www.rbi.org.in/",
            "effective_date": "2024-04-01",
            "jurisdiction": "India"
        },
        {
            "name": "SEBI Cybersecurity and Cyber Resilience Framework (CSCRF)",
            "short_name": "SEBI CSCRF 2024",
            "version": "August 2024",
            "description": "Unified cyber resilience standard for SEBI regulated entities.",
            "source_url": "https://www.sebi.gov.in/",
            "effective_date": "2024-08-20",
            "jurisdiction": "India"
        },
        {
            "name": "NIST Cybersecurity Framework",
            "short_name": "NIST CSF 2.0",
            "version": "2.0",
            "description": "Framework for Improving Critical Infrastructure Cybersecurity.",
            "source_url": "https://www.nist.gov/cyberframework",
            "effective_date": "2024-02-26",
            "jurisdiction": "Global"
        },
        {
            "name": "ISO/IEC 27001",
            "short_name": "ISO 27001:2022",
            "version": "2022",
            "description": "Information security management systems requirements.",
            "source_url": "https://www.iso.org/standard/27001",
            "effective_date": "2022-10-01",
            "jurisdiction": "Global"
        },
        {
            "name": "CIS Critical Security Controls",
            "short_name": "CIS v8",
            "version": "8.0",
            "description": "Prescriptive, prioritized set of cybersecurity best practices.",
            "source_url": "https://www.cisecurity.org/controls/",
            "effective_date": "2021-05-18",
            "jurisdiction": "Global"
        }
    ]
    
    # Upsert Frameworks
    framework_ids = {}
    for fw in frameworks:
        # Check if exists
        existing = client.table("frameworks").select("id").eq("short_name", fw["short_name"]).execute()
        if existing.data:
            framework_ids[fw["short_name"]] = existing.data[0]["id"]
        else:
            res = client.table("frameworks").insert(fw).execute()
            framework_ids[fw["short_name"]] = res.data[0]["id"]

    return framework_ids

def seed_controls(framework_ids):
    client = get_supabase_client()
    
    # SEBI CSCRF Controls
    sebi_id = framework_ids["SEBI CSCRF 2024"]
    sebi_controls = [
        {
            "framework_id": sebi_id,
            "control_code": "SEBI-GOV-1",
            "title": "Board-level Cybersecurity Committee",
            "description": "Mandates board-level oversight and formation of a cybersecurity committee.",
            "category": "Governance",
            "mandatory": True,
            "source_reference": "SEBI/HO/ITD-1/ITD_CSC_EXT/P/CIR/2024/113 Part 1"
        },
        {
            "framework_id": sebi_id,
            "control_code": "SEBI-ID-1",
            "title": "Comprehensive Asset Inventory",
            "description": "Maintain inventory of critical and non-critical assets with data classification.",
            "category": "Identify",
            "mandatory": True,
            "source_reference": "SEBI CSCRF Identify Phase"
        },
        {
            "framework_id": sebi_id,
            "control_code": "SEBI-PR-1",
            "title": "API Security & Data Localization",
            "description": "Implement API security and ensure data localization requirements are met.",
            "category": "Protect",
            "mandatory": True,
            "source_reference": "SEBI CSCRF Protect Phase"
        },
        {
            "framework_id": sebi_id,
            "control_code": "SEBI-RES-1",
            "title": "6-Hour Incident Reporting",
            "description": "Mandatory incident reporting to SEBI Cybercell within 6 hours of detection.",
            "category": "Respond",
            "mandatory": True,
            "source_reference": "SEBI CSCRF Respond Phase"
        }
    ]
    
    # RBI Controls
    rbi_id = framework_ids["RBI IT Governance 2023"]
    rbi_controls = [
        {
            "framework_id": rbi_id,
            "control_code": "RBI-ITG-1",
            "title": "IT Strategy Committee (ITSC)",
            "description": "Board-level ITSC with at least 3 directors to oversee IT strategy and cyber risk.",
            "category": "IT Governance",
            "mandatory": True,
            "source_reference": "RBI Master Direction 2023, Chapter II"
        },
        {
            "framework_id": rbi_id,
            "control_code": "RBI-RM-1",
            "title": "Annual IT Risk Assessment",
            "description": "Entities must conduct annual IT risk assessments and define a formal IT risk appetite.",
            "category": "Risk Management",
            "mandatory": True,
            "source_reference": "RBI Master Direction 2023, Chapter IV"
        },
        {
            "framework_id": rbi_id,
            "control_code": "RBI-INC-1",
            "title": "6-Hour Cyber Incident Reporting",
            "description": "Report cyber incidents to RBI within 6 hours, root-cause within 21 days.",
            "category": "Information Security",
            "mandatory": True,
            "source_reference": "RBI Master Direction 2023, Chapter V"
        }
    ]
    
    # NIST CSF 2.0 Controls
    nist_id = framework_ids["NIST CSF 2.0"]
    nist_controls = [
        {
            "framework_id": nist_id,
            "control_code": "GV.OC-01",
            "title": "Organizational cybersecurity policy is established",
            "description": "Organizational cybersecurity policy is established, communicated, and enforced.",
            "category": "GOVERN",
            "mandatory": False,
            "source_reference": "NIST CSF 2.0 GV.OC-01"
        },
        {
            "framework_id": nist_id,
            "control_code": "RS.MA-04",
            "title": "Cybersecurity incidents are reported",
            "description": "Cybersecurity incidents are reported to internal and external stakeholders as required.",
            "category": "RESPOND",
            "mandatory": False,
            "source_reference": "NIST CSF 2.0 RS.MA-04"
        }
    ]
    
    all_controls = sebi_controls + rbi_controls + nist_controls
    
    control_ids = {}
    for c in all_controls:
        # Check if exists
        existing = client.table("framework_controls").select("id").eq("framework_id", c["framework_id"]).eq("control_code", c["control_code"]).execute()
        if existing.data:
            control_ids[c["control_code"]] = existing.data[0]["id"]
        else:
            res = client.table("framework_controls").insert(c).execute()
            control_ids[c["control_code"]] = res.data[0]["id"]
            
    return control_ids

def seed_mappings(framework_ids, control_ids):
    client = get_supabase_client()
    
    mappings = [
        {
            "source_framework_id": framework_ids["SEBI CSCRF 2024"],
            "source_control_id": control_ids["SEBI-RES-1"],
            "target_framework_id": framework_ids["RBI IT Governance 2023"],
            "target_control_id": control_ids["RBI-INC-1"],
            "mapping_type": "equivalent",
            "mapping_confidence": "high",
            "mapping_basis": "Both explicitly mandate 6-hour reporting window to respective regulators."
        },
        {
            "source_framework_id": framework_ids["SEBI CSCRF 2024"],
            "source_control_id": control_ids["SEBI-RES-1"],
            "target_framework_id": framework_ids["NIST CSF 2.0"],
            "target_control_id": control_ids["RS.MA-04"],
            "mapping_type": "supports",
            "mapping_confidence": "high",
            "mapping_basis": "SEBI requirement is a specific regulatory instantiation of the NIST reporting principle."
        }
    ]
    
    for m in mappings:
        try:
            client.table("control_mappings").insert(m).execute()
        except Exception as e:
            pass # Probably unique constraint violation if run twice, which is fine.

if __name__ == "__main__":
    f_ids = seed_frameworks()
    c_ids = seed_controls(f_ids)
    seed_mappings(f_ids, c_ids)
    print("Seeding complete.")
