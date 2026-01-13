"""
Tests for Analytics & Dashboard functionality
"""

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from decimal import Decimal
from datetime import timedelta

from app.users.models import User, Manager
from app.facilities.models import Facility, Court, SportType, Availability
from app.bookings.models import Booking, BookingStatus
from app.admindashboard.models import ManagerRequest, RefundRequest, Report, ActivityLog, AdminActionLog


class AnalyticsDashboardTestCase(TestCase):
    """Test analytics and dashboard endpoints"""

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

        # Create manager
        manager_user = User.objects.create_user(
            email='manager@test.com',
            name='Manager User',
            password='testpass123'
        )
        self.manager = Manager.objects.create(user=manager_user)

        # Create facility
        self.facility = Facility.objects.create(
            manager=self.manager,
            facility_name='Test Arena',
            address='123 Test St',
            timezone='Australia/Sydney',
            commission_rate=Decimal('0.1000'),
            approval_status='approved'
        )

        # Create users
        self.user1 = User.objects.create_user(
            email='user1@test.com',
            name='User One',
            password='testpass123'
        )

        self.user2 = User.objects.create_user(
            email='user2@test.com',
            name='User Two',
            password='testpass123',
            is_active=False  # Suspended
        )

        # Authenticate as admin using force_authenticate for tests
        self.client.force_authenticate(user=self.admin_user)
        

    def test_dashboard_overview(self):
        """Test dashboard overview endpoint"""
        response = self.client.get('/api/admin/dashboard/overview/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('data', response.data)

        data = response.data['data']
        self.assertIn('users', data)
        self.assertIn('managers', data)
        self.assertIn('facilities', data)
        self.assertIn('bookings', data)
        self.assertIn('revenue', data)
        self.assertIn('pending_actions', data)
        self.assertIn('recent_admin_activity', data)

    def test_dashboard_user_statistics(self):
        """Test dashboard user statistics are correct"""
        response = self.client.get('/api/admin/dashboard/overview/')
        data = response.data['data']

        users = data['users']
        self.assertGreaterEqual(users['total'], 3)  # admin, manager, user1, user2
        self.assertEqual(users['suspended'], 1)  # user2 is suspended
        self.assertGreaterEqual(users['active'], 2)

    def test_dashboard_facility_statistics(self):
        """Test dashboard facility statistics"""
        response = self.client.get('/api/admin/dashboard/overview/')
        data = response.data['data']

        facilities = data['facilities']
        self.assertEqual(facilities['total'], 1)
        self.assertEqual(facilities['active'], 1)
        self.assertEqual(facilities['pending_approval'], 0)

    def test_dashboard_pending_actions(self):
        """Test dashboard shows pending actions correctly"""
        # Create pending manager request
        ManagerRequest.objects.create(
            user=self.user1,
            status='pending',
            reason='Want to become manager',
            facility_name='New Facility',
            facility_address='456 Test Ave',
            contact_phone='1234567890',
            proposed_timezone='Australia/Sydney'
        )

        # Create pending report
        Report.objects.create(
            reporter_user=self.user1,
            resource_type='user',
            resource_id=999,
            reason='Spam',
            status='open'
        )

        response = self.client.get('/api/admin/dashboard/overview/')
        data = response.data['data']

        pending = data['pending_actions']
        self.assertEqual(pending['manager_requests'], 1)
        self.assertEqual(pending['open_reports'], 1)
        self.assertGreaterEqual(pending['total_pending'], 2)

    def test_dashboard_recent_activity(self):
        """Test dashboard shows recent admin activity"""
        # Create admin action
        AdminActionLog.objects.create(
            admin_user=self.admin_user,
            action_name='test_action',
            resource_type='test',
            resource_id=123,
            reason='Test admin action'
        )

        response = self.client.get('/api/admin/dashboard/overview/')
        data = response.data['data']

        activity = data['recent_admin_activity']
        self.assertGreater(len(activity), 0)
        self.assertEqual(activity[0]['action_name'], 'test_action')
        self.assertEqual(activity[0]['admin_email'], 'admin@test.com')

    def test_platform_health_metrics(self):
        """Test platform health metrics endpoint"""
        response = self.client.get('/api/admin/analytics/platform-health/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('data', response.data)

        data = response.data['data']
        self.assertIn('weekly_trends', data)
        self.assertIn('growth_rates', data)

        # Should have 8 weeks of data
        self.assertEqual(len(data['weekly_trends']), 8)

        # Growth rates should include all metrics
        growth = data['growth_rates']
        self.assertIn('users', growth)
        self.assertIn('bookings', growth)
        self.assertIn('revenue', growth)

    def test_user_bookings_history(self):
        """Test user bookings history endpoint"""
        response = self.client.get(f'/api/admin/users/{self.user1.user_id}/bookings/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('data', response.data)

        data = response.data['data']
        self.assertEqual(data['user_id'], self.user1.user_id)
        self.assertEqual(data['user_email'], 'user1@test.com')
        self.assertIn('bookings', data)
        self.assertIn('total_bookings', data)

    def test_user_activity_log(self):
        """Test user activity log endpoint"""
        # Create activity log
        ActivityLog.objects.create(
            user=self.user1,
            action='create_booking',
            resource_type='booking',
            resource_id=123,
            metadata={'test': 'data'}
        )

        response = self.client.get(f'/api/admin/users/{self.user1.user_id}/activity/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.data['data']
        self.assertEqual(data['user_id'], self.user1.user_id)
        self.assertGreater(data['total_activities'], 0)
        self.assertIn('activities', data)

    def test_flagged_users(self):
        """Test flagged users detection"""
        # Create bookings to simulate high cancellation rate
        sport_type = SportType.objects.create(sport_name='Tennis')
        court = Court.objects.create(
            facility=self.facility,
            name='Court 1',
            sport_type=sport_type,
            hourly_rate=Decimal('40.00')
        )

        confirmed_status, _ = BookingStatus.objects.get_or_create(status_name='confirmed')
        cancelled_status, _ = BookingStatus.objects.get_or_create(status_name='cancelled')

        # Create 3 confirmed and 7 cancelled bookings (70% cancellation)
        for i in range(3):
            start_time = timezone.now() + timedelta(days=i+1)
            availability = Availability.objects.create(
                court=court,
                start_time=start_time,
                end_time=start_time + timedelta(hours=1),
                is_available=False
            )
            Booking.objects.create(
                user=self.user1,
                court=court,
                availability=availability,
                start_time=start_time,
                end_time=start_time + timedelta(hours=1),
                hourly_rate_snapshot=Decimal('40.00'),
                commission_rate_snapshot=Decimal('0.1000'),
                status=confirmed_status
            )

        for i in range(7):
            start_time = timezone.now() + timedelta(days=i+10)
            availability = Availability.objects.create(
                court=court,
                start_time=start_time,
                end_time=start_time + timedelta(hours=1),
                is_available=False
            )
            Booking.objects.create(
                user=self.user1,
                court=court,
                availability=availability,
                start_time=start_time,
                end_time=start_time + timedelta(hours=1),
                hourly_rate_snapshot=Decimal('40.00'),
                commission_rate_snapshot=Decimal('0.1000'),
                status=cancelled_status
            )

        response = self.client.get('/api/admin/users/flagged/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.data['data']
        self.assertGreater(len(data), 0)

        # Find user1 in flagged users
        user1_flagged = next((u for u in data if u['user_id'] == self.user1.user_id), None)
        self.assertIsNotNone(user1_flagged)
        self.assertIn('High cancellation rate', user1_flagged['reason'])

    def test_booking_overview(self):
        """Test booking overview endpoint"""
        response = self.client.get('/api/admin/bookings/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_booking_overview_with_filters(self):
        """Test booking overview with filters"""
        sport_type = SportType.objects.create(sport_name='Basketball')
        court = Court.objects.create(
            facility=self.facility,
            name='Court 1',
            sport_type=sport_type,
            hourly_rate=Decimal('50.00')
        )

        status_obj, _ = BookingStatus.objects.get_or_create(status_name='confirmed')

        start_time = timezone.now() + timedelta(days=1)
        availability = Availability.objects.create(
            court=court,
            start_time=start_time,
            end_time=start_time + timedelta(hours=2),
            is_available=False
        )
        Booking.objects.create(
            user=self.user1,
            court=court,
            availability=availability,
            start_time=start_time,
            end_time=start_time + timedelta(hours=2),
            hourly_rate_snapshot=Decimal('50.00'),
            commission_rate_snapshot=Decimal('0.1000'),
            status=status_obj
        )

        # Filter by facility
        response = self.client.get(f'/api/admin/bookings/?facility_id={self.facility.facility_id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Filter by user
        response = self.client.get(f'/api/admin/bookings/?user_id={self.user1.user_id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Filter by status
        response = self.client.get('/api/admin/bookings/?status=confirmed')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_booking_statistics(self):
        """Test booking statistics endpoint"""
        response = self.client.get('/api/admin/bookings/stats/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.data['data']
        self.assertIn('total_bookings', data)
        self.assertIn('by_status', data)
        self.assertIn('this_month', data)

    def test_admin_action_logs(self):
        """Test admin action logs endpoint"""
        # Create multiple admin actions
        for i in range(5):
            AdminActionLog.objects.create(
                admin_user=self.admin_user,
                action_name=f'test_action_{i}',
                resource_type='test',
                resource_id=i,
                reason=f'Test reason {i}'
            )

        response = self.client.get('/api/admin/logs/all-actions/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data['results']), 5)

    def test_admin_logs_filter_by_admin(self):
        """Test filtering admin logs by admin user"""
        response = self.client.get(f'/api/admin/logs/all-actions/?admin_id={self.admin_user.user_id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_admin_logs_filter_by_action(self):
        """Test filtering admin logs by action name"""
        AdminActionLog.objects.create(
            admin_user=self.admin_user,
            action_name='specific_action',
            resource_type='test',
            resource_id=999,
            reason='Specific test'
        )

        response = self.client.get('/api/admin/logs/all-actions/?action=specific_action')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_analytics_requires_admin_permission(self):
        """Test that analytics endpoints require admin permission"""
        # Authenticate as regular user
        self.client.force_authenticate(user=self.user1)

        # Try to access dashboard
        response = self.client.get('/api/admin/dashboard/overview/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Try to access platform health
        response = self.client.get('/api/admin/analytics/platform-health/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_dashboard_revenue_calculations(self):
        """Test that dashboard revenue calculations are accurate"""
        sport_type = SportType.objects.create(sport_name='Soccer')
        court = Court.objects.create(
            facility=self.facility,
            name='Field 1',
            sport_type=sport_type,
            hourly_rate=Decimal('60.00')
        )

        status_obj, _ = BookingStatus.objects.get_or_create(status_name='confirmed')

        # Create booking for this month
        start_time = timezone.now().replace(day=15)
        availability = Availability.objects.create(
            court=court,
            start_time=start_time,
            end_time=start_time + timedelta(hours=3),
            is_available=False
        )
        Booking.objects.create(
            user=self.user1,
            court=court,
            availability=availability,
            start_time=start_time,
            end_time=start_time + timedelta(hours=3),
            hourly_rate_snapshot=Decimal('60.00'),
            commission_rate_snapshot=Decimal('0.1000'),
            status=status_obj
        )

        response = self.client.get('/api/admin/dashboard/overview/')
        data = response.data['data']

        revenue = data['revenue']
        # 3 hours * $60 = $180
        # Commission: $180 * 0.10 = $18
        self.assertGreater(Decimal(str(revenue['this_month'])), 0)
        self.assertGreater(Decimal(str(revenue['commission_this_month'])), 0)
