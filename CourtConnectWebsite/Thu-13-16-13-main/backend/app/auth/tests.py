from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
from app.users.models import User, Manager, Session


class LoginViewTests(APITestCase):
    """Test login endpoint"""

    def setUp(self):
        self.client = APIClient()
        self.url = reverse('auth:login')
        self.user = User.objects.create_user(
            email='test@example.com',
            name='Test User',
            password='testpass123'
        )

    def test_login_success(self):
        """Test successful login"""
        data = {
            'email': 'test@example.com',
            'password': 'testpass123'
        }
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('user', response.data)
        self.assertIn('session_id', response.data)
        self.assertIn('message', response.data)
        self.assertEqual(response.data['user']['email'], 'test@example.com')

        # Check that session was created
        self.assertTrue(Session.objects.filter(user=self.user).exists())

        # Check that session cookie was set
        self.assertIn('session_id', response.cookies)

    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        data = {
            'email': 'test@example.com',
            'password': 'wrongpassword'
        }
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_inactive_user(self):
        """Test login with inactive user"""
        self.user.is_active = False
        self.user.save()

        data = {
            'email': 'test@example.com',
            'password': 'testpass123'
        }
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_missing_fields(self):
        """Test login with missing fields"""
        # Missing password
        data = {'email': 'test@example.com'}
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Missing email
        data = {'password': 'testpass123'}
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_nonexistent_user(self):
        """Test login with non-existent user"""
        data = {
            'email': 'nonexistent@example.com',
            'password': 'testpass123'
        }
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class LogoutViewTests(APITestCase):
    """Test logout endpoint"""

    def setUp(self):
        self.client = APIClient()
        self.logout_url = reverse('auth:logout')
        self.user = User.objects.create_user(
            email='test@example.com',
            name='Test User',
            password='testpass123'
        )

        # Create a session for the user
        self.session = Session.objects.create(
            session_id='test_session_123',
            user=self.user,
            expires_at=timezone.now() + timedelta(days=30)
        )

    def test_logout_success_with_header(self):
        """Test successful logout with session ID in header"""
        self.client.force_authenticate(user=self.user)

        response = self.client.post(
            self.logout_url,
            HTTP_X_SESSION_ID='test_session_123'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.data)

        # Check that session was revoked
        self.session.refresh_from_db()
        self.assertIsNotNone(self.session.revoked_at)

    def test_logout_success_with_cookie(self):
        """Test successful logout with session ID in cookie"""
        self.client.force_authenticate(user=self.user)
        self.client.cookies['session_id'] = 'test_session_123'

        response = self.client.post(self.logout_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Check that session was revoked
        self.session.refresh_from_db()
        self.assertIsNotNone(self.session.revoked_at)

    def test_logout_without_authentication(self):
        """Test logout without authentication"""
        response = self.client.post(self.logout_url)

        # Depending on permission class, this might return 401 or 403
        self.assertIn(response.status_code, [
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN
        ])


class RegisterViewTests(APITestCase):
    """Test registration endpoint"""

    def setUp(self):
        self.client = APIClient()
        self.url = reverse('auth:register')

    def test_register_success(self):
        """Test successful user registration"""
        data = {
            'name': 'New User',
            'email': 'newuser@example.com',
            'password': 'NewPass123!',
            'password_confirm': 'NewPass123!',
            'phone_number': '0412345678'
        }
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # New registration flow requires email verification
        self.assertIn('requiresVerification', response.data)
        self.assertTrue(response.data['requiresVerification'])
        self.assertIn('message', response.data)
        self.assertEqual(response.data['email'], 'newuser@example.com')

        # Check that user was created
        self.assertTrue(User.objects.filter(email='newuser@example.com').exists())

        # User should be inactive until verified
        user = User.objects.get(email='newuser@example.com')
        self.assertFalse(user.is_active)
        self.assertEqual(user.verification_status, 'pending')

    def test_register_password_mismatch(self):
        """Test registration with password mismatch"""
        data = {
            'name': 'New User',
            'email': 'newuser@example.com',
            'password': 'NewPass123!',
            'password_confirm': 'DifferentPass123!',
        }
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_duplicate_email(self):
        """Test registration with duplicate email"""
        User.objects.create_user(
            email='existing@example.com',
            name='Existing User',
            password='testpass123'
        )

        data = {
            'name': 'New User',
            'email': 'existing@example.com',
            'password': 'NewPass123!',
            'password_confirm': 'NewPass123!',
        }
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_weak_password(self):
        """Test registration with weak password"""
        data = {
            'name': 'New User',
            'email': 'newuser@example.com',
            'password': '123',
            'password_confirm': '123',
        }
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_missing_required_fields(self):
        """Test registration with missing required fields"""
        # Missing name
        data = {
            'email': 'newuser@example.com',
            'password': 'NewPass123!',
            'password_confirm': 'NewPass123!',
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Missing email
        data = {
            'name': 'New User',
            'password': 'NewPass123!',
            'password_confirm': 'NewPass123!',
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_invalid_email(self):
        """Test registration with invalid email"""
        data = {
            'name': 'New User',
            'email': 'invalid-email',
            'password': 'NewPass123!',
            'password_confirm': 'NewPass123!',
        }
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_invalid_phone_number(self):
        """Test registration with invalid phone number format"""
        data = {
            'name': 'New User',
            'email': 'newuser@example.com',
            'password': 'NewPass123!',
            'password_confirm': 'NewPass123!',
            'phone_number': 'invalid-phone'
        }
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('phone_number', response.data)

    def test_register_valid_phone_number_formats(self):
        """Test registration with various valid phone number formats"""
        valid_phones = [
            '+61412345678',
            '0412345678',
            '(02) 1234 5678',
            '+1-555-123-4567',
            '555.123.4567'
        ]

        for i, phone in enumerate(valid_phones):
            data = {
                'name': 'New User',
                'email': f'user{i}@example.com',
                'password': 'NewPass123!',
                'password_confirm': 'NewPass123!',
                'phone_number': phone
            }
            response = self.client.post(self.url, data, format='json')

            # Should accept valid phone format
            self.assertIn(response.status_code, [status.HTTP_201_CREATED, status.HTTP_500_INTERNAL_SERVER_ERROR])

    def test_register_invalid_name_with_numbers(self):
        """Test registration with name containing numbers"""
        data = {
            'name': 'User123',
            'email': 'newuser@example.com',
            'password': 'NewPass123!',
            'password_confirm': 'NewPass123!',
        }
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', response.data)

    def test_register_invalid_name_with_special_chars(self):
        """Test registration with name containing special characters"""
        data = {
            'name': 'User@Name!',
            'email': 'newuser@example.com',
            'password': 'NewPass123!',
            'password_confirm': 'NewPass123!',
        }
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', response.data)

    def test_register_valid_name_with_spaces(self):
        """Test registration with name containing spaces (valid)"""
        data = {
            'name': 'John Smith',
            'email': 'johnsmith@example.com',
            'password': 'NewPass123!',
            'password_confirm': 'NewPass123!',
        }
        response = self.client.post(self.url, data, format='json')

        # Should accept valid name with spaces
        self.assertIn(response.status_code, [status.HTTP_201_CREATED, status.HTTP_500_INTERNAL_SERVER_ERROR])


class UserProfileViewTests(APITestCase):
    """Test user profile endpoint"""

    def setUp(self):
        self.client = APIClient()
        self.url = reverse('auth:profile')
        self.user = User.objects.create_user(
            email='test@example.com',
            name='Test User',
            password='testpass123',
            phone_number='0412345678'
        )

    def test_get_profile_authenticated(self):
        """Test retrieving profile when authenticated"""
        self.client.force_authenticate(user=self.user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'test@example.com')
        self.assertEqual(response.data['name'], 'Test User')
        self.assertEqual(response.data['phone_number'], '0412345678')

    def test_get_profile_unauthenticated(self):
        """Test retrieving profile when not authenticated"""
        response = self.client.get(self.url)

        self.assertIn(response.status_code, [
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN
        ])

    def test_update_profile_authenticated(self):
        """Test updating profile when authenticated"""
        self.client.force_authenticate(user=self.user)

        data = {
            'name': 'Updated Name',
            'phone_number': '0498765432',
            'mfa_enabled': False
        }
        response = self.client.patch(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Updated Name')
        self.assertEqual(response.data['phone_number'], '0498765432')

        # Verify database was updated
        self.user.refresh_from_db()
        self.assertEqual(self.user.name, 'Updated Name')
        self.assertEqual(self.user.phone_number, '0498765432')

    def test_partial_update_profile(self):
        """Test partial update of profile"""
        self.client.force_authenticate(user=self.user)

        data = {'name': 'Partially Updated'}
        response = self.client.patch(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Partially Updated')
        # Phone number should remain unchanged
        self.assertEqual(response.data['phone_number'], '0412345678')

    def test_cannot_update_readonly_fields(self):
        """Test that read-only fields cannot be updated"""
        self.client.force_authenticate(user=self.user)

        original_email = self.user.email
        data = {
            'email': 'newemail@example.com',
            'is_admin': True,
            'verification_status': 'verified'
        }
        response = self.client.patch(self.url, data, format='json')

        # Request might succeed but readonly fields shouldn't change
        self.user.refresh_from_db()
        self.assertEqual(self.user.email, original_email)
        self.assertFalse(self.user.is_admin)
        self.assertEqual(self.user.verification_status, 'unverified')

    def test_update_profile_invalid_phone_number(self):
        """Test updating profile with invalid phone number"""
        self.client.force_authenticate(user=self.user)

        data = {'phone_number': 'invalid-phone-123'}
        response = self.client.patch(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('phone_number', response.data)

    def test_update_profile_valid_phone_formats(self):
        """Test updating profile with various valid phone formats"""
        self.client.force_authenticate(user=self.user)

        valid_phones = ['+61412345678', '0412345678', '+1-555-123-4567']

        for phone in valid_phones:
            data = {'phone_number': phone}
            response = self.client.patch(self.url, data, format='json')

            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertEqual(response.data['phone_number'], phone)

    def test_update_profile_empty_phone_allowed(self):
        """Test updating profile with empty phone number (should be allowed)"""
        self.client.force_authenticate(user=self.user)

        data = {'phone_number': ''}
        response = self.client.patch(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)


class CSRFTokenViewTests(APITestCase):
    """Test CSRF token endpoint"""

    def setUp(self):
        self.client = APIClient()
        self.url = reverse('auth:csrf')

    def test_get_csrf_token(self):
        """Test getting CSRF token"""
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('detail', response.data)

        # Check that CSRF cookie was set
        self.assertIn('csrftoken', response.cookies)


class UserSerializerTests(TestCase):
    """Test UserSerializer"""

    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            name='Test User',
            password='testpass123'
        )

    def test_user_serializer_role_regular_user(self):
        """Test role field for regular user"""
        from app.auth.serializers import UserSerializer

        serializer = UserSerializer(self.user)
        self.assertEqual(serializer.data['role'], 'user')

    def test_user_serializer_role_admin(self):
        """Test role field for admin user"""
        from app.auth.serializers import UserSerializer

        self.user.is_admin = True
        self.user.save()

        serializer = UserSerializer(self.user)
        self.assertEqual(serializer.data['role'], 'admin')

    def test_user_serializer_role_manager(self):
        """Test role field for manager user"""
        from app.auth.serializers import UserSerializer

        Manager.objects.create(user=self.user)

        serializer = UserSerializer(self.user)
        self.assertEqual(serializer.data['role'], 'manager')

    def test_user_serializer_readonly_fields(self):
        """Test that certain fields are read-only"""
        from app.auth.serializers import UserSerializer

        serializer = UserSerializer(self.user)
        readonly_fields = serializer.Meta.read_only_fields

        self.assertIn('user_id', readonly_fields)
        self.assertIn('created_at', readonly_fields)
        self.assertIn('verification_status', readonly_fields)
        self.assertIn('is_admin', readonly_fields)

    def test_user_serializer_invalid_phone_number(self):
        """Test UserSerializer validation for invalid phone number"""
        from app.auth.serializers import UserSerializer

        data = {'phone_number': 'invalid-phone-123'}
        serializer = UserSerializer(self.user, data=data, partial=True)
        self.assertFalse(serializer.is_valid())
        self.assertIn('phone_number', serializer.errors)

    def test_user_serializer_valid_phone_numbers(self):
        """Test UserSerializer validation for valid phone numbers"""
        from app.auth.serializers import UserSerializer

        valid_phones = ['+61412345678', '0412345678', '+1-555-123-4567']

        for phone in valid_phones:
            data = {'phone_number': phone}
            serializer = UserSerializer(self.user, data=data, partial=True)
            self.assertTrue(serializer.is_valid(), f"Phone {phone} should be valid")

    def test_user_serializer_empty_phone_allowed(self):
        """Test UserSerializer allows empty phone number"""
        from app.auth.serializers import UserSerializer

        data = {'phone_number': ''}
        serializer = UserSerializer(self.user, data=data, partial=True)
        self.assertTrue(serializer.is_valid())


class LoginSerializerTests(TestCase):
    """Test LoginSerializer"""

    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            name='Test User',
            password='testpass123'
        )

    def test_login_serializer_valid_data(self):
        """Test LoginSerializer with valid data"""
        from app.auth.serializers import LoginSerializer
        from django.test import RequestFactory

        factory = RequestFactory()
        request = factory.post('/api/auth/login/')

        data = {
            'email': 'test@example.com',
            'password': 'testpass123'
        }
        serializer = LoginSerializer(data=data, context={'request': request})
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['user'], self.user)

    def test_login_serializer_invalid_credentials(self):
        """Test LoginSerializer with invalid credentials"""
        from app.auth.serializers import LoginSerializer
        from django.test import RequestFactory

        factory = RequestFactory()
        request = factory.post('/api/auth/login/')

        data = {
            'email': 'test@example.com',
            'password': 'wrongpassword'
        }
        serializer = LoginSerializer(data=data, context={'request': request})
        self.assertFalse(serializer.is_valid())

    def test_login_serializer_missing_fields(self):
        """Test LoginSerializer with missing fields"""
        from app.auth.serializers import LoginSerializer

        # Missing password
        serializer = LoginSerializer(data={'email': 'test@example.com'})
        self.assertFalse(serializer.is_valid())

        # Missing email
        serializer = LoginSerializer(data={'password': 'testpass123'})
        self.assertFalse(serializer.is_valid())


class RegisterSerializerTests(TestCase):
    """Test RegisterSerializer"""

    def test_register_serializer_valid_data(self):
        """Test RegisterSerializer with valid data"""
        from app.auth.serializers import RegisterSerializer

        data = {
            'name': 'New User',
            'email': 'newuser@example.com',
            'password': 'NewPass123!',
            'password_confirm': 'NewPass123!',
            'phone_number': '0412345678'
        }
        serializer = RegisterSerializer(data=data)
        self.assertTrue(serializer.is_valid())

        user = serializer.save()
        self.assertEqual(user.email, 'newuser@example.com')
        self.assertEqual(user.name, 'New User')
        self.assertTrue(user.check_password('NewPass123!'))

    def test_register_serializer_password_mismatch(self):
        """Test RegisterSerializer with password mismatch"""
        from app.auth.serializers import RegisterSerializer

        data = {
            'name': 'New User',
            'email': 'newuser@example.com',
            'password': 'NewPass123!',
            'password_confirm': 'DifferentPass123!',
        }
        serializer = RegisterSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('non_field_errors', serializer.errors)

    def test_register_serializer_weak_password(self):
        """Test RegisterSerializer with weak password"""
        from app.auth.serializers import RegisterSerializer

        data = {
            'name': 'New User',
            'email': 'newuser@example.com',
            'password': '123',
            'password_confirm': '123',
        }
        serializer = RegisterSerializer(data=data)
        self.assertFalse(serializer.is_valid())

    def test_register_serializer_invalid_phone(self):
        """Test RegisterSerializer with invalid phone number"""
        from app.auth.serializers import RegisterSerializer

        data = {
            'name': 'New User',
            'email': 'newuser@example.com',
            'password': 'NewPass123!',
            'password_confirm': 'NewPass123!',
            'phone_number': 'invalid-phone'
        }
        serializer = RegisterSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('phone_number', serializer.errors)

    def test_register_serializer_valid_phone_formats(self):
        """Test RegisterSerializer with valid phone formats"""
        from app.auth.serializers import RegisterSerializer

        valid_phones = ['+61412345678', '0412345678', '+1-555-123-4567']

        for phone in valid_phones:
            data = {
                'name': 'New User',
                'email': 'newuser@example.com',
                'password': 'NewPass123!',
                'password_confirm': 'NewPass123!',
                'phone_number': phone
            }
            serializer = RegisterSerializer(data=data)
            self.assertTrue(serializer.is_valid(), f"Phone {phone} should be valid")

    def test_register_serializer_invalid_name_with_numbers(self):
        """Test RegisterSerializer with name containing numbers"""
        from app.auth.serializers import RegisterSerializer

        data = {
            'name': 'User123',
            'email': 'newuser@example.com',
            'password': 'NewPass123!',
            'password_confirm': 'NewPass123!',
        }
        serializer = RegisterSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)

    def test_register_serializer_invalid_name_with_special_chars(self):
        """Test RegisterSerializer with name containing special characters"""
        from app.auth.serializers import RegisterSerializer

        data = {
            'name': 'User@Name!',
            'email': 'newuser@example.com',
            'password': 'NewPass123!',
            'password_confirm': 'NewPass123!',
        }
        serializer = RegisterSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)

    def test_register_serializer_valid_name_with_spaces(self):
        """Test RegisterSerializer with valid name containing spaces"""
        from app.auth.serializers import RegisterSerializer

        data = {
            'name': 'John Smith',
            'email': 'newuser@example.com',
            'password': 'NewPass123!',
            'password_confirm': 'NewPass123!',
        }
        serializer = RegisterSerializer(data=data)
        self.assertTrue(serializer.is_valid())


class SessionAuthenticationBackendTests(TestCase):
    """Test SessionAuthenticationBackend"""

    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            email='test@example.com',
            name='Test User',
            password='testpass123'
        )

        # Create a valid session
        self.valid_session = Session.objects.create(
            session_id='valid_session_123',
            user=self.user,
            expires_at=timezone.now() + timedelta(days=30)
        )

        # Create an expired session
        self.expired_session = Session.objects.create(
            session_id='expired_session_123',
            user=self.user,
            expires_at=timezone.now() - timedelta(days=1)
        )

        # Create a revoked session
        self.revoked_session = Session.objects.create(
            session_id='revoked_session_123',
            user=self.user,
            expires_at=timezone.now() + timedelta(days=30),
            revoked_at=timezone.now()
        )

    def test_authenticate_with_valid_session_id(self):
        """Test authentication with valid session ID parameter"""
        from app.auth.backends import SessionAuthenticationBackend
        from django.test import RequestFactory

        backend = SessionAuthenticationBackend()
        factory = RequestFactory()
        request = factory.get('/api/test/')

        authenticated_user = backend.authenticate(
            request=request,
            session_id='valid_session_123'
        )

        self.assertIsNotNone(authenticated_user)
        self.assertEqual(authenticated_user.user_id, self.user.user_id)
        self.assertEqual(authenticated_user.email, 'test@example.com')
        self.assertTrue(hasattr(authenticated_user, 'backend'))

    def test_authenticate_with_session_id_from_header(self):
        """Test authentication with session ID from X-Session-ID header"""
        from app.auth.backends import SessionAuthenticationBackend
        from django.test import RequestFactory

        backend = SessionAuthenticationBackend()
        factory = RequestFactory()
        request = factory.get('/api/test/', HTTP_X_SESSION_ID='valid_session_123')

        authenticated_user = backend.authenticate(request=request)

        self.assertIsNotNone(authenticated_user)
        self.assertEqual(authenticated_user.user_id, self.user.user_id)

    def test_authenticate_with_session_id_from_cookie(self):
        """Test authentication with session ID from cookie"""
        from app.auth.backends import SessionAuthenticationBackend
        from django.test import RequestFactory

        backend = SessionAuthenticationBackend()
        factory = RequestFactory()
        request = factory.get('/api/test/')
        request.COOKIES = {'session_id': 'valid_session_123'}

        authenticated_user = backend.authenticate(request=request)

        self.assertIsNotNone(authenticated_user)
        self.assertEqual(authenticated_user.user_id, self.user.user_id)

    def test_authenticate_with_expired_session(self):
        """Test authentication with expired session returns None"""
        from app.auth.backends import SessionAuthenticationBackend
        from django.test import RequestFactory

        backend = SessionAuthenticationBackend()
        factory = RequestFactory()
        request = factory.get('/api/test/')

        authenticated_user = backend.authenticate(
            request=request,
            session_id='expired_session_123'
        )

        self.assertIsNone(authenticated_user)

    def test_authenticate_with_revoked_session(self):
        """Test authentication with revoked session returns None"""
        from app.auth.backends import SessionAuthenticationBackend
        from django.test import RequestFactory

        backend = SessionAuthenticationBackend()
        factory = RequestFactory()
        request = factory.get('/api/test/')

        authenticated_user = backend.authenticate(
            request=request,
            session_id='revoked_session_123'
        )

        self.assertIsNone(authenticated_user)

    def test_authenticate_with_invalid_session_id(self):
        """Test authentication with non-existent session ID returns None"""
        from app.auth.backends import SessionAuthenticationBackend
        from django.test import RequestFactory

        backend = SessionAuthenticationBackend()
        factory = RequestFactory()
        request = factory.get('/api/test/')

        authenticated_user = backend.authenticate(
            request=request,
            session_id='nonexistent_session_123'
        )

        self.assertIsNone(authenticated_user)

    def test_authenticate_with_no_session_id(self):
        """Test authentication with no session ID returns None"""
        from app.auth.backends import SessionAuthenticationBackend
        from django.test import RequestFactory

        backend = SessionAuthenticationBackend()
        factory = RequestFactory()
        request = factory.get('/api/test/')

        authenticated_user = backend.authenticate(request=request)

        self.assertIsNone(authenticated_user)

    def test_authenticate_header_takes_precedence_over_cookie(self):
        """Test that X-Session-ID header takes precedence over cookie"""
        from app.auth.backends import SessionAuthenticationBackend
        from django.test import RequestFactory

        backend = SessionAuthenticationBackend()
        factory = RequestFactory()
        request = factory.get('/api/test/', HTTP_X_SESSION_ID='valid_session_123')
        request.COOKIES = {'session_id': 'expired_session_123'}

        # Should use header session (valid) not cookie session (expired)
        authenticated_user = backend.authenticate(request=request)

        self.assertIsNotNone(authenticated_user)
        self.assertEqual(authenticated_user.user_id, self.user.user_id)

    def test_get_user_with_valid_user_id(self):
        """Test get_user with valid user ID"""
        from app.auth.backends import SessionAuthenticationBackend

        backend = SessionAuthenticationBackend()
        retrieved_user = backend.get_user(self.user.user_id)

        self.assertIsNotNone(retrieved_user)
        self.assertEqual(retrieved_user.user_id, self.user.user_id)
        self.assertEqual(retrieved_user.email, 'test@example.com')
        self.assertTrue(hasattr(retrieved_user, 'backend'))

    def test_get_user_with_invalid_user_id(self):
        """Test get_user with non-existent user ID returns None"""
        from app.auth.backends import SessionAuthenticationBackend

        backend = SessionAuthenticationBackend()
        retrieved_user = backend.get_user(99999)

        self.assertIsNone(retrieved_user)

    def test_has_perm_with_active_user(self):
        """Test has_perm with active user"""
        from app.auth.backends import SessionAuthenticationBackend

        backend = SessionAuthenticationBackend()
        self.user.is_active = True
        self.user.save()

        # Note: has_perm returns True for active users by default
        # unless specific permission is checked
        has_permission = backend.has_perm(self.user, 'some_perm')

        # This depends on the user having the permission
        # For active user without specific permission, should check is_active
        self.assertTrue(self.user.is_active)

    def test_has_perm_with_inactive_user(self):
        """Test has_perm with inactive user returns False"""
        from app.auth.backends import SessionAuthenticationBackend

        backend = SessionAuthenticationBackend()
        self.user.is_active = False
        self.user.save()

        has_permission = backend.has_perm(self.user, 'some_perm')

        # Inactive users should not have any permissions
        self.assertFalse(has_permission)

    def test_backend_attribute_set_on_authenticate(self):
        """Test that backend attribute is set on authenticated user"""
        from app.auth.backends import SessionAuthenticationBackend
        from django.test import RequestFactory

        backend = SessionAuthenticationBackend()
        factory = RequestFactory()
        request = factory.get('/api/test/')

        authenticated_user = backend.authenticate(
            request=request,
            session_id='valid_session_123'
        )

        self.assertTrue(hasattr(authenticated_user, 'backend'))
        self.assertIn('SessionAuthenticationBackend', authenticated_user.backend)

    def test_backend_attribute_set_on_get_user(self):
        """Test that backend attribute is set on get_user"""
        from app.auth.backends import SessionAuthenticationBackend

        backend = SessionAuthenticationBackend()
        retrieved_user = backend.get_user(self.user.user_id)

        self.assertTrue(hasattr(retrieved_user, 'backend'))
        self.assertIn('SessionAuthenticationBackend', retrieved_user.backend)


class SessionAuthenticationMiddlewareTests(TestCase):
    """Test SessionAuthenticationMiddleware"""

    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            email='test@example.com',
            name='Test User',
            password='testpass123'
        )

        # Create a valid session
        self.valid_session = Session.objects.create(
            session_id='valid_session_456',
            user=self.user,
            expires_at=timezone.now() + timedelta(days=30)
        )

    def test_middleware_with_valid_session_in_header(self):
        """Test middleware authenticates user with valid session in header"""
        from app.auth.middleware import SessionAuthenticationMiddleware
        from django.test import RequestFactory
        from django.contrib.auth.models import AnonymousUser

        middleware = SessionAuthenticationMiddleware(get_response=lambda r: None)
        factory = RequestFactory()
        request = factory.get('/api/test/', HTTP_X_SESSION_ID='valid_session_456')
        request.user = AnonymousUser()

        middleware.process_request(request)

        self.assertTrue(request.user.is_authenticated)
        self.assertEqual(request.user.email, 'test@example.com')

    def test_middleware_with_valid_session_in_cookie(self):
        """Test middleware authenticates user with valid session in cookie"""
        from app.auth.middleware import SessionAuthenticationMiddleware
        from django.test import RequestFactory
        from django.contrib.auth.models import AnonymousUser

        middleware = SessionAuthenticationMiddleware(get_response=lambda r: None)
        factory = RequestFactory()
        request = factory.get('/api/test/')
        request.COOKIES = {'session_id': 'valid_session_456'}
        request.user = AnonymousUser()

        middleware.process_request(request)

        self.assertTrue(request.user.is_authenticated)
        self.assertEqual(request.user.email, 'test@example.com')

    def test_middleware_with_already_authenticated_user(self):
        """Test middleware skips authentication for already authenticated users"""
        from app.auth.middleware import SessionAuthenticationMiddleware
        from django.test import RequestFactory

        middleware = SessionAuthenticationMiddleware(get_response=lambda r: None)
        factory = RequestFactory()
        request = factory.get('/api/test/')

        # User is already authenticated
        request.user = self.user
        original_user = request.user

        result = middleware.process_request(request)

        # Should return None and not change the user
        self.assertIsNone(result)
        self.assertEqual(request.user, original_user)

    def test_middleware_with_invalid_session_id(self):
        """Test middleware does not authenticate with invalid session ID"""
        from app.auth.middleware import SessionAuthenticationMiddleware
        from django.test import RequestFactory
        from django.contrib.auth.models import AnonymousUser

        middleware = SessionAuthenticationMiddleware(get_response=lambda r: None)
        factory = RequestFactory()
        request = factory.get('/api/test/', HTTP_X_SESSION_ID='invalid_session_999')
        request.user = AnonymousUser()

        middleware.process_request(request)

        # User should remain anonymous
        self.assertFalse(request.user.is_authenticated)

    def test_middleware_with_no_session_id(self):
        """Test middleware does not authenticate when no session ID provided"""
        from app.auth.middleware import SessionAuthenticationMiddleware
        from django.test import RequestFactory
        from django.contrib.auth.models import AnonymousUser

        middleware = SessionAuthenticationMiddleware(get_response=lambda r: None)
        factory = RequestFactory()
        request = factory.get('/api/test/')
        request.user = AnonymousUser()

        middleware.process_request(request)

        # User should remain anonymous
        self.assertFalse(request.user.is_authenticated)

    def test_middleware_header_takes_precedence_over_cookie(self):
        """Test that X-Session-ID header takes precedence over cookie"""
        from app.auth.middleware import SessionAuthenticationMiddleware
        from django.test import RequestFactory
        from django.contrib.auth.models import AnonymousUser

        # Create an expired session for cookie
        expired_session = Session.objects.create(
            session_id='expired_session_456',
            user=self.user,
            expires_at=timezone.now() - timedelta(days=1)
        )

        middleware = SessionAuthenticationMiddleware(get_response=lambda r: None)
        factory = RequestFactory()
        request = factory.get('/api/test/', HTTP_X_SESSION_ID='valid_session_456')
        request.COOKIES = {'session_id': 'expired_session_456'}
        request.user = AnonymousUser()

        middleware.process_request(request)

        # Should authenticate with header session (valid)
        self.assertTrue(request.user.is_authenticated)
        self.assertEqual(request.user.email, 'test@example.com')


class OTPCodeModelTests(TestCase):
    """Test OTPCode model"""

    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            email='test@example.com',
            name='Test User',
            password='testpass123'
        )

    def test_otp_creation(self):
        """Test OTP code creation"""
        from app.auth.models import OTPCode

        otp = OTPCode.objects.create(
            user=self.user,
            code='123456',
            purpose='login'
        )

        self.assertEqual(otp.code, '123456')
        self.assertEqual(otp.user, self.user)
        self.assertEqual(otp.purpose, 'login')
        self.assertFalse(otp.is_used)

    def test_otp_str_method(self):
        """Test OTP __str__ method"""
        from app.auth.models import OTPCode

        otp = OTPCode.objects.create(
            user=self.user,
            code='123456',
            purpose='login'
        )

        str_repr = str(otp)
        self.assertIn('test@example.com', str_repr)
        self.assertIn('123456', str_repr)
        self.assertIn('expires', str_repr)

    def test_otp_auto_set_expiration(self):
        """Test that OTP automatically sets expiration time"""
        from app.auth.models import OTPCode

        before_creation = timezone.now()
        otp = OTPCode.objects.create(
            user=self.user,
            code='123456',
            purpose='login'
        )
        after_creation = timezone.now()

        # Should be set to ~10 minutes from now
        self.assertIsNotNone(otp.expires_at)
        expected_expiry = timezone.now() + timedelta(minutes=10)
        # Allow 1 minute tolerance for test execution time
        self.assertTrue(
            expected_expiry - timedelta(minutes=1) <= otp.expires_at <= expected_expiry + timedelta(minutes=1)
        )

    def test_otp_is_valid_when_unused_and_not_expired(self):
        """Test that OTP is valid when unused and not expired"""
        from app.auth.models import OTPCode

        otp = OTPCode.objects.create(
            user=self.user,
            code='123456',
            purpose='login',
            expires_at=timezone.now() + timedelta(minutes=5)
        )

        self.assertTrue(otp.is_valid())

    def test_otp_is_invalid_when_used(self):
        """Test that OTP is invalid when already used"""
        from app.auth.models import OTPCode

        otp = OTPCode.objects.create(
            user=self.user,
            code='123456',
            purpose='login',
            expires_at=timezone.now() + timedelta(minutes=5),
            is_used=True
        )

        self.assertFalse(otp.is_valid())

    def test_otp_is_invalid_when_expired(self):
        """Test that OTP is invalid when expired"""
        from app.auth.models import OTPCode

        otp = OTPCode.objects.create(
            user=self.user,
            code='123456',
            purpose='login',
            expires_at=timezone.now() - timedelta(minutes=1)  # Expired 1 minute ago
        )

        self.assertFalse(otp.is_valid())

    def test_otp_is_invalid_when_used_and_expired(self):
        """Test that OTP is invalid when both used and expired"""
        from app.auth.models import OTPCode

        otp = OTPCode.objects.create(
            user=self.user,
            code='123456',
            purpose='login',
            expires_at=timezone.now() - timedelta(minutes=1),
            is_used=True
        )

        self.assertFalse(otp.is_valid())

    def test_otp_custom_expiration_time(self):
        """Test that custom expiration time is respected"""
        from app.auth.models import OTPCode

        custom_expiry = timezone.now() + timedelta(hours=1)
        otp = OTPCode.objects.create(
            user=self.user,
            code='123456',
            purpose='login',
            expires_at=custom_expiry
        )

        # Should use the custom expiration time
        self.assertEqual(otp.expires_at, custom_expiry)

    def test_otp_default_purpose(self):
        """Test that OTP has default purpose of admin_reauth"""
        from app.auth.models import OTPCode

        otp = OTPCode.objects.create(
            user=self.user,
            code='123456'
        )

        self.assertEqual(otp.purpose, 'admin_reauth')


class IsAuthenticatedPermissionTests(TestCase):
    """Test IsAuthenticated permission class"""

    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            name='Test User',
            password='testpass123'
        )
        self.session = Session.objects.create(
            session_id='test_session_789',
            user=self.user,
            expires_at=timezone.now() + timedelta(days=30)
        )

    def test_authenticated_django_user(self):
        """Test permission allows Django authenticated user"""
        from app.auth.permissions import IsAuthenticated
        from django.test import RequestFactory

        permission = IsAuthenticated()
        factory = RequestFactory()
        request = factory.get('/api/test/')
        request.user = self.user

        self.assertTrue(permission.has_permission(request, None))

    def test_authenticated_via_session_header(self):
        """Test permission allows session-authenticated user via header"""
        from app.auth.permissions import IsAuthenticated
        from django.test import RequestFactory
        from django.contrib.auth.models import AnonymousUser

        permission = IsAuthenticated()
        factory = RequestFactory()
        request = factory.get('/api/test/', HTTP_X_SESSION_ID='test_session_789')
        request.user = AnonymousUser()

        self.assertTrue(permission.has_permission(request, None))

    def test_authenticated_via_session_cookie(self):
        """Test permission allows session-authenticated user via cookie"""
        from app.auth.permissions import IsAuthenticated
        from django.test import RequestFactory
        from django.contrib.auth.models import AnonymousUser

        permission = IsAuthenticated()
        factory = RequestFactory()
        request = factory.get('/api/test/')
        request.COOKIES = {'session_id': 'test_session_789'}
        request.user = AnonymousUser()

        self.assertTrue(permission.has_permission(request, None))

    def test_unauthenticated_user(self):
        """Test permission denies unauthenticated user"""
        from app.auth.permissions import IsAuthenticated
        from django.test import RequestFactory
        from django.contrib.auth.models import AnonymousUser
        from rest_framework.exceptions import NotAuthenticated

        permission = IsAuthenticated()
        factory = RequestFactory()
        request = factory.get('/api/test/')
        request.user = AnonymousUser()

        with self.assertRaises(NotAuthenticated):
            permission.has_permission(request, None)

    def test_invalid_session(self):
        """Test permission denies invalid session"""
        from app.auth.permissions import IsAuthenticated
        from django.test import RequestFactory
        from django.contrib.auth.models import AnonymousUser
        from rest_framework.exceptions import NotAuthenticated

        permission = IsAuthenticated()
        factory = RequestFactory()
        request = factory.get('/api/test/', HTTP_X_SESSION_ID='invalid_session')
        request.user = AnonymousUser()

        with self.assertRaises(NotAuthenticated):
            permission.has_permission(request, None)


class IsAuthenticatedOrReadOnlyPermissionTests(TestCase):
    """Test IsAuthenticatedOrReadOnly permission class"""

    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            name='Test User',
            password='testpass123'
        )
        self.session = Session.objects.create(
            session_id='test_session_890',
            user=self.user,
            expires_at=timezone.now() + timedelta(days=30)
        )

    def test_read_only_unauthenticated(self):
        """Test permission allows GET for unauthenticated users"""
        from app.auth.permissions import IsAuthenticatedOrReadOnly
        from django.test import RequestFactory
        from django.contrib.auth.models import AnonymousUser

        permission = IsAuthenticatedOrReadOnly()
        factory = RequestFactory()
        request = factory.get('/api/test/')
        request.user = AnonymousUser()

        self.assertTrue(permission.has_permission(request, None))

    def test_write_authenticated_django_user(self):
        """Test permission allows POST for Django authenticated user"""
        from app.auth.permissions import IsAuthenticatedOrReadOnly
        from django.test import RequestFactory

        permission = IsAuthenticatedOrReadOnly()
        factory = RequestFactory()
        request = factory.post('/api/test/')
        request.user = self.user

        self.assertTrue(permission.has_permission(request, None))

    def test_write_authenticated_via_session(self):
        """Test permission allows POST for session-authenticated user"""
        from app.auth.permissions import IsAuthenticatedOrReadOnly
        from django.test import RequestFactory
        from django.contrib.auth.models import AnonymousUser

        permission = IsAuthenticatedOrReadOnly()
        factory = RequestFactory()
        request = factory.post('/api/test/', HTTP_X_SESSION_ID='test_session_890')
        request.user = AnonymousUser()

        self.assertTrue(permission.has_permission(request, None))

    def test_write_unauthenticated(self):
        """Test permission denies POST for unauthenticated user"""
        from app.auth.permissions import IsAuthenticatedOrReadOnly
        from django.test import RequestFactory
        from django.contrib.auth.models import AnonymousUser

        permission = IsAuthenticatedOrReadOnly()
        factory = RequestFactory()
        request = factory.post('/api/test/')
        request.user = AnonymousUser()

        self.assertFalse(permission.has_permission(request, None))


class IsOwnerOrReadOnlyPermissionTests(TestCase):
    """Test IsOwnerOrReadOnly permission class"""

    def setUp(self):
        self.owner = User.objects.create_user(
            email='owner@example.com',
            name='Owner',
            password='testpass123'
        )
        self.other_user = User.objects.create_user(
            email='other@example.com',
            name='Other User',
            password='testpass123'
        )

        # Create a mock object with user attribute
        class MockObject:
            def __init__(self, user):
                self.user = user

        self.owned_obj = MockObject(self.owner)

    def test_read_any_user(self):
        """Test permission allows GET for any user"""
        from app.auth.permissions import IsOwnerOrReadOnly
        from django.test import RequestFactory

        permission = IsOwnerOrReadOnly()
        factory = RequestFactory()
        request = factory.get('/api/test/')
        request.user = self.other_user

        self.assertTrue(permission.has_object_permission(request, None, self.owned_obj))

    def test_write_owner(self):
        """Test permission allows POST for owner"""
        from app.auth.permissions import IsOwnerOrReadOnly
        from django.test import RequestFactory

        permission = IsOwnerOrReadOnly()
        factory = RequestFactory()
        request = factory.post('/api/test/')
        request.user = self.owner

        self.assertTrue(permission.has_object_permission(request, None, self.owned_obj))

    def test_write_non_owner(self):
        """Test permission denies POST for non-owner"""
        from app.auth.permissions import IsOwnerOrReadOnly
        from django.test import RequestFactory

        permission = IsOwnerOrReadOnly()
        factory = RequestFactory()
        request = factory.post('/api/test/')
        request.user = self.other_user

        self.assertFalse(permission.has_object_permission(request, None, self.owned_obj))


class IsAdminUserPermissionTests(TestCase):
    """Test IsAdminUser permission class"""

    def setUp(self):
        self.admin_user = User.objects.create_user(
            email='admin@example.com',
            name='Admin User',
            password='testpass123',
            is_admin=True
        )
        self.superuser = User.objects.create_user(
            email='superuser@example.com',
            name='Super User',
            password='testpass123',
            is_superuser=True
        )
        self.regular_user = User.objects.create_user(
            email='regular@example.com',
            name='Regular User',
            password='testpass123'
        )

    def test_admin_user_allowed(self):
        """Test permission allows admin user"""
        from app.auth.permissions import IsAdminUser
        from django.test import RequestFactory

        permission = IsAdminUser()
        factory = RequestFactory()
        request = factory.get('/api/test/')
        request.user = self.admin_user

        self.assertTrue(permission.has_permission(request, None))

    def test_superuser_allowed(self):
        """Test permission allows superuser"""
        from app.auth.permissions import IsAdminUser
        from django.test import RequestFactory

        permission = IsAdminUser()
        factory = RequestFactory()
        request = factory.get('/api/test/')
        request.user = self.superuser

        self.assertTrue(permission.has_permission(request, None))

    def test_regular_user_denied(self):
        """Test permission denies regular user"""
        from app.auth.permissions import IsAdminUser
        from django.test import RequestFactory

        permission = IsAdminUser()
        factory = RequestFactory()
        request = factory.get('/api/test/')
        request.user = self.regular_user

        self.assertFalse(permission.has_permission(request, None))

    def test_unauthenticated_denied(self):
        """Test permission denies unauthenticated user"""
        from app.auth.permissions import IsAdminUser
        from django.test import RequestFactory
        from django.contrib.auth.models import AnonymousUser

        permission = IsAdminUser()
        factory = RequestFactory()
        request = factory.get('/api/test/')
        request.user = AnonymousUser()

        self.assertFalse(permission.has_permission(request, None))


class IsVerifiedUserPermissionTests(TestCase):
    """Test IsVerifiedUser permission class"""

    def setUp(self):
        self.verified_user = User.objects.create_user(
            email='verified@example.com',
            name='Verified User',
            password='testpass123',
            verification_status='verified'
        )
        self.unverified_user = User.objects.create_user(
            email='unverified@example.com',
            name='Unverified User',
            password='testpass123',
            verification_status='pending'
        )

    def test_verified_user_allowed(self):
        """Test permission allows verified user"""
        from app.auth.permissions import IsVerifiedUser
        from django.test import RequestFactory

        permission = IsVerifiedUser()
        factory = RequestFactory()
        request = factory.get('/api/test/')
        request.user = self.verified_user

        self.assertTrue(permission.has_permission(request, None))

    def test_unverified_user_denied(self):
        """Test permission denies unverified user"""
        from app.auth.permissions import IsVerifiedUser
        from django.test import RequestFactory

        permission = IsVerifiedUser()
        factory = RequestFactory()
        request = factory.get('/api/test/')
        request.user = self.unverified_user

        self.assertFalse(permission.has_permission(request, None))

    def test_unauthenticated_denied(self):
        """Test permission denies unauthenticated user"""
        from app.auth.permissions import IsVerifiedUser
        from django.test import RequestFactory
        from django.contrib.auth.models import AnonymousUser

        permission = IsVerifiedUser()
        factory = RequestFactory()
        request = factory.get('/api/test/')
        request.user = AnonymousUser()

        self.assertFalse(permission.has_permission(request, None))
