import pytest
from unittest.mock import patch, AsyncMock
from httpx import AsyncClient, ASGITransport
from main import app
from models.schemas import ScreeningRequest, UserProfile, FormField


@pytest.fixture
def sample_request() -> dict:
    return ScreeningRequest(
        job_title="Software Engineer",
        company_name="Acme Corp",
        job_description="We are looking for a software engineer with Python and React experience.",
        questions=[
            FormField(field_id="q1", label="Why do you want to work at Acme Corp?", field_type="textarea", required=True),
            FormField(field_id="q2", label="Years of experience", field_type="text", required=True),
            FormField(field_id="q3", label="Work Authorization", field_type="select", options=["US Citizen", "Green Card", "H1B", "Other"], required=True),
        ],
        user_profile=UserProfile(
            work_experience=[{"title": "Senior Developer", "company": "BigTech Inc", "start_date": "2020-01", "end_date": None, "description": "Built Python microservices and React dashboards"}],
            skills=["Python", "React", "TypeScript"],
            work_authorization="US Citizen",
        ),
    ).model_dump()


@pytest.mark.asyncio
async def test_health():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}


@pytest.mark.asyncio
@patch("routers.screening.generate_answers")
async def test_screening_answer(mock_generate: AsyncMock, sample_request: dict):
    mock_generate.return_value = [
        {"field_id": "q1", "answer": "I am excited about Acme Corp because...", "source": "ai_generated"},
        {"field_id": "q2", "answer": "5", "source": "profile"},
        {"field_id": "q3", "answer": "US Citizen", "source": "profile"},
    ]

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post("/screening/answer", json=sample_request)

    assert res.status_code == 200
    data = res.json()
    assert len(data["answers"]) == 3
    assert data["answers"][0]["source"] == "ai_generated"
    assert data["answers"][2]["answer"] == "US Citizen"
