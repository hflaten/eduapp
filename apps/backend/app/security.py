from passlib.context import CryptContext

# Argon2 is a modern, memory-hard password hashing algorithm.
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

def hash_password(plain: str) -> str:
    """Return an Argon2 hash for the given plaintext password."""
    return pwd_context.hash(plain)

def verify_password(plain: str, hashed: str) -> bool:
    """Return True if `plain` matches the Argon2 `hashed` value."""
    return pwd_context.verify(plain, hashed)
