import { AuditListResponse } from '../types/api'

export interface AuditFilters {
  page?: number;
  pageSize?: number;
  action?: string;
  resourceType?: string;
}

export async function getAuditActivity(token: string, filters: AuditFilters = {}): Promise<AuditListResponse> {
  const params = new URLSearchParams()
  if (filters.page) params.append('page', filters.page.toString())
  if (filters.pageSize) params.append('page_size', filters.pageSize.toString())
  if (filters.action) params.append('action', filters.action)
  if (filters.resourceType) params.append('resource_type', filters.resourceType)
  
  const res = await fetch(`/api/audit?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
  
  if (!res.ok) {
    if (res.status === 401) throw new Error("UNAUTHORIZED")
    if (res.status === 403) throw new Error("FORBIDDEN")
    throw new Error("Unable to load audit activity.")
  }
  
  return res.json()
}
