from models.schemas import UserProfile, FormField

FIELD_MAPPING: dict[str, str] = {
    "first name": "_first_name",
    "last name": "_last_name",
    "full name": "_full_name",
    "name": "_full_name",
    "email": "_email",
    "phone": "phone",
    "phone number": "phone",
    "mobile": "phone",
    "city": "location",
    "location": "location",
    "address": "location",
}


def map_profile_to_fields(
    fields: list[FormField],
    profile: UserProfile,
    user_name: str,
    user_email: str,
) -> list[dict]:
    results = []
    name_parts = user_name.split(" ", 1)
    first_name = name_parts[0]
    last_name = name_parts[1] if len(name_parts) > 1 else ""

    special_values = {
        "_first_name": first_name,
        "_last_name": last_name,
        "_full_name": user_name,
        "_email": user_email,
    }

    for field in fields:
        label_lower = field.label.lower().strip()
        value = None

        for keyword, target in FIELD_MAPPING.items():
            if keyword in label_lower:
                if target.startswith("_"):
                    value = special_values.get(target)
                else:
                    value = getattr(profile, target, None)
                break

        if value is not None:
            results.append({"field_id": field.field_id, "value": str(value)})

    return results
