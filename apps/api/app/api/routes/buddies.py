from fastapi import APIRouter, Depends
from app.core.auth import AuthenticatedUser, get_current_user

router = APIRouter()

MOCK_LEADERBOARD = [
    {"rank": 1, "user_id": "u1", "display_name": "Amirah R.", "avatar_emoji": "👸", "xp": 980, "streak": 14, "is_me": False},
    {"rank": 2, "user_id": "demo", "display_name": "You (Sarah)", "avatar_emoji": "😊", "xp": 420, "streak": 7, "is_me": True},
    {"rank": 3, "user_id": "u3", "display_name": "Hafiz K.", "avatar_emoji": "🧑", "xp": 390, "streak": 5, "is_me": False},
    {"rank": 4, "user_id": "u4", "display_name": "Nurul A.", "avatar_emoji": "👩", "xp": 310, "streak": 3, "is_me": False},
    {"rank": 5, "user_id": "u5", "display_name": "Danial M.", "avatar_emoji": "🧔", "xp": 280, "streak": 2, "is_me": False},
]

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


@router.get("/leaderboard")
async def leaderboard(current_user: AuthenticatedUser = Depends(get_current_user)):
    return MOCK_LEADERBOARD


@router.get("/challenges")
async def challenges(current_user: AuthenticatedUser = Depends(get_current_user)):
    return MOCK_CHALLENGES
