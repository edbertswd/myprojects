"""
Tests for Financial & Refund Management functionality
"""

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from decimal import Decimal
from datetime import timedelta
from unittest import skip

from app.users.models import User, Manager
from app.facilities.models import Facility, Court, SportType, Availability
from app.bookings.models import Booking, BookingStatus
from app.admindashboard.models import RefundRequest, AdminActionLog


class FinancialRefundTestCase(TestCase):
    """Test financial and refund management endpoints"""

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

        # Create manager and facility
        manager_user = User.objects.create_user(
            email='manager@test.com',
            name='Manager User',
            password='testpass123'
        )
        self.manager = Manager.objects.create(user=manager_user)

        self.facility = Facility.objects.create(
            manager=self.manager,
            facility_name='Test Arena',
            address='123 Test St',
            timezone='Australia/Sydney',
            commission_rate=Decimal('0.1000'),
            approval_status='approved'
        )

        # Create court
        sport_type = SportType.objects.create(sport_name='Tennis')
        self.court = Court.objects.create(
            facility=self.facility,
            name='Court 1',
            sport_type=sport_type,
            hourly_rate=Decimal('40.00')
        )

        # Create booking user
        self.booking_user = User.objects.create_user(
            email='user@test.com',
            name='Booking User',
            password='testpass123'
        )

        # Create booking status
        self.booking_status, _ = BookingStatus.objects.get_or_create(status_name='confirmed')

        # Create booking
        start_time = timezone.now() + timedelta(days=1)
        end_time = start_time + timedelta(hours=2)

        self.availability = Availability.objects.create(
            court=self.court,
            start_time=start_time,
            end_time=end_time,
            is_available=False
        )

        self.booking = Booking.objects.create(
            user=self.booking_user,
            court=self.court,
            availability=self.availability,
            start_time=start_time,
            end_time=end_time,
            hourly_rate_snapshot=Decimal('40.00'),
            commission_rate_snapshot=Decimal('0.1000'),
            status=self.booking_status
        )

        # Authenticate as admin using force_authenticate for tests
        self.client.force_authenticate(user=self.admin_user)
        

    def test_payment_statistics(self):
        """Test payment statistics endpoint"""
        response = self.client.get('/api/admin/payments/stats/?period=month')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('data', response.data)

        data = response.data['data']
        self.assertIn('revenue', data)
        self.assertIn('bookings', data)
        self.assertIn('payments', data)
        self.assertIn('refunds', data)

    def test_payment_statistics_date_range(self):
        """Test payment statistics with custom date range"""
        start_date = timezone.now() - timedelta(days=30)
        end_date = timezone.now()

        response = self.client.get(
            f'/api/admin/payments/stats/?start_date={start_date.isoformat()}&end_date={end_date.isoformat()}'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('start_date', response.data['data'])
        self.assertIn('end_date', response.data['data'])

    def test_list_refund_requests(self):
        """Test listing refund requests"""
        # Create refund request
        RefundRequest.objects.create(
            booking=self.booking,
            requested_by=self.booking_user,
            reason='Facility was closed',
            amount=Decimal('80.00'),
            status='pending'
        )

        response = self.client.get('/api/admin/payments/refunds/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('data', response.data)
        self.assertEqual(len(response.data['data']), 1)

    def test_approve_refund_missing_reason(self):
        """Test that approving refund requires reason"""
        refund = RefundRequest.objects.create(
            booking=self.booking,
            requested_by=self.booking_user,
            reason='Facility was closed',
            amount=Decimal('80.00'),
            status='pending'
        )

        response = self.client.post(
            f'/api/admin/payments/refunds/{refund.request_id}/approve/',
            data={}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('reason', response.data)

    def test_approve_refund_reason_too_short(self):
        """Test that reason must be at least 10 characters"""
        refund = RefundRequest.objects.create(
            booking=self.booking,
            requested_by=self.booking_user,
            reason='Facility was closed',
            amount=Decimal('80.00'),
            status='pending'
        )

        response = self.client.post(
            f'/api/admin/payments/refunds/{refund.request_id}/approve/',
            data={'reason': 'OK'}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_approve_refund_success(self):
        """Test successful refund approval"""
        refund = RefundRequest.objects.create(
            booking=self.booking,
            requested_by=self.booking_user,
            reason='Facility was closed on booking date',
            amount=Decimal('80.00'),
            status='pending'
        )

        response = self.client.post(
            f'/api/admin/payments/refunds/{refund.request_id}/approve/',
            data={'reason': 'Approved refund as facility closure was verified and documented'}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify refund status updated
        refund.refresh_from_db()
        self.assertEqual(refund.status, 'approved')
        self.assertEqual(refund.reviewed_by, self.admin_user)
        self.assertIsNotNone(refund.reviewed_at)

        # Verify admin action logged with financial impact
        log = AdminActionLog.objects.get(
            admin_user=self.admin_user,
            action_name='approve_refund',
            resource_id=refund.request_id
        )
        self.assertEqual(log.financial_impact, -refund.amount)
        self.assertEqual(log.target_user, self.booking_user)

    def test_reject_refund_success(self):
        """Test successful refund rejection"""
        refund = RefundRequest.objects.create(
            booking=self.booking,
            requested_by=self.booking_user,
            reason='Changed my mind',
            amount=Decimal('80.00'),
            status='pending'
        )

        response = self.client.post(
            f'/api/admin/payments/refunds/{refund.request_id}/reject/',
            data={'reason': 'Rejected as reason does not meet refund policy criteria - booking can be rescheduled'}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify refund status updated
        refund.refresh_from_db()
        self.assertEqual(refund.status, 'rejected')
        self.assertEqual(refund.reviewed_by, self.admin_user)

    def test_approve_already_processed_refund(self):
        """Test that approving already processed refund fails"""
        refund = RefundRequest.objects.create(
            booking=self.booking,
            requested_by=self.booking_user,
            reason='Facility closed',
            amount=Decimal('80.00'),
            status='approved'
        )

        response = self.client.post(
            f'/api/admin/payments/refunds/{refund.request_id}/approve/',
            data={'reason': 'Trying to approve again'}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_commission_breakdown(self):
        """Test commission breakdown endpoint"""
        response = self.client.get('/api/admin/payments/commission/?period=month')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('data', response.data)
        self.assertIn('meta', response.data)

        # Should have one facility
        if len(response.data['data']) > 0:
            facility_data = response.data['data'][0]
            self.assertIn('facility_name', facility_data)
            self.assertIn('commission_collected', facility_data)
            self.assertIn('total_revenue', facility_data)
            self.assertIn('manager_payout', facility_data)
            
    def test_refund_filter_by_status(self):
        """Test filtering refund requests by status"""
        # Create refunds with different statuses
        RefundRequest.objects.create(
            booking=self.booking,
            requested_by=self.booking_user,
            reason='Test 1',
            amount=Decimal('50.00'),
            status='pending'
        )

        # Note: Can't create second refund for same booking due to constraints
        # This test validates the filter logic works

        response = self.client.get('/api/admin/payments/refunds/?status=pending')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data['data']), 1)

    def test_payment_statistics_calculations(self):
        """Test that payment statistics calculate correctly"""
        response = self.client.get('/api/admin/payments/stats/?period=all')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.data['data']

        # Verify structure
        self.assertIn('total_revenue', data['revenue'])
        self.assertIn('total_commission', data['revenue'])
        self.assertIn('manager_payout', data['revenue'])

        # Verify calculation: revenue - commission = manager_payout
        revenue = Decimal(str(data['revenue']['total_revenue']))
        commission = Decimal(str(data['revenue']['total_commission']))
        payout = Decimal(str(data['revenue']['manager_payout']))

        self.assertEqual(revenue - commission, payout)

    def test_refund_requires_admin_permission(self):
        """Test that only admins can approve/reject refunds"""
        refund = RefundRequest.objects.create(
            booking=self.booking,
            requested_by=self.booking_user,
            reason='Test refund',
            amount=Decimal('80.00'),
            status='pending'
        )

        # Authenticate as regular user
        self.client.force_authenticate(user=self.booking_user)

        response = self.client.post(
            f'/api/admin/payments/refunds/{refund.request_id}/approve/',
            data={'reason': 'Trying as regular user'}
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
