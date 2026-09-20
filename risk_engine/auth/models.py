from pydantic import BaseModel
from typing import Optional

class AuthenticatedUser(BaseModel):
    user_id: str
    email: str
    organization_id: str
    role: str
    token: str = ""

class Role:
    ADMIN = "ADMIN"
    CISO = "CISO"
    SECURITY_ANALYST = "SECURITY_ANALYST"
    RISK_MANAGER = "RISK_MANAGER"
    EXECUTIVE = "EXECUTIVE"
    AUDITOR = "AUDITOR"

    @classmethod
    def get_all(cls):
        return [cls.ADMIN, cls.CISO, cls.SECURITY_ANALYST, cls.RISK_MANAGER, cls.EXECUTIVE, cls.AUDITOR]
