import os
from anthropic import AsyncAnthropic
from models.schemas import UserProfile, FormField, FieldAnswer


client = AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY", ""))

PROFILE_MAPPED_KEYWORDS = {
    "work authorization": "work_authorization",
    "authorized to work": "work_authorization",
    "salary": "salary_expectation",
    "compensation": "salary_expectation",
    "relocate": "willing_to_relocate",
    "relocation": "willing_to_relocate",
    "phone": "phone",
    "location": "location",
}


def try_profile_answer(question: FormField, profile: UserProfile) -> str | None:
    label_lower = question.label.lower()

    for keyword, field in PROFILE_MAPPED_KEYWORDS.items():
        if keyword in label_lower:
            value = getattr(profile, field, None)
            if value is None:
                continue
            if isinstance(value, bool):
                return "Yes" if value else "No"
            if field == "salary_expectation" and value:
                return f"{value.min}-{value.max} {value.currency}"
            return str(value)

    if "years" in label_lower and "experience" in label_lower:
        if profile.work_experience:
            from datetime import datetime
            total_years = 0
            for exp in profile.work_experience:
                try:
                    start = datetime.strptime(exp.start_date, "%Y-%m")
                    end = datetime.now() if not exp.end_date else datetime.strptime(exp.end_date, "%Y-%m")
                    total_years += (end - start).days / 365
                except ValueError:
                    continue
            return str(round(total_years))

    if question.options and profile.work_authorization:
        for option in question.options:
            if profile.work_authorization.lower() in option.lower():
                return option

    return None


async def generate_answers(
    job_title: str,
    company_name: str,
    job_description: str,
    questions: list[FormField],
    profile: UserProfile,
) -> list[FieldAnswer]:
    answers: list[FieldAnswer] = []
    ai_questions: list[FormField] = []

    for q in questions:
        profile_answer = try_profile_answer(q, profile)
        if profile_answer:
            answers.append(FieldAnswer(field_id=q.field_id, answer=profile_answer, source="profile"))
        else:
            ai_questions.append(q)

    if ai_questions:
        profile_summary = _build_profile_summary(profile)
        questions_text = "\n".join(
            f"- Question ID: {q.field_id}\n  Label: {q.label}\n  Type: {q.field_type}"
            + (f"\n  Options: {', '.join(q.options)}" if q.options else "")
            for q in ai_questions
        )

        prompt = f"""You are filling out a job application. Answer each screening question based on the candidate's profile and the job description.

JOB: {job_title} at {company_name}
JOB DESCRIPTION: {job_description}

CANDIDATE PROFILE:
{profile_summary}

QUESTIONS:
{questions_text}

For each question, provide a concise, professional answer. For select/radio questions, choose the best matching option.

Respond in this exact format for each question (one per line):
FIELD_ID|ANSWER

Example:
q1|I am excited about this role because my 5 years of Python experience align perfectly with your needs.
q2|React"""

        message = await client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}],
        )

        response_text = message.content[0].text
        for line in response_text.strip().split("\n"):
            if "|" in line:
                field_id, answer = line.split("|", 1)
                field_id = field_id.strip()
                if any(q.field_id == field_id for q in ai_questions):
                    answers.append(FieldAnswer(field_id=field_id, answer=answer.strip(), source="ai_generated"))

    return answers


def _build_profile_summary(profile: UserProfile) -> str:
    parts = []
    if profile.skills:
        parts.append(f"Skills: {', '.join(profile.skills)}")
    if profile.location:
        parts.append(f"Location: {profile.location}")
    for exp in profile.work_experience:
        duration = f"{exp.start_date} - {exp.end_date or 'present'}"
        parts.append(f"Experience: {exp.title} at {exp.company} ({duration}): {exp.description}")
    for edu in profile.education:
        parts.append(f"Education: {edu.degree} in {edu.field} from {edu.school}")
    return "\n".join(parts) if parts else "No profile details provided."
