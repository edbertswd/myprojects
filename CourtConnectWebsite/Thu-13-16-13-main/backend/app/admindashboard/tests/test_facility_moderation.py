"""
Tests for Facility Moderation functionality
"""

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from decimal import Decimal

from app.users.models import User, Manager
from app.facilities.models import Facility, Court, SportType, Availability
from app.admindashboard.models import FacilitySuspension, CommissionAdjustment, AdminActionLog


class FacilityModerationTestCase(TestCase):
    """Test facility moderation endpoints"""

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

        # Create manager user
        self.manager_user = User.objects.create_user(
            email='manager@test.com',
            name='Manager User',
            password='testpass123'
        )
        self.manager = Manager.objects.create(user=self.manager_user)

        # Create facility
        self.facility = Facility.objects.create(
            manager=self.manager,
            facility_name='Test Sports Arena',
            address='123 Test St',
            timezone='Australia/Sydney',
            commission_rate=Decimal('0.1000'),
            approval_status='approved',
            is_active=True
        )

        # Create sport type and court
        self.sport_type = SportType.objects.create(sport_name='Basketball')
        self.court = Court.objects.create(
            facility=self.facility,
            name='Court 1',
            sport_type=self.sport_type,
            hourly_rate=Decimal('50.00'),
            is_active=True
        )

        # Authenticate as admin using force_authenticate for tests
        self.client.force_authenticate(user=self.admin_user)
        

    def test_suspend_facility_missing_reason(self):
        """Test that suspending facility requires reason"""
        response = self.client.post(
            f'/api/admin/facilities/{self.facility.facility_id}/suspend/',
            data={}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('reason', response.data)

    def test_suspend_facility_reason_too_short(self):
        """Test that reason must be at least 10 characters"""
        response = self.client.post(
            f'/api/admin/facilities/{self.facility.facility_id}/suspend/',
            data={'reason': 'Bad'}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_suspend_facility_with_duration(self):
        """Test suspending facility with duration"""
        response = self.client.post(
            f'/api/admin/facilities/{self.facility.facility_id}/suspend/',
            data={
                'reason': 'Suspended for 30 days due to multiple user complaints about unsafe conditions',
                'duration_days': 30
            }
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('suspension_id', response.data['data'])

        # Verify facility suspended
        self.facility.refresh_from_db()
        self.assertTrue(self.facility.is_suspended)

        # Verify suspension record
        suspension = FacilitySuspension.objects.get(facility=self.facility, status='active')
        self.assertEqual(suspension.duration_days, 30)
        self.assertIsNotNone(suspension.expires_at)
        self.assertEqual(suspension.suspended_by, self.admin_user)

        # Verify admin action logged
        self.assertTrue(AdminActionLog.objects.filter(
            admin_user=self.admin_user,
            action_name='suspend_facility',
            resource_id=self.facility.facility_id
        ).exists())

    def test_suspend_facility_indefinite(self):
        """Test suspending facility indefinitely"""
        response = self.client.post(
            f'/api/admin/facilities/{self.facility.facility_id}/suspend/',
            data={'reason': 'Indefinite suspension pending safety inspection and certification'}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        suspension = FacilitySuspension.objects.get(facility=self.facility)
        self.assertIsNone(suspension.duration_days)
        self.assertIsNone(suspension.expires_at)

    def test_suspend_already_suspended_facility(self):
        """Test that suspending already suspended facility fails"""
        self.client.post(
            f'/api/admin/facilities/{self.facility.facility_id}/suspend/',
            data={'reason': 'First suspension for policy violations'}
        )

        response = self.client.post(
            f'/api/admin/facilities/{self.facility.facility_id}/suspend/',
            data={'reason': 'Second suspension attempt'}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_unsuspend_facility_success(self):
        """Test successful facility unsuspension"""
        # First suspend
        self.client.post(
            f'/api/admin/facilities/{self.facility.facility_id}/suspend/',
            data={'reason': 'Suspended for safety issues'}
        )

        # Then unsuspend
        response = self.client.post(
            f'/api/admin/facilities/{self.facility.facility_id}/unsuspend/',
            data={'reason': 'Unsuspended after safety inspection passed and issues resolved'}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify facility unsuspended
        self.facility.refresh_from_db()
        self.assertFalse(self.facility.is_suspended)

        # Verify suspension lifted
        suspension = FacilitySuspension.objects.get(facility=self.facility)
        self.assertEqual(suspension.status, 'lifted')
        self.assertIsNotNone(suspension.unsuspended_at)

    def test_unsuspend_not_suspended_facility(self):
        """Test that unsuspending non-suspended facility fails"""
        response = self.client.post(
            f'/api/admin/facilities/{self.facility.facility_id}/unsuspend/',
            data={'reason': 'Trying to unsuspend'}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_facility_analytics(self):
        """Test facility analytics endpoint"""
        response = self.client.get(
            f'/api/admin/facilities/{self.facility.facility_id}/analytics/'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('data', response.data)

        data = response.data['data']
        self.assertEqual(data['facility_id'], self.facility.facility_id)
        self.assertEqual(data['facility_name'], 'Test Sports Arena')
        self.assertEqual(data['total_courts'], 1)
        self.assertEqual(data['active_courts'], 1)
        self.assertIn('total_bookings', data)
        self.assertIn('total_revenue', data)
        self.assertIn('commission_collected', data)

    def test_adjust_commission_rate_missing_reason(self):
        """Test that adjusting commission requires reason"""
        response = self.client.post(
            f'/api/admin/facilities/{self.facility.facility_id}/commission/',
            data={'new_rate': 0.08}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('reason', response.data)

    def test_adjust_commission_rate_success(self):
        """Test successful commission rate adjustment"""
        old_rate = self.facility.commission_rate
        new_rate = Decimal('0.0800')

        response = self.client.post(
            f'/api/admin/facilities/{self.facility.facility_id}/commission/',
            data={
                'new_rate': '0.0800',
                'reason': 'Reduced commission to 8% as incentive for high-performing facility with excellent ratings'
            }
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('adjustment_id', response.data['data'])

        # Verify facility commission updated
        self.facility.refresh_from_db()
        self.assertEqual(self.facility.commission_rate, new_rate)

        # Verify adjustment record created
        adjustment = CommissionAdjustment.objects.get(facility=self.facility)
        self.assertEqual(adjustment.old_rate, old_rate)
        self.assertEqual(adjustment.new_rate, new_rate)
        self.assertEqual(adjustment.adjusted_by, self.admin_user)

        # Verify admin action logged with financial impact
        log = AdminActionLog.objects.get(
            admin_user=self.admin_user,
            action_name='adjust_commission_rate',
            resource_id=self.facility.facility_id
        )
        self.assertIsNotNone(log.financial_impact)

    def test_adjust_commission_rate_with_future_effective_date(self):
        """Test commission adjustment with future effective date"""
        future_date = timezone.now() + timezone.timedelta(days=30)

        response = self.client.post(
            f'/api/admin/facilities/{self.facility.facility_id}/commission/',
            data={
                'new_rate': '0.1200',
                'reason': 'Increasing commission to 12% due to increased platform costs',
                'effective_date': future_date.isoformat()
            }
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Facility commission should NOT be updated yet (future date)
        self.facility.refresh_from_db()
        self.assertEqual(self.facility.commission_rate, Decimal('0.1000'))

        # But adjustment record should exist
        adjustment = CommissionAdjustment.objects.get(facility=self.facility)
        self.assertIsNotNone(adjustment.effective_date)

    def test_adjust_commission_rate_invalid_range(self):
        """Test that commission rate must be between 0 and 1"""
        response = self.client.post(
            f'/api/admin/facilities/{self.facility.facility_id}/commission/',
            data={
                'new_rate': '1.5',  # 150% - invalid
                'reason': 'Invalid commission rate test'
            }
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_facility_analytics_with_bookings(self):
        """Test facility analytics calculates revenue correctly"""
        from app.bookings.models import Booking, BookingStatus

        # Create booking status
        status_obj, _ = BookingStatus.objects.get_or_create(status_name='confirmed')

        # Create availability
        start_time = timezone.now() + timezone.timedelta(days=1)
        end_time = start_time + timezone.timedelta(hours=2)

        availability = Availability.objects.create(
            court=self.court,
            start_time=start_time,
            end_time=end_time,
            is_available=True
        )

        # Create booking
        booking_user = User.objects.create_user(
            email='user@test.com',
            name='Test User',
            password='testpass123'
        )

        booking = Booking.objects.create(
            user=booking_user,
            court=self.court,
            availability=availability,
            start_time=start_time,
            end_time=end_time,
            hourly_rate_snapshot=Decimal('50.00'),
            commission_rate_snapshot=Decimal('0.1000'),
            status=status_obj
        )

        # Get analytics
        response = self.client.get(
            f'/api/admin/facilities/{self.facility.facility_id}/analytics/'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.data['data']
        self.assertEqual(data['total_bookings'], 1)
        self.assertGreater(float(data['total_revenue']), 0)
        self.assertGreater(float(data['commission_collected']), 0)

    def test_suspend_facility_requires_admin_permission(self):
        """Test that only admins can suspend facilities"""
        # Create regular user and authenticate
        regular_user = User.objects.create_user(
            email='regular@test.com',
            name='Regular User',
            password='testpass123'
        )
        self.client.force_authenticate(user=regular_user)

        response = self.client.post(
            f'/api/admin/facilities/{self.facility.facility_id}/suspend/',
            data={'reason': 'Trying to suspend as regular user'}
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
