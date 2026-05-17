from fastapi import APIRouter, Depends
from app.core.auth import AuthenticatedUser, get_optional_user
from app.core.database import get_supabase
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

MOCK_LEADERBOARD = [
    {"rank": 1, "user_id": "u1", "display_name": "Amirah R.", "avatar_emoji": "👸", "xp": 980, "streak": 14, "is_me": False},
    {"rank": 2, "user_id": "demo", "display_name": "You (Sarah)", "avatar_emoji": "😊", "xp": 420, "streak": 7, "is_me": True},
    {"rank": 3, "user_id": "u3", "display_name": "Hafiz K.", "avatar_emoji": "🧑", "xp": 390, "streak": 5, "is_me": False},
    {"rank": 4, "user_id": "u4", "display_name": "Nurul A.", "avatar_emoji": "👩", "xp": 310, "streak": 3, "is_me": False},
    {"rank": 5, "user_id": "u5", "display_name": "Danial M.", "avatar_emoji": "🧔", "xp": 280, "streak": 2, "is_me": False},
]

@router.get("/leaderboard")
async def leaderboard(current_user: AuthenticatedUser | None = Depends(get_optional_user)):
    supabase = get_supabase()
    if not supabase:
        return MOCK_LEADERBOARD

    try:
        # Join user_gamification with profiles to get display names
        res = supabase.table("user_gamification").select(
            "xp, streak_days, user_id, profiles(full_name)"
        ).order("xp", desc=True).limit(10).execute()
        
        if not res.data:
            return MOCK_LEADERBOARD
            
        leaderboard_data = []
        for i, row in enumerate(res.data):
            profile = row.get("profiles", {})
            leaderboard_data.append({
                "rank": i + 1,
                "user_id": row["user_id"],
                "display_name": profile.get("full_name", "Unknown"),
                "avatar_emoji": "👤", # Default emoji as profiles table doesn't have it
                "xp": row["xp"],
                "streak": row["streak_days"],
                "is_me": row["user_id"] == current_user.user_id
            })
        return leaderboard_data
    except Exception as e:
        logger.error(f"Failed to fetch leaderboard from Supabase: {e}")
        return MOCK_LEADERBOARD

MOCK_CHALLENGES = [
    {
        "id": "c1",
        "title": "No Shopee Week",
        "description": "Don't buy anything on Shopee for 7 days",
        "participants": 12,
        "days_left": 3,
        "joined": True,
        "reward_xp": 100,
    },
    {
        "id": "c2",
        "title": "RM50 Food Budget",
        "description": "Keep food spending under RM50 for 3 days",
        "participants": 8,
        "days_left": 5,
        "joined": False,
        "reward_xp": 75,
    },
]

@router.get("/challenges")
async def challenges(current_user: AuthenticatedUser | None = Depends(get_optional_user)):
    return MOCK_CHALLENGES
