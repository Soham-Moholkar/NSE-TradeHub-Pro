from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional, List

# User Schemas
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None

class UserInDB(UserBase):
    id: int
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    reputation: int
    is_active: bool
    is_verified: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class User(UserInDB):
    pass

# Auth Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserInDB

class TokenData(BaseModel):
    username: Optional[str] = None

# Post Schemas
class PostBase(BaseModel):
    title: str = Field(..., min_length=5, max_length=255)
    content: str = Field(..., min_length=10)
    symbol: Optional[str] = None
    community: Optional[str] = None

class PostCreate(PostBase):
    pass

class PostUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=5, max_length=255)
    content: Optional[str] = Field(None, min_length=10)
    symbol: Optional[str] = None
    community: Optional[str] = None

class PostVoteRequest(BaseModel):
    vote_type: int = Field(..., ge=-1, le=1)  # -1, 0, or 1

class PostInDB(PostBase):
    id: int
    author_id: int
    community: Optional[str] = None
    views: int
    upvotes: int
    downvotes: int
    is_pinned: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class Post(PostInDB):
    author: UserInDB
    comment_count: int = 0
    user_vote: Optional[int] = None  # Current user's vote

# Comment Schemas
class CommentBase(BaseModel):
    content: str = Field(..., min_length=1)

class CommentCreate(CommentBase):
    post_id: int
    parent_id: Optional[int] = None

class CommentUpdate(BaseModel):
    content: str = Field(..., min_length=1)

class CommentVoteRequest(BaseModel):
    vote_type: int = Field(..., ge=-1, le=1)  # -1, 0, or 1

class CommentInDB(CommentBase):
    id: int
    post_id: int
    author_id: int
    parent_id: Optional[int] = None
    upvotes: int
    downvotes: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class Comment(CommentInDB):
    author: UserInDB
    replies: List['Comment'] = []
    user_vote: Optional[int] = None  # Current user's vote

# Feed Schemas
class PostSummary(BaseModel):
    id: int
    title: str
    content: str  # Truncated preview
    symbol: Optional[str]
    community: Optional[str]
    author: UserInDB
    views: int
    upvotes: int
    downvotes: int
    comment_count: int
    is_pinned: bool
    created_at: datetime
    user_vote: Optional[int] = None
    
    class Config:
        from_attributes = True

class FeedResponse(BaseModel):
    posts: List[PostSummary]
    total: int
    page: int
    pages: int

# User Profile Schema
class UserProfile(UserInDB):
    post_count: int = 0
    comment_count: int = 0
    total_upvotes: int = 0

# Update forward reference
Comment.model_rebuild()
