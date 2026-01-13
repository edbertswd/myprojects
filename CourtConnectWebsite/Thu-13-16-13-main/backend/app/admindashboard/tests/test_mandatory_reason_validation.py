"""
Comprehensive tests for mandatory reason field validation
This ensures all admin actions enforce the 10-2000 character requirement
"""

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from decimal import Decimal

from app.users.models import User, Manager
from app.facilities.models import Facility, Court, SportType, Availability
from app.bookings.models import Booking, BookingStatus
from app.admindashboard.models import ManagerRequest, RefundRequest, Report


class MandatoryReasonValidationTestCase(TestCase):
    """Test that all admin actions enforce mandatory reason fields"""

    def setUp(self):
        """Set up test data"""
        self.client = APIClient()

        # Create admin user
        self.admin_user = User.objects.create_user(
            email='admin@test.com',
            name='Admin User',
            password='testpass123',
            is_admin=True
        )

        # Create test users
        self.regular_user = User.objects.create_user(
            email='user@test.com',
            name='Regular User',
            password='testpass123'
        )

        self.manager_user = User.objects.create_user(
            email='manager@test.com',
            name='Manager User',
            password='testpass123'
        )
        self.manager = Manager.objects.create(user=self.manager_user)

        # Create facility
        self.facility = Facility.objects.create(
            manager=self.manager,
            facility_name='Test Arena',
            address='123 Test St',
            timezone='Australia/Sydney',
            commission_rate=Decimal('0.1000'),
            approval_status='approved'
        )

        # Authenticate as admin using force_authenticate for tests
        self.client.force_authenticate(user=self.admin_user)
        

        # Valid and invalid reasons for testing
        self.valid_reason = 'This is a valid reason that meets the minimum 10 character requirement'
        self.short_reason = 'Short'  # Only 5 characters
        self.too_long_reason = 'x' * 2001  # 2001 characters (over limit)

    # ========== Manager Application Tests ==========

    def test_approve_manager_application_no_reason(self):
        """Test manager approval fails without reason"""
        request = ManagerRequest.objects.create(
            user=self.regular_user,
            status='pending',
            reason='Want to manage',
            facility_name='Test',
            facility_address='123 St',
            contact_phone='1234567890',
            proposed_timezone='Australia/Sydney'
        )

        response = self.client.post(
            f'/api/admin/managers/applications/{request.request_id}/approve/',
            data={}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('reason', response.data)

    def test_approve_manager_application_short_reason(self):
        """Test manager approval fails with short reason"""
        request = ManagerRequest.objects.create(
            user=self.regular_user,
            status='pending',
            reason='Want to manage',
            facility_name='Test',
            facility_address='123 St',
            contact_phone='1234567890',
            proposed_timezone='Australia/Sydney'
        )

        response = self.client.post(
            f'/api/admin/managers/applications/{request.request_id}/approve/',
            data={'reason': self.short_reason}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_reject_manager_application_no_reason(self):
        """Test manager rejection fails without reason"""
        request = ManagerRequest.objects.create(
            user=self.regular_user,
            status='pending',
            reason='Want to manage',
            facility_name='Test',
            facility_address='123 St',
            contact_phone='1234567890',
            proposed_timezone='Australia/Sydney'
        )

        response = self.client.post(
            f'/api/admin/managers/applications/{request.request_id}/reject/',
            data={}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # ========== Manager Suspension Tests ==========

    def test_suspend_manager_no_reason(self):
        """Test manager suspension fails without reason"""
        response = self.client.post(
            f'/api/admin/managers/{self.manager_user.user_id}/suspend/',
            data={}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('reason', response.data)

    def test_suspend_manager_short_reason(self):
        """Test manager suspension fails with short reason"""
        response = self.client.post(
            f'/api/admin/managers/{self.manager_user.user_id}/suspend/',
            data={'reason': self.short_reason}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_suspend_manager_too_long_reason(self):
        """Test manager suspension fails with too long reason"""
        response = self.client.post(
            f'/api/admin/managers/{self.manager_user.user_id}/suspend/',
            data={'reason': self.too_long_reason}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_suspend_manager_valid_reason(self):
        """Test manager suspension succeeds with valid reason"""
        response = self.client.post(
            f'/api/admin/managers/{self.manager_user.user_id}/suspend/',
            data={'reason': self.valid_reason}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_unsuspend_manager_no_reason(self):
        """Test manager unsuspension fails without reason"""
        # First suspend
        self.client.post(
            f'/api/admin/managers/{self.manager_user.user_id}/suspend/',
            data={'reason': self.valid_reason}
        )

        # Try to unsuspend without reason
        response = self.client.post(
            f'/api/admin/managers/{self.manager_user.user_id}/unsuspend/',
            data={}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # ========== Facility Suspension Tests ==========

    def test_suspend_facility_no_reason(self):
        """Test facility suspension fails without reason"""
        response = self.client.post(
            f'/api/admin/facilities/{self.facility.facility_id}/suspend/',
            data={}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('reason', response.data)

    def test_suspend_facility_short_reason(self):
        """Test facility suspension fails with short reason"""
        response = self.client.post(
            f'/api/admin/facilities/{self.facility.facility_id}/suspend/',
            data={'reason': self.short_reason}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_suspend_facility_valid_reason(self):
        """Test facility suspension succeeds with valid reason"""
        response = self.client.post(
            f'/api/admin/facilities/{self.facility.facility_id}/suspend/',
            data={'reason': self.valid_reason}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_unsuspend_facility_no_reason(self):
        """Test facility unsuspension fails without reason"""
        # First suspend
        self.client.post(
            f'/api/admin/facilities/{self.facility.facility_id}/suspend/',
            data={'reason': self.valid_reason}
        )

        # Try to unsuspend without reason
        response = self.client.post(
            f'/api/admin/facilities/{self.facility.facility_id}/unsuspend/',
            data={}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # ========== Commission Adjustment Tests ==========

    def test_adjust_commission_no_reason(self):
        """Test commission adjustment fails without reason"""
        response = self.client.post(
            f'/api/admin/facilities/{self.facility.facility_id}/commission/',
            data={'new_rate': '0.08'}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('reason', response.data)

    def test_adjust_commission_short_reason(self):
        """Test commission adjustment fails with short reason"""
        response = self.client.post(
            f'/api/admin/facilities/{self.facility.facility_id}/commission/',
            data={'new_rate': '0.08', 'reason': self.short_reason}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_adjust_commission_valid_reason(self):
        """Test commission adjustment succeeds with valid reason"""
        response = self.client.post(
            f'/api/admin/facilities/{self.facility.facility_id}/commission/',
            data={'new_rate': '0.08', 'reason': self.valid_reason}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # ========== Refund Tests ==========

    def test_approve_refund_no_reason(self):
        """Test refund approval fails without reason"""
        # Create booking for refund
        sport_type = SportType.objects.create(sport_name='Tennis')
        court = Court.objects.create(
            facility=self.facility,
            name='Court 1',
            sport_type=sport_type,
            hourly_rate=Decimal('50.00')
        )
        booking_status, _ = BookingStatus.objects.get_or_create(status_name='confirmed')
        start_time = timezone.now() + timezone.timedelta(days=1)
        availability = Availability.objects.create(
            court=court,
            start_time=start_time,
            end_time=start_time + timezone.timedelta(hours=1),
            is_available=False
        )
        booking = Booking.objects.create(
            user=self.regular_user,
            court=court,
            availability=availability,
            start_time=start_time,
            end_time=start_time + timezone.timedelta(hours=1),
            hourly_rate_snapshot=Decimal('50.00'),
            commission_rate_snapshot=Decimal('0.1000'),
            status=booking_status
        )

        refund = RefundRequest.objects.create(
            booking=booking,
            requested_by=self.regular_user,
            reason='Facility closed',
            amount=Decimal('50.00'),
            status='pending'
        )

        response = self.client.post(
            f'/api/admin/payments/refunds/{refund.request_id}/approve/',
            data={}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('reason', response.data)

    def test_reject_refund_short_reason(self):
        """Test refund rejection fails with short reason"""
        sport_type = SportType.objects.create(sport_name='Basketball')
        court = Court.objects.create(
            facility=self.facility,
            name='Court 2',
            sport_type=sport_type,
            hourly_rate=Decimal('60.00')
        )
        booking_status, _ = BookingStatus.objects.get_or_create(status_name='pending_payment')
        start_time = timezone.now() + timezone.timedelta(days=2)
        availability = Availability.objects.create(
            court=court,
            start_time=start_time,
            end_time=start_time + timezone.timedelta(hours=2),
            is_available=False
        )
        booking = Booking.objects.create(
            user=self.regular_user,
            court=court,
            availability=availability,
            start_time=start_time,
            end_time=start_time + timezone.timedelta(hours=2),
            hourly_rate_snapshot=Decimal('60.00'),
            commission_rate_snapshot=Decimal('0.1000'),
            status=booking_status
        )

        refund = RefundRequest.objects.create(
            booking=booking,
            requested_by=self.regular_user,
            reason='Changed mind',
            amount=Decimal('120.00'),
            status='pending'
        )

        response = self.client.post(
            f'/api/admin/payments/refunds/{refund.request_id}/reject/',
            data={'reason': self.short_reason}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # ========== Report Tests ==========

    def test_resolve_report_no_resolution_note(self):
        """Test report resolution fails without resolution note"""
        report = Report.objects.create(
            reporter_user=self.regular_user,
            resource_type='user',
            resource_id=999,
            reason='Spam',
            status='open'
        )

        response = self.client.post(
            f'/api/admin/reports/{report.report_id}/resolve/',
            data={}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('resolution_note', response.data)

    def test_resolve_report_short_resolution_note(self):
        """Test report resolution fails with short resolution note"""
        report = Report.objects.create(
            reporter_user=self.regular_user,
            resource_type='user',
            resource_id=998,
            reason='Inappropriate',
            status='open'
        )

        response = self.client.post(
            f'/api/admin/reports/{report.report_id}/resolve/',
            data={'resolution_note': self.short_reason}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_resolve_report_valid_resolution_note(self):
        """Test report resolution succeeds with valid resolution note"""
        report = Report.objects.create(
            reporter_user=self.regular_user,
            resource_type='user',
            resource_id=997,
            reason='Harassment',
            status='open'
        )

        response = self.client.post(
            f'/api/admin/reports/{report.report_id}/resolve/',
            data={'resolution_note': self.valid_reason}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_dismiss_report_no_resolution_note(self):
        """Test report dismissal fails without resolution note"""
        report = Report.objects.create(
            reporter_user=self.regular_user,
            resource_type='facility',
            resource_id=996,
            reason='Complaint',
            status='open'
        )

        response = self.client.post(
            f'/api/admin/reports/{report.report_id}/dismiss/',
            data={}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # ========== Comprehensive Test ==========

    def test_all_actions_logged_with_reason(self):
        """Test that all admin actions are logged with reason"""
        from app.admindashboard.models import AdminActionLog

        # Perform an action with valid reason
        request = ManagerRequest.objects.create(
            user=self.regular_user,
            status='pending',
            reason='Business plan',
            facility_name='New Facility',
            facility_address='789 Ave',
            contact_phone='9876543210',
            proposed_timezone='Australia/Melbourne'
        )

        self.client.post(
            f'/api/admin/managers/applications/{request.request_id}/approve/',
            data={'reason': self.valid_reason}
        )

        # Verify log created with reason
        log = AdminActionLog.objects.filter(
            admin_user=self.admin_user,
            action_name='approve_manager_application'
        ).latest('created_at')

        self.assertEqual(log.reason, self.valid_reason)
        self.assertIsNotNone(log.metadata)

    def test_exact_10_character_reason_accepted(self):
        """Test that exactly 10 characters is accepted"""
        report = Report.objects.create(
            reporter_user=self.regular_user,
            resource_type='test',
            resource_id=1,
            reason='Test report',
            status='open'
        )

        exactly_10_chars = 'Ten chars!'  # Exactly 10 characters
        response = self.client.post(
            f'/api/admin/reports/{report.report_id}/resolve/',
            data={'resolution_note': exactly_10_chars}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_exact_2000_character_reason_accepted(self):
        """Test that exactly 2000 characters is accepted"""
        exactly_2000_chars = 'x' * 2000

        response = self.client.post(
            f'/api/admin/managers/{self.manager_user.user_id}/suspend/',
            data={'reason': exactly_2000_chars}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_reason_boundary_conditions(self):
        """Test reason field boundary conditions"""
        # 9 characters - should fail
        nine_chars = 'x' * 9
        response = self.client.post(
            f'/api/admin/facilities/{self.facility.facility_id}/suspend/',
            data={'reason': nine_chars}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # 10 characters - should succeed
        ten_chars = 'x' * 10
        response = self.client.post(
            f'/api/admin/facilities/{self.facility.facility_id}/suspend/',
            data={'reason': ten_chars}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
