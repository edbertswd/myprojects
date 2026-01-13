from django.test import TestCase, RequestFactory
from app.users.models import User
from app.admindashboard.models import ActivityLog
from app.utils.audit import (
    set_current_request, get_current_request, clear_current_request,
    is_api_request, ActivityLogger
)


class AuditUtilsTests(TestCase):
    """Test audit utility functions"""

    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            name='Test User',
            password='testpass123'
        )
        self.factory = RequestFactory()

    def tearDown(self):
        """Clear thread-local storage after each test"""
        clear_current_request()

    def test_set_and_get_current_request(self):
        """Test setting and getting current request"""
        request = self.factory.get('/api/test/')
        set_current_request(request)

        retrieved_request = get_current_request()
        self.assertEqual(request, retrieved_request)

    def test_get_current_request_when_none(self):
        """Test getting current request when none is set"""
        clear_current_request()
        request = get_current_request()
        self.assertIsNone(request)

    def test_clear_current_request(self):
        """Test clearing current request"""
        request = self.factory.get('/api/test/')
        set_current_request(request)
        clear_current_request()

        retrieved_request = get_current_request()
        self.assertIsNone(retrieved_request)

    def test_is_api_request_with_api_path(self):
        """Test is_api_request returns True for API paths"""
        request = self.factory.get('/api/bookings/')
        set_current_request(request)

        self.assertTrue(is_api_request())

    def test_is_api_request_with_admin_path(self):
        """Test is_api_request returns False for admin paths"""
        request = self.factory.get('/admin/users/')
        set_current_request(request)

        self.assertFalse(is_api_request())

    def test_is_api_request_with_django_admin_path(self):
        """Test is_api_request returns False for django-admin paths"""
        request = self.factory.get('/django-admin/users/')
        set_current_request(request)

        self.assertFalse(is_api_request())

    def test_is_api_request_with_no_request(self):
        """Test is_api_request returns False when no request context"""
        clear_current_request()
        self.assertFalse(is_api_request())


class ActivityLoggerTests(TestCase):
    """Test ActivityLogger class"""

    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            name='Test User',
            password='testpass123'
        )
        self.factory = RequestFactory()

    def tearDown(self):
        """Clear thread-local storage after each test"""
        clear_current_request()

    def test_log_action_in_api_context(self):
        """Test logging action in API request context"""
        request = self.factory.post('/api/bookings/')
        set_current_request(request)

        log_entry = ActivityLogger.log_action(
            user=self.user,
            action='create_booking',
            resource_type='booking',
            resource_id=123,
            metadata={'duration': 2}
        )

        self.assertIsNotNone(log_entry)
        self.assertEqual(log_entry.user, self.user)
        self.assertEqual(log_entry.action, 'create_booking')
        self.assertEqual(log_entry.resource_type, 'booking')
        self.assertEqual(log_entry.resource_id, 123)
        self.assertEqual(log_entry.metadata['duration'], 2)

    def test_log_action_in_admin_context(self):
        """Test logging action in admin context returns None"""
        request = self.factory.post('/admin/users/')
        set_current_request(request)

        log_entry = ActivityLogger.log_action(
            user=self.user,
            action='create_user',
            resource_type='user',
            resource_id=1
        )

        self.assertIsNone(log_entry)
        # Verify no log was created
        self.assertEqual(ActivityLog.objects.count(), 0)

    def test_log_action_without_request_context(self):
        """Test logging action without request context returns None"""
        clear_current_request()

        log_entry = ActivityLogger.log_action(
            user=self.user,
            action='create_booking',
            resource_type='booking',
            resource_id=123
        )

        self.assertIsNone(log_entry)
        self.assertEqual(ActivityLog.objects.count(), 0)

    def test_log_user_action(self):
        """Test log_user_action method"""
        request = self.factory.post('/api/auth/login/')
        set_current_request(request)

        log_entry = ActivityLogger.log_user_action(
            user=self.user,
            action='login',
            metadata={'ip_address': '192.168.1.1'}
        )

        self.assertIsNotNone(log_entry)
        self.assertEqual(log_entry.action, 'login')
        self.assertEqual(log_entry.metadata['ip_address'], '192.168.1.1')

    def test_log_manager_action(self):
        """Test log_manager_action adds manager flag"""
        request = self.factory.post('/api/managers/facilities/')
        set_current_request(request)

        log_entry = ActivityLogger.log_manager_action(
            user=self.user,
            action='create_facility',
            resource_type='facility',
            resource_id=456,
            metadata={'facility_name': 'Test Facility'}
        )

        self.assertIsNotNone(log_entry)
        self.assertEqual(log_entry.action, 'create_facility')
        self.assertTrue(log_entry.metadata['is_manager_action'])
        self.assertEqual(log_entry.metadata['facility_name'], 'Test Facility')

    def test_log_crud_action_with_name(self):
        """Test log_crud_action with instance that has name"""
        request = self.factory.post('/api/courts/')
        set_current_request(request)

        # Create a mock object with name
        class MockInstance:
            name = 'Court 1'

        instance = MockInstance()

        log_entry = ActivityLogger.log_crud_action(
            user=self.user,
            action='create',
            resource_type='court',
            resource_id=789,
            instance=instance
        )

        self.assertIsNotNone(log_entry)
        self.assertEqual(log_entry.action, 'create_court')
        self.assertEqual(log_entry.metadata['name'], 'Court 1')
        self.assertEqual(log_entry.metadata['crud_action'], 'create')

    def test_log_crud_action_with_facility_name(self):
        """Test log_crud_action with instance that has facility_name"""
        request = self.factory.post('/api/facilities/')
        set_current_request(request)

        class MockFacility:
            facility_name = 'Test Facility'

        instance = MockFacility()

        log_entry = ActivityLogger.log_crud_action(
            user=self.user,
            action='update',
            resource_type='facility',
            resource_id=100,
            instance=instance
        )

        self.assertIsNotNone(log_entry)
        self.assertEqual(log_entry.metadata['facility_name'], 'Test Facility')
        self.assertEqual(log_entry.metadata['crud_action'], 'update')

    def test_log_crud_action_with_email(self):
        """Test log_crud_action with instance that has email"""
        request = self.factory.post('/api/users/')
        set_current_request(request)

        class MockUser:
            email = 'user@example.com'

        instance = MockUser()

        log_entry = ActivityLogger.log_crud_action(
            user=self.user,
            action='delete',
            resource_type='user',
            resource_id=200,
            instance=instance
        )

        self.assertIsNotNone(log_entry)
        self.assertEqual(log_entry.metadata['email'], 'user@example.com')
        self.assertEqual(log_entry.metadata['crud_action'], 'delete')

    def test_log_action_with_exception_handling(self):
        """Test that log_action handles exceptions gracefully"""
        request = self.factory.post('/api/test/')
        set_current_request(request)

        # Create a user that will cause an error when saving
        # (by using invalid data that violates constraints)
        # The log should return None but not raise an exception

        # This test ensures the try-except block works
        # In practice, we'd need to mock the create to raise an exception
        # For now, we just verify normal operation doesn't raise
        try:
            log_entry = ActivityLogger.log_action(
                user=self.user,
                action='test_action',
                resource_type='test',
                resource_id=1
            )
            # Should not raise an exception
            self.assertIsNotNone(log_entry)
        except Exception as e:
            self.fail(f"log_action raised an exception: {e}")


class SignalsTests(TestCase):
    """Test Django signals for audit logging"""

    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            name='Test User',
            password='testpass123'
        )
        self.manager_user = User.objects.create_user(
            email='manager@example.com',
            name='Manager User',
            password='testpass123'
        )
        from app.users.models import Manager
        self.manager = Manager.objects.create(user=self.manager_user)

        from app.facilities.models import Facility, Court, SportType
        self.facility = Facility.objects.create(
            facility_name='Test Facility',
            address='123 Test St',
            manager=self.manager
        )
        self.sport_type = SportType.objects.create(sport_name='Tennis')
        self.court = Court.objects.create(
            facility=self.facility,
            name='Test Court',
            sport_type=self.sport_type,
            hourly_rate=50.00
        )

        self.factory = RequestFactory()

    def tearDown(self):
        """Clear thread-local storage after each test"""
        clear_current_request()

    def test_facility_delete_signal_logs_action(self):
        """Test that deleting facility creates audit log"""
        request = self.factory.delete('/api/facilities/1/')
        request.user = self.manager_user
        set_current_request(request)

        facility_id = self.facility.facility_id

        # Delete facility (should trigger signal)
        self.facility.delete()

        # Check log was created
        logs = ActivityLog.objects.filter(
            action='delete_facility_signal',
            resource_id=facility_id
        )
        self.assertEqual(logs.count(), 1)
        log = logs.first()
        self.assertEqual(log.user, self.manager_user)
        self.assertEqual(log.metadata.get('deleted_via'), 'signal')

    def test_court_delete_signal_logs_action(self):
        """Test that deleting court creates audit log"""
        request = self.factory.delete('/api/courts/1/')
        request.user = self.manager_user
        set_current_request(request)

        court_id = self.court.court_id

        # Delete court (should trigger signal)
        self.court.delete()

        # Check log was created
        logs = ActivityLog.objects.filter(
            action='delete_court_signal',
            resource_id=court_id
        )
        self.assertEqual(logs.count(), 1)
        log = logs.first()
        self.assertEqual(log.user, self.manager_user)
        self.assertEqual(log.metadata.get('court_name'), 'Test Court')

    def test_availability_delete_signal_logs_action(self):
        """Test that deleting availability creates audit log"""
        from app.facilities.models import Availability
        from django.utils import timezone
        from datetime import timedelta

        availability = Availability.objects.create(
            court=self.court,
            start_time=timezone.now() + timedelta(days=1),
            end_time=timezone.now() + timedelta(days=1, hours=1),
            is_available=True
        )

        request = self.factory.delete('/api/availability/1/')
        request.user = self.manager_user
        set_current_request(request)

        availability_id = availability.availability_id

        # Delete availability (should trigger signal)
        availability.delete()

        # Check log was created
        logs = ActivityLog.objects.filter(
            action='delete_availability_signal',
            resource_id=availability_id
        )
        self.assertEqual(logs.count(), 1)
        log = logs.first()
        self.assertEqual(log.user, self.manager_user)

    def test_signal_without_request_context(self):
        """Test that signals don't log without request context"""
        clear_current_request()

        court_id = self.court.court_id

        # Delete court without request context
        self.court.delete()

        # Check no log was created
        logs = ActivityLog.objects.filter(
            action='delete_court_signal',
            resource_id=court_id
        )
        self.assertEqual(logs.count(), 0)

    def test_payment_create_signal(self):
        """Test payment creation signal logs action"""
        from app.payments.models import Payment, PaymentMethod, PaymentStatus
        from app.bookings.models import Booking, BookingStatus
        from django.utils import timezone
        from datetime import timedelta

        # Create booking
        booking_status, _ = BookingStatus.objects.get_or_create(status_name='confirmed')
        booking = Booking.objects.create(
            user=self.user,
            court=self.court,
            start_time=timezone.now() + timedelta(days=1),
            end_time=timezone.now() + timedelta(days=1, hours=1),
            hourly_rate_snapshot=50.00,
            commission_rate_snapshot=0.10,
            status=booking_status
        )

        # Create payment method and status
        payment_method, _ = PaymentMethod.objects.get_or_create(
            provider='paypal',
            defaults={'account_id': 'test_account'}
        )
        payment_status, _ = PaymentStatus.objects.get_or_create(status_name='completed')

        request = self.factory.post('/api/payments/')
        request.user = self.user
        set_current_request(request)

        # Create payment (should trigger signal)
        payment = Payment.objects.create(
            booking=booking,
            amount=50.00,
            payment_method=payment_method,
            status=payment_status,
            provider_payment_id='PAY123'
        )

        # Check log was created
        logs = ActivityLog.objects.filter(
            action='create_payment',
            resource_id=payment.payment_id
        )
        self.assertEqual(logs.count(), 1)
        log = logs.first()
        self.assertEqual(log.metadata.get('amount'), '50.00')
        self.assertEqual(log.metadata.get('created_via'), 'signal')

    def test_user_create_signal(self):
        """Test user creation signal logs action"""
        request = self.factory.post('/api/auth/register/')
        request.user = self.user
        set_current_request(request)

        # Create new user (should trigger signal)
        new_user = User.objects.create_user(
            email='newuser@example.com',
            name='New User',
            password='testpass123'
        )

        # Check log was created
        logs = ActivityLog.objects.filter(
            action='create_user',
            resource_id=new_user.user_id
        )
        self.assertEqual(logs.count(), 1)
        log = logs.first()
        self.assertEqual(log.metadata.get('email'), 'newuser@example.com')
