import io
import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def generate_framework_evidence_pdf(organization_id: str, controls: list, findings: list) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        textColor=colors.HexColor('#0F3F2E'),
        fontSize=20,
        spaceAfter=10
    )
    
    subtitle_style = ParagraphStyle(
        'SubtitleStyle',
        parent=styles['Heading2'],
        textColor=colors.HexColor('#475569'),
        fontSize=14,
        spaceAfter=20
    )
    
    h3_style = ParagraphStyle(
        'H3Style',
        parent=styles['Heading3'],
        textColor=colors.HexColor('#0F3F2E'),
        fontSize=12,
        spaceAfter=10,
        spaceBefore=20
    )
    
    normal_style = styles['Normal']
    
    elements = []
    
    # Header
    elements.append(Paragraph("CYBERVEST", title_style))
    elements.append(Paragraph("Financial Cyber Risk Intelligence", subtitle_style))
    elements.append(Paragraph("<b>Framework / Evidence Report</b>", normal_style))
    elements.append(Spacer(1, 10))
    
    elements.append(Paragraph(f"<b>Organization:</b> {organization_id}", normal_style))
    elements.append(Paragraph(f"<b>Generated:</b> {datetime.datetime.now(datetime.timezone.utc).isoformat()}", normal_style))
    elements.append(Spacer(1, 20))
    
    # 1. COMPLIANCE OVERVIEW
    elements.append(Paragraph("1. COMPLIANCE OVERVIEW", h3_style))
    
    # Table data
    control_data = [["Framework", "Control Code", "Title", "Status"]]
    for c in controls:
        fw_ctrl = c.get("framework_controls", {}) or {}
        fw = fw_ctrl.get("frameworks", {}) or {}
        control_data.append([
            fw.get("short_name", "N/A") or "N/A",
            fw_ctrl.get("control_code", "N/A") or "N/A",
            Paragraph(fw_ctrl.get("title", "N/A") or "N/A", normal_style),
            c.get("status", "N/A") or "N/A"
        ])
    
    if len(control_data) > 1:
        t = Table(control_data, colWidths=[80, 80, 280, 90])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F8FAFC')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor('#0F3F2E')),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0,0), (-1,0), 10),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ]))
        elements.append(t)
    else:
        elements.append(Paragraph("No controls found.", normal_style))
        
    elements.append(Spacer(1, 20))
    
    # 2. IDENTIFIED FINDINGS
    elements.append(Paragraph("2. IDENTIFIED FINDINGS", h3_style))
    
    findings_data = [["Title", "Severity", "Description", "Status"]]
    for f in findings:
        findings_data.append([
            Paragraph(f.get("title", "N/A") or "N/A", normal_style),
            f.get("severity", "N/A") or "N/A",
            Paragraph(f.get("description", "N/A") or "N/A", normal_style),
            f.get("status", "N/A") or "N/A"
        ])
        
    if len(findings_data) > 1:
        t2 = Table(findings_data, colWidths=[120, 70, 260, 80])
        t2.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F8FAFC')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor('#0F3F2E')),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0,0), (-1,0), 10),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ]))
        elements.append(t2)
    else:
        elements.append(Paragraph("No open findings reported in the current scope.", normal_style))
        
    elements.append(Spacer(1, 30))
    
    # 3. DISCLOSURES & LIMITATIONS
    elements.append(Paragraph("3. DISCLOSURES & LIMITATIONS", h3_style))
    elements.append(Paragraph(
        "This report indicates framework alignment and evidence mapping. It does NOT guarantee regulatory certification.",
        normal_style
    ))
    
    # 4. REPORT METADATA
    elements.append(Spacer(1, 20))
    elements.append(Paragraph("4. REPORT METADATA", h3_style))
    elements.append(Paragraph("Report Type: Framework / Evidence Report", normal_style))
    elements.append(Paragraph(f"Generated Timestamp: {datetime.datetime.now(datetime.timezone.utc).isoformat()}", normal_style))
    
    doc.build(elements)
    
    return buffer.getvalue()
