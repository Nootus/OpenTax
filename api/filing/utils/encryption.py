"""Encryption utilities stub for OpenTax.

In the full platform the PAN is stored encrypted; for the open-source
ITR-1 project we keep PANs in plain text, so decrypt_pan is a no-op.
"""


def decrypt_pan(value: str) -> str:
    """Return the PAN value as-is (no encryption in OpenTax)."""
    return value
