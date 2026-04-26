from __future__ import annotations

import time
from dataclasses import dataclass

import jwt

from .settings import settings


@dataclass(frozen=True)
class TokenClaims:
    sub: str
    role: str
    institution_id: str | None
    student_profile_id: str | None


def create_access_token(*, user_id: str, role: str, institution_id: str | None, student_profile_id: str | None) -> str:
    now = int(time.time())
    payload = {
        "iss": settings.jwt_issuer,
        "aud": settings.jwt_audience,
        "iat": now,
        "exp": now + 60 * 60 * 12,
        "sub": user_id,
        "role": role,
        "institution_id": institution_id,
        "student_profile_id": student_profile_id,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def decode_token(token: str) -> TokenClaims:
    payload = jwt.decode(
        token,
        settings.jwt_secret,
        algorithms=["HS256"],
        audience=settings.jwt_audience,
        issuer=settings.jwt_issuer,
    )
    return TokenClaims(
        sub=str(payload["sub"]),
        role=str(payload["role"]),
        institution_id=payload.get("institution_id"),
        student_profile_id=payload.get("student_profile_id"),
    )

