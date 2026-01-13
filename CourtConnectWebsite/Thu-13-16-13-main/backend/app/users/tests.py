from django.test import TestCase
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import timedelta
from app.users.models import User, Manager, Session, VerificationToken


class UserManagerTests(TestCase):
    """Test custom UserManager"""

    def test_create_user_success(self):
        """Test creating a regular user"""
        user = User.objects.create_user(
            email='test@example.com',
            name='Test User',
            password='testpass123'
        )
        self.assertEqual(user.email, 'test@example.com')
        self.assertEqual(user.name, 'Test User')
        self.assertTrue(user.check_password('testpass123'))
        self.assertFalse(user.is_admin)
        self.assertFalse(user.is_staff)
        self.assertTrue(user.is_active)

    def test_create_user_normalizes_email(self):
        """Test that email is normalized"""
        user = User.objects.create_user(
            email='TEST@EXAMPLE.COM',
            name='Test User',
            password='testpass123'
        )
        self.assertEqual(user.email, 'TEST@example.com')

    def test_create_user_without_email_raises_error(self):
        """Test creating user without email raises ValueError"""
        with self.assertRaises(ValueError) as context:
            User.objects.create_user(
                email='',
                name='Test User',
                password='testpass123'
            )
        self.assertIn('Email field must be set', str(context.exception))

    def test_create_superuser_success(self):
        """Test creating a superuser"""
        user = User.objects.create_superuser(
            email='admin@example.com',
            name='Admin User',
            password='adminpass123'
        )
        self.assertEqual(user.email, 'admin@example.com')
        self.assertEqual(user.name, 'Admin User')
        self.assertTrue(user.is_admin)
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)

    def test_create_user_with_extra_fields(self):
        """Test creating user with additional fields"""
        user = User.objects.create_user(
            email='test@example.com',
            name='Test User',
            password='testpass123',
            phone_number='0412345678',
            verification_status='verified'
        )
        self.assertEqual(user.phone_number, '0412345678')
        self.assertEqual(user.verification_status, 'verified')


class UserModelTests(TestCase):
    """Test User model"""

    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            name='Test User',
            password='testpass123'
        )

    def test_user_str_representation(self):
        """Test string representation of user"""
        self.assertEqual(str(self.user), 'test@example.com')

    def test_email_is_unique(self):
        """Test that email must be unique"""
        from django.db import IntegrityError
        with self.assertRaises(IntegrityError):
            User.objects.create_user(
                email='test@example.com',
                name='Another User',
                password='testpass123'
            )

    def test_user_default_values(self):
        """Test default values for user fields"""
        self.assertEqual(self.user.verification_status, 'unverified')
        self.assertFalse(self.user.is_admin)
        self.assertFalse(self.user.is_staff)
        self.assertTrue(self.user.is_active)

    def test_is_staff_user_property(self):
        """Test is_staff_user property"""
        # Regular user
        self.assertFalse(self.user.is_staff_user)

        # Admin user
        admin_user = User.objects.create_user(
            email='admin@example.com',
            name='Admin User',
            password='testpass123',
            is_admin=True
        )
        self.assertTrue(admin_user.is_staff_user)

        # Staff user
        staff_user = User.objects.create_user(
            email='staff@example.com',
            name='Staff User',
            password='testpass123',
            is_staff=True
        )
        self.assertTrue(staff_user.is_staff_user)

    def test_user_timestamps(self):
        """Test that timestamps are set correctly"""
        self.assertIsNotNone(self.user.created_at)
        self.assertIsNotNone(self.user.updated_at)
        self.assertIsNotNone(self.user.date_joined)

    def test_password_is_hashed(self):
        """Test that password is hashed, not stored in plaintext"""
        self.assertNotEqual(self.user.password, 'testpass123')
        self.assertTrue(self.user.check_password('testpass123'))


class ManagerModelTests(TestCase):
    """Test Manager model"""

    def setUp(self):
        self.user = User.objects.create_user(
            email='manager@example.com',
            name='Manager User',
            password='testpass123'
        )

    def test_create_manager(self):
        """Test creating a manager"""
        manager = Manager.objects.create(
            user=self.user,
            payment_account_id='acc_123456',
            payment_provider='stripe',
            payout_verification_status='verified'
        )
        self.assertEqual(manager.user, self.user)
        self.assertEqual(manager.payment_account_id, 'acc_123456')
        self.assertEqual(manager.payment_provider, 'stripe')
        self.assertEqual(manager.payout_verification_status, 'verified')

    def test_manager_default_values(self):
        """Test default values for manager"""
        manager = Manager.objects.create(user=self.user)
        self.assertEqual(manager.payout_verification_status, 'unverified')
        self.assertIsNone(manager.payment_account_id)
        self.assertIsNone(manager.payment_provider)

    def test_manager_one_to_one_relationship(self):
        """Test that manager has one-to-one relationship with user"""
        manager = Manager.objects.create(user=self.user)

        # Access manager from user
        self.assertEqual(self.user.manager, manager)

        # Cannot create another manager for same user
        from django.db import IntegrityError
        with self.assertRaises(IntegrityError):
            Manager.objects.create(user=self.user)

    def test_manager_cascade_on_user_delete(self):
        """Test that manager cannot be deleted when user is deleted (RESTRICT)"""
        manager = Manager.objects.create(user=self.user)

        from django.db.models.deletion import RestrictedError
        # This should raise an error because of RESTRICT
        with self.assertRaises(RestrictedError):
            self.user.delete()

    def test_manager_timestamps(self):
        """Test manager timestamps"""
        manager = Manager.objects.create(user=self.user)
        self.assertIsNotNone(manager.created_at)
        self.assertIsNotNone(manager.updated_at)


class SessionModelTests(TestCase):
    """Test Session model"""

    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            name='Test User',
            password='testpass123'
        )

    def test_create_session(self):
        """Test creating a session"""
        expires_at = timezone.now() + timedelta(days=30)
        session = Session.objects.create(
            session_id='session_123',
            user=self.user,
            expires_at=expires_at,
            ip_address='127.0.0.1',
            user_agent='Mozilla/5.0'
        )
        self.assertEqual(session.session_id, 'session_123')
        self.assertEqual(session.user, self.user)
        self.assertEqual(session.ip_address, '127.0.0.1')
        self.assertEqual(session.user_agent, 'Mozilla/5.0')
        self.assertIsNone(session.revoked_at)

    def test_session_unique_id(self):
        """Test that session_id must be unique"""
        expires_at = timezone.now() + timedelta(days=30)
        Session.objects.create(
            session_id='session_123',
            user=self.user,
            expires_at=expires_at
        )

        from django.db import IntegrityError
        with self.assertRaises(IntegrityError):
            Session.objects.create(
                session_id='session_123',
                user=self.user,
                expires_at=expires_at
            )

    def test_session_cascade_on_user_delete(self):
        """Test that sessions are deleted when user is deleted (CASCADE)"""
        expires_at = timezone.now() + timedelta(days=30)
        session = Session.objects.create(
            session_id='session_123',
            user=self.user,
            expires_at=expires_at
        )

        user_id = self.user.user_id
        self.user.delete()

        # Session should be deleted
        self.assertFalse(Session.objects.filter(session_id='session_123').exists())

    def test_revoke_session(self):
        """Test revoking a session"""
        expires_at = timezone.now() + timedelta(days=30)
        session = Session.objects.create(
            session_id='session_123',
            user=self.user,
            expires_at=expires_at
        )

        # Revoke session
        session.revoked_at = timezone.now()
        session.save()

        self.assertIsNotNone(session.revoked_at)


class VerificationTokenModelTests(TestCase):
    """Test VerificationToken model"""

    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            name='Test User',
            password='testpass123'
        )

    def test_create_verification_token(self):
        """Test creating a verification token"""
        expires_at = timezone.now() + timedelta(hours=24)
        token = VerificationToken.objects.create(
            token_id='token_123',
            user=self.user,
            token_type='email_verify',
            expires_at=expires_at
        )
        self.assertEqual(token.token_id, 'token_123')
        self.assertEqual(token.user, self.user)
        self.assertEqual(token.token_type, 'email_verify')
        self.assertFalse(token.used)
        self.assertIsNone(token.used_at)

    def test_verification_token_default_type(self):
        """Test default token type"""
        expires_at = timezone.now() + timedelta(hours=24)
        token = VerificationToken.objects.create(
            token_id='token_123',
            user=self.user,
            expires_at=expires_at
        )
        self.assertEqual(token.token_type, 'email_verify')

    def test_mark_token_as_used(self):
        """Test marking token as used"""
        expires_at = timezone.now() + timedelta(hours=24)
        token = VerificationToken.objects.create(
            token_id='token_123',
            user=self.user,
            expires_at=expires_at
        )

        # Mark as used
        token.used = True
        token.used_at = timezone.now()
        token.save()

        self.assertTrue(token.used)
        self.assertIsNotNone(token.used_at)

    def test_token_unique_id(self):
        """Test that token_id must be unique"""
        expires_at = timezone.now() + timedelta(hours=24)
        VerificationToken.objects.create(
            token_id='token_123',
            user=self.user,
            expires_at=expires_at
        )

        from django.db import IntegrityError
        with self.assertRaises(IntegrityError):
            VerificationToken.objects.create(
                token_id='token_123',
                user=self.user,
                expires_at=expires_at
            )

    def test_token_cascade_on_user_delete(self):
        """Test that tokens are deleted when user is deleted (CASCADE)"""
        expires_at = timezone.now() + timedelta(hours=24)
        token = VerificationToken.objects.create(
            token_id='token_123',
            user=self.user,
            expires_at=expires_at
        )

        self.user.delete()

        # Token should be deleted
        self.assertFalse(VerificationToken.objects.filter(token_id='token_123').exists())

    def test_multiple_tokens_per_user(self):
        """Test that a user can have multiple tokens"""
        expires_at = timezone.now() + timedelta(hours=24)

        token1 = VerificationToken.objects.create(
            token_id='token_1',
            user=self.user,
            token_type='email_verify',
            expires_at=expires_at
        )

        token2 = VerificationToken.objects.create(
            token_id='token_2',
            user=self.user,
            token_type='password_reset',
            expires_at=expires_at
        )

        self.assertEqual(VerificationToken.objects.filter(user=self.user).count(), 2)
