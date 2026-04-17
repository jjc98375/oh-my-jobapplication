import pytest
from services.field_mapper import map_profile_to_fields
from models.schemas import UserProfile, FormField


def test_maps_phone_field():
    profile = UserProfile(phone="555-1234", location="New York, NY")
    fields = [
        FormField(field_id="phone", label="Phone Number", field_type="text"),
        FormField(field_id="city", label="City", field_type="text"),
    ]
    result = map_profile_to_fields(fields, profile, user_name="John Doe", user_email="john@test.com")
    phone_mapping = next(r for r in result if r["field_id"] == "phone")
    assert phone_mapping["value"] == "555-1234"


def test_maps_email_field():
    profile = UserProfile()
    fields = [FormField(field_id="email", label="Email Address", field_type="text")]
    result = map_profile_to_fields(fields, profile, user_name="John Doe", user_email="john@test.com")
    email_mapping = next(r for r in result if r["field_id"] == "email")
    assert email_mapping["value"] == "john@test.com"


def test_unmapped_fields_return_empty():
    profile = UserProfile()
    fields = [FormField(field_id="custom", label="Favorite Color", field_type="text")]
    result = map_profile_to_fields(fields, profile, user_name="Test", user_email="t@t.com")
    assert len(result) == 0
