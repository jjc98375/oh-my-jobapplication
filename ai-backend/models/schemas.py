from pydantic import BaseModel


class WorkExperience(BaseModel):
    title: str
    company: str
    start_date: str
    end_date: str | None = None
    description: str


class Education(BaseModel):
    school: str
    degree: str
    field: str
    start_date: str
    end_date: str | None = None
    gpa: str | None = None


class SalaryExpectation(BaseModel):
    min: int
    max: int
    currency: str = "USD"


class UserProfile(BaseModel):
    phone: str | None = None
    location: str | None = None
    work_experience: list[WorkExperience] = []
    education: list[Education] = []
    skills: list[str] = []
    work_authorization: str | None = None
    salary_expectation: SalaryExpectation | None = None
    willing_to_relocate: bool = False


class FormField(BaseModel):
    field_id: str
    label: str
    field_type: str  # "text", "textarea", "select", "radio", "checkbox"
    options: list[str] | None = None
    required: bool = False


class ScreeningRequest(BaseModel):
    job_title: str
    company_name: str
    job_description: str
    questions: list[FormField]
    user_profile: UserProfile


class FieldAnswer(BaseModel):
    field_id: str
    answer: str
    source: str  # "profile" or "ai_generated"


class ScreeningResponse(BaseModel):
    answers: list[FieldAnswer]
