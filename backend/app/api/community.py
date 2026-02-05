from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import List, Optional
from app.db import get_db
from app.models.community import User, Post as PostModel, Comment as CommentModel, PostVote, CommentVote
from app.schemas.community import (
    Post, PostCreate, PostUpdate, PostSummary, FeedResponse,
    Comment, CommentCreate, CommentUpdate, PostVoteRequest, CommentVoteRequest,
    UserProfile
)
from app.services.auth_service import get_current_active_user, get_optional_current_user

router = APIRouter(prefix="/api/community", tags=["Community"])

# Helper function to get user vote
def get_user_vote(db: Session, post_id: int = None, comment_id: int = None, user_id: int = None):
    """Get user's vote for a post or comment"""
    if post_id:
        vote = db.query(PostVote).filter(
            PostVote.post_id == post_id,
            PostVote.user_id == user_id
        ).first()
    elif comment_id:
        vote = db.query(CommentVote).filter(
            CommentVote.comment_id == comment_id,
            CommentVote.user_id == user_id
        ).first()
    else:
        return None
    
    return vote.vote_type if vote else None

# Posts Endpoints
@router.get("/feed", response_model=FeedResponse)
async def get_feed(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    sort: str = Query("hot", regex="^(hot|new|top)$"),
    symbol: Optional[str] = None,
    community: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Get community feed with posts"""
    query = db.query(PostModel)
    
    # Filter by symbol if provided
    if symbol:
        query = query.filter(PostModel.symbol == symbol)
    
    # Filter by community if provided
    if community:
        query = query.filter(PostModel.community == community)
    
    # Apply sorting
    if sort == "hot":
        # Hot = combination of upvotes and recency
        query = query.order_by(desc(PostModel.is_pinned), desc(PostModel.upvotes - PostModel.downvotes))
    elif sort == "new":
        query = query.order_by(desc(PostModel.is_pinned), desc(PostModel.created_at))
    elif sort == "top":
        query = query.order_by(desc(PostModel.is_pinned), desc(PostModel.upvotes))
    
    # Get total count
    total = query.count()
    
    # Paginate
    posts = query.offset((page - 1) * limit).limit(limit).all()
    
    # Build response with comment counts and user votes
    post_summaries = []
    for post in posts:
        comment_count = db.query(func.count(CommentModel.id)).filter(
            CommentModel.post_id == post.id
        ).scalar()
        
        user_vote = None
        if current_user:
            user_vote = get_user_vote(db, post_id=post.id, user_id=current_user.id)
        
        post_summary = PostSummary(
            id=post.id,
            title=post.title,
            content=post.content[:300] + "..." if len(post.content) > 300 else post.content,
            symbol=post.symbol,
            community=post.community,
            author=post.author,
            views=post.views,
            upvotes=post.upvotes,
            downvotes=post.downvotes,
            comment_count=comment_count,
            is_pinned=post.is_pinned,
            created_at=post.created_at,
            user_vote=user_vote
        )
        post_summaries.append(post_summary)
    
    return FeedResponse(
        posts=post_summaries,
        total=total,
        page=page,
        pages=(total + limit - 1) // limit
    )

@router.post("/posts", response_model=Post, status_code=status.HTTP_201_CREATED)
async def create_post(
    post_data: PostCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new post"""
    db_post = PostModel(
        title=post_data.title,
        content=post_data.content,
        symbol=post_data.symbol,
        author_id=current_user.id
    )
    
    db.add(db_post)
    current_user.reputation += 5  # Award points for creating post
    db.commit()
    db.refresh(db_post)
    
    return Post(
        **db_post.__dict__,
        author=current_user,
        comment_count=0,
        user_vote=None
    )

@router.get("/posts/{post_id}", response_model=Post)
async def get_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Get a single post with details"""
    post = db.query(PostModel).filter(PostModel.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Increment views
    post.views += 1
    db.commit()
    
    # Get comment count
    comment_count = db.query(func.count(CommentModel.id)).filter(
        CommentModel.post_id == post.id
    ).scalar()
    
    # Get user vote
    user_vote = None
    if current_user:
        user_vote = get_user_vote(db, post_id=post.id, user_id=current_user.id)
    
    return Post(
        **post.__dict__,
        author=post.author,
        comment_count=comment_count,
        user_vote=user_vote
    )

@router.put("/posts/{post_id}", response_model=Post)
async def update_post(
    post_id: int,
    post_update: PostUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update a post (only by author)"""
    post = db.query(PostModel).filter(PostModel.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    if post.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this post")
    
    # Update fields
    if post_update.title is not None:
        post.title = post_update.title
    if post_update.content is not None:
        post.content = post_update.content
    if post_update.symbol is not None:
        post.symbol = post_update.symbol
    
    db.commit()
    db.refresh(post)
    
    comment_count = db.query(func.count(CommentModel.id)).filter(
        CommentModel.post_id == post.id
    ).scalar()
    
    user_vote = get_user_vote(db, post_id=post.id, user_id=current_user.id)
    
    return Post(
        **post.__dict__,
        author=post.author,
        comment_count=comment_count,
        user_vote=user_vote
    )

@router.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(
    post_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a post (only by author)"""
    post = db.query(PostModel).filter(PostModel.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    if post.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this post")
    
    db.delete(post)
    db.commit()
    return None

@router.post("/posts/{post_id}/vote")
async def vote_post(
    post_id: int,
    vote_data: PostVoteRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Vote on a post (upvote/downvote/remove vote)"""
    post = db.query(PostModel).filter(PostModel.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Check existing vote
    existing_vote = db.query(PostVote).filter(
        PostVote.post_id == post_id,
        PostVote.user_id == current_user.id
    ).first()
    
    if vote_data.vote_type == 0:
        # Remove vote
        if existing_vote:
            if existing_vote.vote_type == 1:
                post.upvotes -= 1
                post.author.reputation -= 10
            else:
                post.downvotes -= 1
                post.author.reputation += 5
            db.delete(existing_vote)
    else:
        # Add or update vote
        if existing_vote:
            # Update existing vote
            if existing_vote.vote_type != vote_data.vote_type:
                if existing_vote.vote_type == 1:
                    post.upvotes -= 1
                    post.downvotes += 1
                    post.author.reputation -= 15  # Remove upvote rep and add downvote penalty
                else:
                    post.downvotes -= 1
                    post.upvotes += 1
                    post.author.reputation += 15  # Remove downvote penalty and add upvote rep
                existing_vote.vote_type = vote_data.vote_type
        else:
            # Create new vote
            new_vote = PostVote(
                post_id=post_id,
                user_id=current_user.id,
                vote_type=vote_data.vote_type
            )
            db.add(new_vote)
            
            if vote_data.vote_type == 1:
                post.upvotes += 1
                post.author.reputation += 10
            else:
                post.downvotes += 1
                post.author.reputation -= 5
    
    db.commit()
    return {"message": "Vote recorded", "upvotes": post.upvotes, "downvotes": post.downvotes}

# Comments Endpoints
@router.get("/posts/{post_id}/comments", response_model=List[Comment])
async def get_comments(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Get all comments for a post"""
    # Get top-level comments
    comments = db.query(CommentModel).filter(
        CommentModel.post_id == post_id,
        CommentModel.parent_id == None
    ).order_by(desc(CommentModel.upvotes - CommentModel.downvotes)).all()
    
    def build_comment_tree(comment: CommentModel) -> Comment:
        """Recursively build comment tree with replies"""
        replies = db.query(CommentModel).filter(
            CommentModel.parent_id == comment.id
        ).order_by(desc(CommentModel.upvotes - CommentModel.downvotes)).all()
        
        user_vote = None
        if current_user:
            user_vote = get_user_vote(db, comment_id=comment.id, user_id=current_user.id)
        
        return Comment(
            **comment.__dict__,
            author=comment.author,
            replies=[build_comment_tree(reply) for reply in replies],
            user_vote=user_vote
        )
    
    return [build_comment_tree(comment) for comment in comments]

@router.post("/comments", response_model=Comment, status_code=status.HTTP_201_CREATED)
async def create_comment(
    comment_data: CommentCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new comment"""
    # Verify post exists
    post = db.query(PostModel).filter(PostModel.id == comment_data.post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Verify parent comment exists if provided
    if comment_data.parent_id:
        parent = db.query(CommentModel).filter(CommentModel.id == comment_data.parent_id).first()
        if not parent:
            raise HTTPException(status_code=404, detail="Parent comment not found")
    
    db_comment = CommentModel(
        content=comment_data.content,
        post_id=comment_data.post_id,
        author_id=current_user.id,
        parent_id=comment_data.parent_id
    )
    
    db.add(db_comment)
    current_user.reputation += 2  # Award points for commenting
    db.commit()
    db.refresh(db_comment)
    
    return Comment(
        **db_comment.__dict__,
        author=current_user,
        replies=[],
        user_vote=None
    )

@router.put("/comments/{comment_id}", response_model=Comment)
async def update_comment(
    comment_id: int,
    comment_update: CommentUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update a comment (only by author)"""
    comment = db.query(CommentModel).filter(CommentModel.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    if comment.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this comment")
    
    comment.content = comment_update.content
    db.commit()
    db.refresh(comment)
    
    user_vote = get_user_vote(db, comment_id=comment.id, user_id=current_user.id)
    
    return Comment(
        **comment.__dict__,
        author=comment.author,
        replies=[],
        user_vote=user_vote
    )

@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    comment_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a comment (only by author)"""
    comment = db.query(CommentModel).filter(CommentModel.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    if comment.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this comment")
    
    db.delete(comment)
    db.commit()
    return None

@router.post("/comments/{comment_id}/vote")
async def vote_comment(
    comment_id: int,
    vote_data: CommentVoteRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Vote on a comment (upvote/downvote/remove vote)"""
    comment = db.query(CommentModel).filter(CommentModel.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    # Check existing vote
    existing_vote = db.query(CommentVote).filter(
        CommentVote.comment_id == comment_id,
        CommentVote.user_id == current_user.id
    ).first()
    
    if vote_data.vote_type == 0:
        # Remove vote
        if existing_vote:
            if existing_vote.vote_type == 1:
                comment.upvotes -= 1
                comment.author.reputation -= 5
            else:
                comment.downvotes -= 1
                comment.author.reputation += 2
            db.delete(existing_vote)
    else:
        # Add or update vote
        if existing_vote:
            if existing_vote.vote_type != vote_data.vote_type:
                if existing_vote.vote_type == 1:
                    comment.upvotes -= 1
                    comment.downvotes += 1
                    comment.author.reputation -= 7
                else:
                    comment.downvotes -= 1
                    comment.upvotes += 1
                    comment.author.reputation += 7
                existing_vote.vote_type = vote_data.vote_type
        else:
            # Create new vote
            new_vote = CommentVote(
                comment_id=comment_id,
                user_id=current_user.id,
                vote_type=vote_data.vote_type
            )
            db.add(new_vote)
            
            if vote_data.vote_type == 1:
                comment.upvotes += 1
                comment.author.reputation += 5
            else:
                comment.downvotes += 1
                comment.author.reputation -= 2
    
    db.commit()
    return {"message": "Vote recorded", "upvotes": comment.upvotes, "downvotes": comment.downvotes}

# User Profile Endpoint
@router.get("/users/{username}", response_model=UserProfile)
async def get_user_profile(
    username: str,
    db: Session = Depends(get_db)
):
    """Get user profile with stats"""
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    post_count = db.query(func.count(PostModel.id)).filter(PostModel.author_id == user.id).scalar()
    comment_count = db.query(func.count(CommentModel.id)).filter(CommentModel.author_id == user.id).scalar()
    
    # Calculate total upvotes received
    post_upvotes = db.query(func.sum(PostModel.upvotes)).filter(PostModel.author_id == user.id).scalar() or 0
    comment_upvotes = db.query(func.sum(CommentModel.upvotes)).filter(CommentModel.author_id == user.id).scalar() or 0
    total_upvotes = post_upvotes + comment_upvotes
    
    return UserProfile(
        **user.__dict__,
        post_count=post_count,
        comment_count=comment_count,
        total_upvotes=total_upvotes
    )
