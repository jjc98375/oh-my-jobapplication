from fastapi import APIRouter
from pydantic import BaseModel
from models.schemas import UserProfile, FormField
from services.field_mapper import map_profile_to_fields

router = APIRouter()


class MappingRequest(BaseModel):
    fields: list[FormField]
    user_profile: UserProfile
    user_name: str
    user_email: str


class MappingResponse(BaseModel):
    mappings: list[dict]


@router.post("/fields", response_model=MappingResponse)
async def map_fields(request: MappingRequest) -> MappingResponse:
    mappings = map_profile_to_fields(
        fields=request.fields,
        profile=request.user_profile,
        user_name=request.user_name,
        user_email=request.user_email,
    )
    return MappingResponse(mappings=mappings)
