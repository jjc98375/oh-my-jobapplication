from fastapi import APIRouter
from models.schemas import ScreeningRequest, ScreeningResponse
from services.question_generator import generate_answers

router = APIRouter()


@router.post("/answer", response_model=ScreeningResponse)
async def answer_screening_questions(request: ScreeningRequest) -> ScreeningResponse:
    answers = await generate_answers(
        job_title=request.job_title,
        company_name=request.company_name,
        job_description=request.job_description,
        questions=request.questions,
        user_profile=request.user_profile,
    )
    return ScreeningResponse(answers=answers)
