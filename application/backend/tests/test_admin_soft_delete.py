"""
Unit tests for soft delete functionality.
"""
import pytest
from sqlalchemy.orm import Session
from search.models.user import User
from search.models.tutor_profile import TutorProfile
from admin.services.admin_service import drop_user
from auth.services.auth_service import get_user
from fastapi import HTTPException


def test_create_and_verify_user(test_db: Session, test_user: User):
    """Test: Create test user and verify it exists."""
    # Verify user exists
    found_user = test_db.query(User).filter(User.user_id == test_user.user_id).first()
    assert found_user is not None
    assert found_user.sfsu_email == "test.user@sfsu.edu"
    assert found_user.is_deleted == False


def test_drop_user_sets_is_deleted(test_db: Session, test_user: User):
    """Test: Call drop_user() on test user and verify is_deleted is True."""
    # Drop the user
    result = drop_user(test_db, test_user.user_id)
    
    # Verify response
    assert result["deleted_user_id"] == test_user.user_id
    assert "successfully deleted" in result["message"].lower()
    
    # Refresh and verify is_deleted is True
    test_db.refresh(test_user)
    assert test_user.is_deleted == True


def test_drop_user_preserves_user_in_database(test_db: Session, test_user: User):
    """Test: Verify user still exists in database after soft delete."""
    # Drop the user
    drop_user(test_db, test_user.user_id)
    
    # Verify user still exists in database
    found_user = test_db.query(User).filter(User.user_id == test_user.user_id).first()
    assert found_user is not None
    assert found_user.user_id == test_user.user_id


def test_drop_user_anonymizes_email(test_db: Session, test_user: User):
    """Test: Verify email is anonymized after soft delete."""
    original_email = test_user.sfsu_email
    
    # Drop the user
    drop_user(test_db, test_user.user_id)
    
    # Refresh and verify email is anonymized
    test_db.refresh(test_user)
    assert test_user.sfsu_email != original_email
    assert test_user.sfsu_email.startswith(f"deleted_{test_user.user_id}_")


def test_deleted_user_cannot_login(test_db: Session, test_user: User):
    """Test: Verify user cannot login (via get_user() with is_deleted=False filter)."""
    original_email = test_user.sfsu_email
    
    # Drop the user
    drop_user(test_db, test_user.user_id)
    
    # Try to get user by email - should return None
    found_user = get_user(test_db, original_email)
    assert found_user is None


def test_drop_tutor_user_deactivates_profile(test_db: Session, test_tutor_user: User):
    """Test: If tutor, verify tutor_profile status is 'rejected'."""
    # Verify tutor profile exists and is approved
    tutor_profile = test_db.query(TutorProfile).filter(
        TutorProfile.tutor_id == test_tutor_user.user_id
    ).first()
    assert tutor_profile is not None
    assert tutor_profile.status == "approved"
    
    # Drop the tutor user
    drop_user(test_db, test_tutor_user.user_id)
    
    # Refresh and verify tutor profile status is rejected
    test_db.refresh(tutor_profile)
    assert tutor_profile.status == "rejected"


def test_drop_user_with_role_verification(test_db: Session, test_user: User):
    """Test: Verify role verification works correctly."""
    # Should succeed with correct role
    result = drop_user(test_db, test_user.user_id, role="student")
    assert result["deleted_user_id"] == test_user.user_id
    
    # Should fail with incorrect role (but user is already deleted, so create new one)
    test_user2 = User(
        sfsu_email="test.user2@sfsu.edu",
        first_name="Test",
        last_name="User2",
        role="student",
        password_hash="test_hash",
        is_deleted=False
    )
    test_db.add(test_user2)
    test_db.commit()
    test_db.refresh(test_user2)
    
    # Try to drop with wrong role
    with pytest.raises(HTTPException) as exc_info:
        drop_user(test_db, test_user2.user_id, role="tutor")
    assert exc_info.value.status_code == 400


def test_drop_nonexistent_user(test_db: Session):
    """Test: Verify dropping non-existent user raises 404."""
    with pytest.raises(HTTPException) as exc_info:
        drop_user(test_db, 99999)
    assert exc_info.value.status_code == 404

