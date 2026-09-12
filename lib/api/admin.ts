import { OrganizationMember, RoleUpdateRequest, RoleUpdateResponse, RoleListResponse } from '../types/api'

export async function getOrganizationMembers(token: string): Promise<RoleListResponse> {
  const res = await fetch('/api/admin/roles', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
  
  if (!res.ok) {
    if (res.status === 401) throw new Error("UNAUTHORIZED")
    if (res.status === 403) throw new Error("FORBIDDEN")
    throw new Error("Unable to load organization access data.")
  }
  
  return res.json()
}

export async function assignRole(token: string, payload: RoleUpdateRequest): Promise<RoleUpdateResponse> {
  const res = await fetch('/api/admin/roles', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  })
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || "Failed to update role")
  }
  
  return res.json()
}
