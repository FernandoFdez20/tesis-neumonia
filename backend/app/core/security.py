import base64
import hashlib
import hmac
import json
from datetime import datetime, timedelta, timezone

from app.core.config import settings


def _base64url_encode(raw_bytes: bytes) -> str:
    # JWT usa Base64 URL-safe sin padding '='
    return base64.urlsafe_b64encode(raw_bytes).decode("utf-8").rstrip("=")


def _base64url_decode(raw_text: str) -> bytes:
    # Restauramos padding para poder decodificar Base64 URL-safe
    padding = "=" * (-len(raw_text) % 4)
    return base64.urlsafe_b64decode(raw_text + padding)


def create_access_token(payload: dict) -> str:
    # Construimos un JWT simple HS256 para autenticacion inicial
    header = {"alg": "HS256", "typ": "JWT"}
    token_payload = payload.copy()

    expire_at = datetime.now(timezone.utc) + timedelta(
        minutes=settings.JWT_EXPIRE_MINUTES
    )
    token_payload["exp"] = int(expire_at.timestamp())

    encoded_header = _base64url_encode(
        json.dumps(header, separators=(",", ":")).encode("utf-8")
    )
    encoded_payload = _base64url_encode(
        json.dumps(token_payload, separators=(",", ":")).encode("utf-8")
    )

    signing_input = f"{encoded_header}.{encoded_payload}".encode("utf-8")
    signature = hmac.new(
        settings.JWT_SECRET_KEY.encode("utf-8"),
        signing_input,
        hashlib.sha256,
    ).digest()

    encoded_signature = _base64url_encode(signature)
    return f"{encoded_header}.{encoded_payload}.{encoded_signature}"


def decode_access_token(token: str):
    # Valida firma y expiracion del JWT; retorna payload si es valido
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None

        encoded_header, encoded_payload, encoded_signature = parts
        signing_input = f"{encoded_header}.{encoded_payload}".encode("utf-8")

        expected_signature = hmac.new(
            settings.JWT_SECRET_KEY.encode("utf-8"),
            signing_input,
            hashlib.sha256,
        ).digest()
        expected_signature_text = _base64url_encode(expected_signature)

        if not hmac.compare_digest(expected_signature_text, encoded_signature):
            return None

        payload_text = _base64url_decode(encoded_payload).decode("utf-8")
        payload = json.loads(payload_text)

        exp = payload.get("exp")
        if exp is None:
            return None

        now_ts = int(datetime.now(timezone.utc).timestamp())
        if now_ts >= int(exp):
            return None

        return payload
    except Exception:
        return None
