from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    email: EmailStr
    name: str | None = None

class UserSignup(BaseModel):
    email: EmailStr
    name: str | None = None
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str
