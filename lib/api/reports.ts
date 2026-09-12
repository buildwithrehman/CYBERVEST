import { ReportRequest, ReportResponse } from '../types/api'

export async function generateReport(token: string, request: ReportRequest): Promise<ReportResponse> {
  const res = await fetch('/api/reports/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(request)
  })
  
  if (!res.ok) {
    let errorMsg = "Unable to generate this report.";
    try {
      const errData = await res.json();
      if (errData.detail) errorMsg = errData.detail;
    } catch (e) {
      // Ignore
    }
    throw new Error(errorMsg)
  }
  
  return res.json()
}

export async function downloadReportPdf(token: string, request: ReportRequest): Promise<Blob> {
  const res = await fetch('/api/reports/pdf', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(request)
  })
  
  if (!res.ok) {
    let errorMsg = "Unable to generate PDF. Please try again.";
    try {
      const errData = await res.json();
      if (errData.detail) errorMsg = errData.detail;
    } catch (e) {
      // Ignore
    }
    throw new Error(errorMsg)
  }
  
  return res.blob();
}
