"""
Tests for Report & Content Moderation functionality
"""

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status

from app.users.models import User
from app.admindashboard.models import Report, AdminActionLog


class ReportModerationTestCase(TestCase):
    """Test report moderation endpoints"""

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

        # Create reporter user
        self.reporter_user = User.objects.create_user(
            email='reporter@test.com',
            name='Reporter User',
            password='testpass123'
        )

        # Create report
        self.report = Report.objects.create(
            reporter_user=self.reporter_user,
            resource_type='user',
            resource_id=999,
            reason='User posted inappropriate content',
            severity='high',
            category='inappropriate',
            status='open'
        )

        # Authenticate as admin using force_authenticate for tests
        self.client.force_authenticate(user=self.admin_user)
        

    def test_list_reports(self):
        """Test listing reports"""
        response = self.client.get('/api/admin/reports/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('data', response.data)
        self.assertEqual(len(response.data['data']), 1)

    def test_list_reports_filter_by_status(self):
        """Test filtering reports by status"""
        response = self.client.get('/api/admin/reports/?status=open')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['data']), 1)

        response = self.client.get('/api/admin/reports/?status=resolved')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['data']), 0)

    def test_list_reports_filter_by_severity(self):
        """Test filtering reports by severity"""
        response = self.client.get('/api/admin/reports/?severity=high')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['data']), 1)

        response = self.client.get('/api/admin/reports/?severity=low')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['data']), 0)

    def test_list_reports_filter_by_category(self):
        """Test filtering reports by category"""
        response = self.client.get('/api/admin/reports/?category=inappropriate')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['data']), 1)

        response = self.client.get('/api/admin/reports/?category=spam')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['data']), 0)

    def test_get_report_detail(self):
        """Test retrieving report details"""
        response = self.client.get(f'/api/admin/reports/{self.report.report_id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['data']['report_id'], self.report.report_id)
        self.assertEqual(response.data['data']['severity'], 'high')
        self.assertEqual(response.data['data']['category'], 'inappropriate')

    def test_assign_report(self):
        """Test assigning report to admin"""
        response = self.client.post(
            f'/api/admin/reports/{self.report.report_id}/assign/',
            data={'admin_user_id': self.admin_user.user_id}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify report assigned
        self.report.refresh_from_db()
        self.assertEqual(self.report.assigned_to, self.admin_user)
        self.assertEqual(self.report.status, 'in_review')

    def test_assign_report_missing_admin_id(self):
        """Test that assigning report requires admin_user_id"""
        response = self.client.post(
            f'/api/admin/reports/{self.report.report_id}/assign/',
            data={}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_resolve_report_missing_resolution_note(self):
        """Test that resolving report requires resolution note"""
        response = self.client.post(
            f'/api/admin/reports/{self.report.report_id}/resolve/',
            data={}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('resolution_note', response.data)

    def test_resolve_report_note_too_short(self):
        """Test that resolution note must be at least 10 characters"""
        response = self.client.post(
            f'/api/admin/reports/{self.report.report_id}/resolve/',
            data={'resolution_note': 'Done'}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_resolve_report_success(self):
        """Test successful report resolution"""
        response = self.client.post(
            f'/api/admin/reports/{self.report.report_id}/resolve/',
            data={
                'resolution_note': 'Investigated and confirmed inappropriate content. User has been warned and content removed.',
                'action_taken': 'warning_issued'
            }
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify report resolved
        self.report.refresh_from_db()
        self.assertEqual(self.report.status, 'resolved')
        self.assertEqual(self.report.resolved_by, self.admin_user)
        self.assertIsNotNone(self.report.resolved_at)

        # Verify admin action logged
        log = AdminActionLog.objects.get(
            admin_user=self.admin_user,
            action_name='resolve_report',
            resource_id=self.report.report_id
        )
        self.assertEqual(log.metadata['action_taken'], 'warning_issued')
        self.assertEqual(log.metadata['severity'], 'high')

    def test_resolve_already_resolved_report(self):
        """Test that resolving already resolved report fails"""
        self.report.status = 'resolved'
        self.report.save()

        response = self.client.post(
            f'/api/admin/reports/{self.report.report_id}/resolve/',
            data={'resolution_note': 'Trying to resolve again'}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_dismiss_report_success(self):
        """Test successful report dismissal"""
        response = self.client.post(
            f'/api/admin/reports/{self.report.report_id}/dismiss/',
            data={'resolution_note': 'Dismissed as report was duplicate of existing case and already handled'}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify report dismissed
        self.report.refresh_from_db()
        self.assertEqual(self.report.status, 'dismissed')
        self.assertEqual(self.report.resolved_by, self.admin_user)

        # Verify admin action logged
        self.assertTrue(AdminActionLog.objects.filter(
            admin_user=self.admin_user,
            action_name='dismiss_report',
            resource_id=self.report.report_id
        ).exists())

    def test_dismiss_already_dismissed_report(self):
        """Test that dismissing already dismissed report fails"""
        self.report.status = 'dismissed'
        self.report.save()

        response = self.client.post(
            f'/api/admin/reports/{self.report.report_id}/dismiss/',
            data={'resolution_note': 'Trying to dismiss again'}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_report_trends(self):
        """Test report trends endpoint"""
        # Create more reports for better trends
        Report.objects.create(
            reporter_user=self.reporter_user,
            resource_type='facility',
            resource_id=123,
            reason='Facility maintenance issues',
            severity='medium',
            category='other',
            status='open'
        )

        Report.objects.create(
            reporter_user=self.reporter_user,
            resource_type='user',
            resource_id=456,
            reason='Spam messages',
            severity='low',
            category='spam',
            status='resolved'
        )

        response = self.client.get('/api/admin/reports/trends/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('data', response.data)

        data = response.data['data']
        self.assertIn('by_status', data)
        self.assertIn('by_severity', data)
        self.assertIn('by_category', data)
        self.assertIn('most_reported_resources', data)
        self.assertIn('critical_open_reports', data)

        # Verify counts
        self.assertEqual(data['by_status']['open'], 2)
        self.assertEqual(data['by_status']['resolved'], 1)

    def test_filter_reports_assigned_to_me(self):
        """Test filtering reports assigned to current admin"""
        # Assign report to admin
        self.report.assigned_to = self.admin_user
        self.report.save()

        response = self.client.get('/api/admin/reports/?assigned_to_me=true')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['data']), 1)

    def test_filter_reports_by_resource_type(self):
        """Test filtering reports by resource type"""
        response = self.client.get('/api/admin/reports/?resource_type=user')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['data']), 1)

        response = self.client.get('/api/admin/reports/?resource_type=facility')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['data']), 0)

    def test_report_moderation_requires_admin(self):
        """Test that report moderation requires admin permission"""
        # Authenticate as regular user
        self.client.force_authenticate(user=self.reporter_user)

        response = self.client.post(
            f'/api/admin/reports/{self.report.report_id}/resolve/',
            data={'resolution_note': 'Trying as regular user'}
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_critical_reports_in_trends(self):
        """Test that critical reports are highlighted in trends"""
        # Create critical report
        critical_report = Report.objects.create(
            reporter_user=self.reporter_user,
            resource_type='user',
            resource_id=789,
            reason='Fraudulent activity detected',
            severity='critical',
            category='fraud',
            status='open'
        )

        response = self.client.get('/api/admin/reports/trends/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.data['data']
        self.assertGreater(len(data['critical_open_reports']), 0)

        # Verify critical report in list
        critical_ids = [r['report_id'] for r in data['critical_open_reports']]
        self.assertIn(critical_report.report_id, critical_ids)
