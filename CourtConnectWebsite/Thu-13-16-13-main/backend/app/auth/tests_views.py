"""
Comprehensive tests for Auth Views
Tests login, registration, MFA, email verification, and profile management
"""
from django.test import TestCase
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from unittest.mock import patch, Mock
from django.utils import timezone
from datetime import timedelta

from app.users.models import User, Session


class LoginViewTests(APITestCase):
    """Test LoginView"""

    def setUp(self):
        self.client = APIClient()
        self.url = '/api/auth/login/'

        self.user = User.objects.create_user(
            email='user@example.com',
            name='Test User',
            password='testpass123',
            is_active=True,
            verification_status='verified'
        )

    def test_login_success_without_mfa(self):
        """Test successful login without MFA"""
        data = {
            'email': 'user@example.com',
            'password': 'testpass123'
        }

        with patch('app.utils.audit.ActivityLogger.log_user_action'):
            response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('user', response.data)
        self.assertIn('session_id', response.data)
        self.assertIn('message', response.data)

    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        data = {
            'email': 'user@example.com',
            'password': 'wrongpassword'
        }
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_missing_fields(self):
        """Test login with missing fields"""
        data = {
            'email': 'user@example.com'
            # Missing password
        }
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @patch('app.auth.services.OTPService.generate_otp')
    @patch('app.auth.services.OTPService.send_otp_email')
    def test_login_with_mfa_enabled(self, mock_send_otp, mock_generate_otp):
        """Test login with MFA enabled"""
        # Enable MFA for user
        self.user.mfa_enabled = True
        self.user.save()

        mock_generate_otp.return_value = '123456'
        mock_send_otp.return_value = True

        data = {
            'email': 'user@example.com',
            'password': 'testpass123'
        }
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['requiresMfa'])
        self.assertIn('OTP code sent', response.data['message'])

    @patch('app.auth.services.OTPService.generate_otp')
    @patch('app.auth.services.OTPService.send_otp_email')
    def test_login_mfa_email_send_failure(self, mock_send_otp, mock_generate_otp):
        """Test login when MFA email fails to send - OTP still valid via console"""
        self.user.mfa_enabled = True
        self.user.save()

        mock_generate_otp.return_value = '123456'
        mock_send_otp.return_value = False

        data = {
            'email': 'user@example.com',
            'password': 'testpass123'
        }
        response = self.client.post(self.url, data, format='json')

        # Email failure should not crash the flow - returns success
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['requiresMfa'])
        self.assertIn('OTP code sent', response.data['message'])


class LogoutViewTests(APITestCase):
    """Test LogoutView"""

    def setUp(self):
        self.client = APIClient()
        self.url = '/api/auth/logout/'

        self.user = User.objects.create_user(
            email='user@example.com',
            name='Test User',
            password='testpass123'
        )

        # Create session
        self.session = Session.objects.create(
            session_id='test_session_123',
            user=self.user,
            expires_at=timezone.now() + timedelta(days=30)
        )

    def test_logout_success(self):
        """Test successful logout"""
        self.client.force_authenticate(user=self.user)

        with patch('app.utils.audit.ActivityLogger.log_user_action'):
            response = self.client.post(
                self.url,
                HTTP_X_SESSION_ID='test_session_123'
            )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('Logout successful', response.data['message'])

    def test_logout_unauthenticated(self):
        """Test logout without authentication"""
        response = self.client.post(self.url)
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])


class RegisterViewTests(APITestCase):
    """Test RegisterView"""

    def setUp(self):
        self.client = APIClient()
        self.url = '/api/auth/register/'

    @patch('app.auth.services.OTPService.generate_otp')
    @patch('app.auth.services.OTPService.send_otp_email')
    def test_register_success(self, mock_send_otp, mock_generate_otp):
        """Test successful registration"""
        mock_generate_otp.return_value = '123456'
        mock_send_otp.return_value = True

        data = {
            'email': 'newuser@example.com',
            'name': 'New User',
            'password': 'newpass123',
            'password_confirm': 'newpass123',
            'phone_number': '0412345678'
        }
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['requiresVerification'])
        self.assertIn('Verification code sent', response.data['message'])

        # Verify user was created but inactive
        user = User.objects.get(email='newuser@example.com')
        self.assertFalse(user.is_active)
        self.assertEqual(user.verification_status, 'pending')

    def test_register_duplicate_email(self):
        """Test registration with duplicate email"""
        # Create existing user
        User.objects.create_user(
            email='existing@example.com',
            name='Existing User',
            password='testpass123'
        )

        data = {
            'email': 'existing@example.com',
            'name': 'New User',
            'password': 'newpass123'
        }
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_invalid_data(self):
        """Test registration with invalid data"""
        data = {
            'email': 'invalid-email',
            'name': 'Test User'
            # Missing password
        }
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @patch('app.auth.services.OTPService.generate_otp')
    @patch('app.auth.services.OTPService.send_otp_email')
    def test_register_email_send_failure(self, mock_send_otp, mock_generate_otp):
        """Test registration when verification email fails to send - OTP still valid via console"""
        mock_generate_otp.return_value = '123456'
        mock_send_otp.return_value = False

        data = {
            'email': 'newuser@example.com',
            'name': 'New User',
            'password': 'newpass123',
            'password_confirm': 'newpass123'
        }
        response = self.client.post(self.url, data, format='json')

        # Email failure should not crash the flow - returns success
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['requiresVerification'])
        self.assertIn('Verification code sent', response.data['message'])

        # Verify user was created (not deleted) but inactive
        user = User.objects.get(email='newuser@example.com')
        self.assertFalse(user.is_active)
        self.assertEqual(user.verification_status, 'pending')

    def test_register_invalid_phone_number(self):
        """Test registration with invalid phone number"""
        data = {
            'email': 'newuser@example.com',
            'name': 'New User',
            'password': 'newpass123',
            'password_confirm': 'newpass123',
            'phone_number': 'invalid-phone'
        }
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('phone_number', response.data)

    def test_register_invalid_name_with_numbers(self):
        """Test registration with name containing numbers"""
        data = {
            'email': 'newuser@example.com',
            'name': 'User123',
            'password': 'newpass123',
            'password_confirm': 'newpass123'
        }
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', response.data)

    def test_register_invalid_name_with_special_chars(self):
        """Test registration with name containing special characters"""
        data = {
            'email': 'newuser@example.com',
            'name': 'User@Name!',
            'password': 'newpass123',
            'password_confirm': 'newpass123'
        }
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', response.data)


class UserProfileViewTests(APITestCase):
    """Test UserProfileView"""

    def setUp(self):
        self.client = APIClient()
        self.url = '/api/auth/profile/'

        self.user = User.objects.create_user(
            email='user@example.com',
            name='Test User',
            password='testpass123'
        )

    def test_get_profile_success(self):
        """Test getting user profile"""
        self.client.force_authenticate(user=self.user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'user@example.com')

    def test_get_profile_unauthenticated(self):
        """Test getting profile without authentication"""
        response = self.client.get(self.url)
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_update_profile_success(self):
        """Test updating user profile"""
        self.client.force_authenticate(user=self.user)

        data = {
            'name': 'Updated Name',
            'phone_number': '0412345678'
        }

        with patch('app.utils.audit.ActivityLogger.log_user_action'):
            response = self.client.patch(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Updated Name')

    def test_update_profile_invalid_phone(self):
        """Test updating profile with invalid phone number"""
        self.client.force_authenticate(user=self.user)

        data = {'phone_number': 'invalid-phone'}

        with patch('app.utils.audit.ActivityLogger.log_user_action'):
            response = self.client.patch(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('phone_number', response.data)

    def test_update_profile_valid_phone_formats(self):
        """Test updating profile with various valid phone formats"""
        self.client.force_authenticate(user=self.user)

        valid_phones = ['+61412345678', '0412345678', '+1-555-123-4567']

        for phone in valid_phones:
            data = {'phone_number': phone}

            with patch('app.utils.audit.ActivityLogger.log_user_action'):
                response = self.client.patch(self.url, data, format='json')

            self.assertEqual(response.status_code, status.HTTP_200_OK)


class CSRFTokenViewTests(APITestCase):
    """Test CSRFTokenView"""

    def setUp(self):
        self.client = APIClient()
        self.url = '/api/auth/csrf/'

    def test_get_csrf_token(self):
        """Test getting CSRF token"""
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('detail', response.data)


class VerifyLoginMFAViewTests(APITestCase):
    """Test VerifyLoginMFAView"""

    def setUp(self):
        self.client = APIClient()
        self.url = '/api/auth/verify-mfa/'

        self.user = User.objects.create_user(
            email='user@example.com',
            name='Test User',
            password='testpass123',
            mfa_enabled=True
        )

    def test_verify_mfa_missing_code(self):
        """Test MFA verification without code"""
        response = self.client.post(self.url, {}, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('OTP code is required', response.data['error'])

    def test_verify_mfa_invalid_code_format(self):
        """Test MFA verification with invalid code format"""
        data = {'code': '12345'}  # Only 5 digits
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('6 digits', response.data['error'])

    def test_verify_mfa_no_pending_session(self):
        """Test MFA verification without pending session"""
        data = {'code': '123456'}
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('No pending MFA verification', response.data['error'])

    @patch('app.auth.services.OTPService.verify_otp')
    def test_verify_mfa_invalid_otp(self, mock_verify_otp):
        """Test MFA verification with invalid OTP"""
        mock_verify_otp.return_value = False

        # Set pending session
        session = self.client.session
        session['pending_mfa_user_id'] = self.user.user_id
        session.save()

        data = {'code': '123456'}
        response = self.client.post(self.url, data, format='json')

        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])
        self.assertIn('Invalid or expired OTP code', response.data['error'])

    @patch('app.auth.services.OTPService.verify_otp')
    @patch('app.utils.audit.ActivityLogger.log_user_action')
    def test_verify_mfa_success(self, mock_log, mock_verify_otp):
        """Test successful MFA verification"""
        mock_verify_otp.return_value = True

        # Set pending session
        session = self.client.session
        session['pending_mfa_user_id'] = self.user.user_id
        session.save()

        data = {'code': '123456'}
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('user', response.data)
        self.assertIn('session_id', response.data)

    def test_verify_mfa_user_not_found(self):
        """Test MFA verification when user doesn't exist"""
        # Set pending session with non-existent user
        session = self.client.session
        session['pending_mfa_user_id'] = 99999
        session.save()

        data = {'code': '123456'}
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Invalid session', response.data['error'])


class VerifyEmailViewTests(APITestCase):
    """Test VerifyEmailView"""

    def setUp(self):
        self.client = APIClient()
        self.url = '/api/auth/verify-email/'

        self.user = User.objects.create_user(
            email='user@example.com',
            name='Test User',
            password='testpass123',
            is_active=False,
            verification_status='pending'
        )

    def test_verify_email_missing_code(self):
        """Test email verification without code"""
        response = self.client.post(self.url, {}, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Verification code is required', response.data['error'])

    def test_verify_email_invalid_code_format(self):
        """Test email verification with invalid code format"""
        data = {'code': 'abc123'}  # Not all digits
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('6 digits', response.data['error'])

    def test_verify_email_no_pending_session(self):
        """Test email verification without pending session"""
        data = {'code': '123456'}
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('No pending email verification', response.data['error'])

    @patch('app.auth.services.OTPService.verify_otp')
    def test_verify_email_invalid_otp(self, mock_verify_otp):
        """Test email verification with invalid OTP"""
        mock_verify_otp.return_value = False

        # Set pending session
        session = self.client.session
        session['pending_verification_user_id'] = self.user.user_id
        session.save()

        data = {'code': '123456'}
        response = self.client.post(self.url, data, format='json')

        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])
        self.assertIn('Invalid or expired verification code', response.data['error'])

    @patch('app.auth.services.OTPService.verify_otp')
    @patch('app.utils.audit.ActivityLogger.log_user_action')
    def test_verify_email_success(self, mock_log, mock_verify_otp):
        """Test successful email verification"""
        mock_verify_otp.return_value = True

        # Set pending session
        session = self.client.session
        session['pending_verification_user_id'] = self.user.user_id
        session.save()

        data = {'code': '123456'}
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('user', response.data)
        self.assertIn('session_id', response.data)

        # Verify user is now active
        self.user.refresh_from_db()
        self.assertTrue(self.user.is_active)
        self.assertEqual(self.user.verification_status, 'verified')

    def test_verify_email_user_not_found(self):
        """Test email verification when user doesn't exist"""
        # Set pending session with non-existent user
        session = self.client.session
        session['pending_verification_user_id'] = 99999
        session.save()

        data = {'code': '123456'}
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Invalid session', response.data['error'])


class AuthIntegrationTests(APITestCase):
    """Integration tests for auth flows"""

    def setUp(self):
        self.client = APIClient()

    @patch('app.auth.services.OTPService.generate_otp')
    @patch('app.auth.services.OTPService.send_otp_email')
    @patch('app.auth.services.OTPService.verify_otp')
    @patch('app.utils.audit.ActivityLogger.log_user_action')
    def test_full_registration_flow(self, mock_log, mock_verify, mock_send, mock_generate):
        """Test complete registration and verification flow"""
        mock_generate.return_value = '123456'
        mock_send.return_value = True
        mock_verify.return_value = True

        # Step 1: Register
        register_data = {
            'email': 'newuser@example.com',
            'name': 'New User',
            'password': 'testpass123',
            'password_confirm': 'testpass123'
        }
        register_response = self.client.post('/api/auth/register/', register_data, format='json')

        self.assertEqual(register_response.status_code, status.HTTP_201_CREATED)

        # Step 2: Verify email
        verify_data = {'code': '123456'}
        verify_response = self.client.post('/api/auth/verify-email/', verify_data, format='json')

        self.assertEqual(verify_response.status_code, status.HTTP_200_OK)

        # Verify user is now active
        user = User.objects.get(email='newuser@example.com')
        self.assertTrue(user.is_active)
        self.assertEqual(user.verification_status, 'verified')

    @patch('app.auth.services.OTPService.generate_otp')
    @patch('app.auth.services.OTPService.send_otp_email')
    @patch('app.auth.services.OTPService.verify_otp')
    @patch('app.utils.audit.ActivityLogger.log_user_action')
    def test_full_mfa_login_flow(self, mock_log, mock_verify, mock_send, mock_generate):
        """Test complete MFA login flow"""
        # Create user with MFA enabled
        user = User.objects.create_user(
            email='mfauser@example.com',
            name='MFA User',
            password='testpass123',
            mfa_enabled=True,
            is_active=True,
            verification_status='verified'
        )

        mock_generate.return_value = '123456'
        mock_send.return_value = True
        mock_verify.return_value = True

        # Step 1: Login (triggers MFA)
        login_data = {
            'email': 'mfauser@example.com',
            'password': 'testpass123'
        }
        login_response = self.client.post('/api/auth/login/', login_data, format='json')

        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        self.assertTrue(login_response.data['requiresMfa'])

        # Step 2: Verify MFA
        verify_data = {'code': '123456'}
        verify_response = self.client.post('/api/auth/verify-mfa/', verify_data, format='json')

        self.assertEqual(verify_response.status_code, status.HTTP_200_OK)
        self.assertIn('session_id', verify_response.data)
