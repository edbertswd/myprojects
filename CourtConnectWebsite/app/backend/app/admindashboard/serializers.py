from rest_framework import serializers
from app.users.models import User, Session, Manager
from app.admindashboard.models import ManagerRequest, ManagerSuspension, FacilitySuspension, RefundRequest, CommissionAdjustment, Report
from app.facilities.models import Facility
from app.bookings.models import Booking
from django.db.models import Max, Count, Sum, Q, Avg
from django.utils import timezone


class UserListSerializer(serializers.ModelSerializer):
    """Serializer for user list in admin moderation panel"""
    role = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    last_active = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'user_id',
            'name',
            'email',
            'role',
            'status',
            'last_active',
        ]

    def get_role(self, obj):
        """Determine user role based on permissions"""
        if obj.is_superuser or obj.is_admin:
            return 'admin'
        if hasattr(obj, 'manager'):
            return 'manager'
        return 'user'

    def get_status(self, obj):
        """Map is_active to status"""
        return 'active' if obj.is_active else 'suspended'

    def get_last_active(self, obj):
        """Get last active timestamp from most recent session"""
        last_session = Session.objects.filter(
            user=obj
        ).order_by('-created_at').first()

        if last_session:
            return last_session.created_at.isoformat()
        return None


class UserDetailSerializer(UserListSerializer):
    """Extended serializer with more details for individual user view"""

    class Meta(UserListSerializer.Meta):
        fields = UserListSerializer.Meta.fields + [
            'phone_number',
            'verification_status',
            'created_at',
            'updated_at',
        ]


# Manager Moderation Serializers

class ManagerRequestSerializer(serializers.ModelSerializer):
    """Serializer for manager application requests"""
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.name', read_only=True)
    admin_email = serializers.EmailField(source='admin_user.email', read_only=True, allow_null=True)
    approved_facility_id = serializers.IntegerField(source='approved_facility.facility_id', read_only=True, allow_null=True)
    approved_facility_name = serializers.CharField(source='approved_facility.facility_name', read_only=True, allow_null=True)

    class Meta:
        model = ManagerRequest
        fields = [
            'request_id',
            'user',
            'user_email',
            'user_name',
            'status',
            'admin_user',
            'admin_email',
            'decided_at',
            'reason',
            'facility_name',
            'facility_address',
            'contact_phone',
            'proposed_timezone',
            'proposed_latitude',
            'proposed_longitude',
            'court_count',
            'operating_hours',
            'business_experience',
            'approved_facility',
            'approved_facility_id',
            'approved_facility_name',
            'created_at',
        ]
        read_only_fields = ['request_id', 'created_at', 'decided_at', 'approved_facility']


class ManagerRequestActionSerializer(serializers.Serializer):
    """Serializer for approving/rejecting manager requests"""
    reason = serializers.CharField(required=True, min_length=10, max_length=1000, help_text='Reason for approval/rejection (mandatory)')


class ManagerListSerializer(serializers.ModelSerializer):
    """Serializer for listing managers"""
    user_id = serializers.IntegerField(source='user.user_id', read_only=True)
    name = serializers.CharField(source='user.name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    phone_number = serializers.CharField(source='user.phone_number', read_only=True)
    facility_count = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()

    class Meta:
        model = Manager
        fields = [
            'user_id',
            'name',
            'email',
            'phone_number',
            'payment_provider',
            'payout_verification_status',
            'is_suspended',
            'facility_count',
            'status',
            'created_at',
            'updated_at',
        ]

    def get_facility_count(self, obj):
        """Count active facilities managed by this manager"""
        return Facility.objects.filter(manager=obj, is_active=True).count()

    def get_status(self, obj):
        """Determine manager status"""
        if obj.is_suspended:
            return 'suspended'
        elif obj.user.is_active:
            return 'active'
        else:
            return 'inactive'


class ManagerDetailSerializer(ManagerListSerializer):
    """Extended manager details with facilities"""
    facilities = serializers.SerializerMethodField()
    suspension_history = serializers.SerializerMethodField()

    class Meta(ManagerListSerializer.Meta):
        fields = ManagerListSerializer.Meta.fields + ['facilities', 'suspension_history']

    def get_facilities(self, obj):
        """Get list of facilities managed"""
        facilities = Facility.objects.filter(manager=obj).values(
            'facility_id', 'facility_name', 'address', 'is_active', 'is_suspended',
            'approval_status', 'created_at'
        )
        return list(facilities)

    def get_suspension_history(self, obj):
        """Get suspension history"""
        suspensions = ManagerSuspension.objects.filter(manager=obj).values(
            'suspension_id', 'reason', 'status', 'suspended_at',
            'unsuspended_at', 'duration_days'
        ).order_by('-suspended_at')[:5]
        return list(suspensions)


class ManagerSuspensionSerializer(serializers.Serializer):
    """Serializer for suspending a manager"""
    reason = serializers.CharField(required=True, min_length=10, max_length=2000, help_text='Reason for suspension (mandatory)')
    duration_days = serializers.IntegerField(required=False, allow_null=True, min_value=1, max_value=365, help_text='Suspension duration in days. Leave blank for indefinite.')


class ManagerUnsuspensionSerializer(serializers.Serializer):
    """Serializer for unsuspending a manager"""
    reason = serializers.CharField(required=True, min_length=10, max_length=2000, help_text='Reason for unsuspension (mandatory)')


class ManagerPerformanceSerializer(serializers.Serializer):
    """Serializer for manager performance analytics"""
    manager_id = serializers.IntegerField()
    manager_name = serializers.CharField()
    manager_email = serializers.EmailField()
    total_facilities = serializers.IntegerField()
    active_facilities = serializers.IntegerField()
    suspended_facilities = serializers.IntegerField()
    total_courts = serializers.IntegerField()
    total_bookings = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=15, decimal_places=2)
    commission_collected = serializers.DecimalField(max_digits=15, decimal_places=2)
    average_facility_rating = serializers.FloatField(allow_null=True)
    bookings_this_month = serializers.IntegerField()
    revenue_this_month = serializers.DecimalField(max_digits=15, decimal_places=2)


# Facility Moderation Serializers

class FacilityApprovalActionSerializer(serializers.Serializer):
    """Serializer for approving/rejecting facility applications"""
    reason = serializers.CharField(required=True, min_length=10, max_length=1000, help_text='Reason for approval/rejection (mandatory)')


class FacilitySuspensionSerializer(serializers.Serializer):
    """Serializer for suspending a facility"""
    reason = serializers.CharField(required=True, min_length=10, max_length=2000, help_text='Reason for suspension (mandatory)')
    duration_days = serializers.IntegerField(required=False, allow_null=True, min_value=1, max_value=365, help_text='Suspension duration in days. Leave blank for indefinite.')


class FacilityUnsuspensionSerializer(serializers.Serializer):
    """Serializer for unsuspending a facility"""
    reason = serializers.CharField(required=True, min_length=10, max_length=2000, help_text='Reason for unsuspension (mandatory)')


class CommissionAdjustmentSerializer(serializers.Serializer):
    """Serializer for adjusting facility commission rate"""
    new_rate = serializers.DecimalField(required=True, max_digits=5, decimal_places=4, min_value=0, max_value=1, help_text='New commission rate as decimal (e.g., 0.15 for 15%)')
    reason = serializers.CharField(required=True, min_length=10, max_length=2000, help_text='Reason for commission adjustment (mandatory)')
    effective_date = serializers.DateTimeField(required=False, help_text='When this rate takes effect. Defaults to now.')


class FacilityAnalyticsSerializer(serializers.Serializer):
    """Serializer for facility analytics"""
    facility_id = serializers.IntegerField()
    facility_name = serializers.CharField()
    manager_name = serializers.CharField()
    total_courts = serializers.IntegerField()
    active_courts = serializers.IntegerField()
    total_bookings = serializers.IntegerField()
    completed_bookings = serializers.IntegerField()
    cancelled_bookings = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=15, decimal_places=2)
    commission_collected = serializers.DecimalField(max_digits=15, decimal_places=2)
    average_booking_rate = serializers.FloatField()
    bookings_this_month = serializers.IntegerField()
    revenue_this_month = serializers.DecimalField(max_digits=15, decimal_places=2)
    peak_booking_hour = serializers.IntegerField(allow_null=True)
    most_popular_sport = serializers.CharField(allow_null=True)


# Refund Management Serializers

class RefundRequestSerializer(serializers.ModelSerializer):
    """Serializer for refund requests"""
    user_email = serializers.EmailField(source='requested_by.email', read_only=True)
    user_name = serializers.CharField(source='requested_by.name', read_only=True)
    booking_details = serializers.SerializerMethodField()
    reviewer_email = serializers.EmailField(source='reviewed_by.email', read_only=True, allow_null=True)

    class Meta:
        model = RefundRequest
        fields = [
            'request_id',
            'booking',
            'booking_details',
            'requested_by',
            'user_email',
            'user_name',
            'reason',
            'amount',
            'status',
            'reviewed_by',
            'reviewer_email',
            'review_reason',
            'created_at',
            'reviewed_at',
            'processed_at',
            'refund_transaction_id',
        ]
        read_only_fields = ['request_id', 'created_at', 'reviewed_at', 'processed_at']

    def get_booking_details(self, obj):
        """Get booking details"""
        booking = obj.booking
        return {
            'booking_id': booking.booking_id,
            'court_name': booking.court.name,
            'facility_name': booking.court.facility.facility_name,
            'start_time': booking.start_time,
            'end_time': booking.end_time,
            'status': booking.status.status_name if booking.status else None,
        }


class RefundActionSerializer(serializers.Serializer):
    """Serializer for approving/rejecting refund requests"""
    reason = serializers.CharField(required=True, min_length=10, max_length=2000, help_text='Reason for approval/rejection (mandatory)')


# Report Moderation Serializers

class ReportSerializer(serializers.ModelSerializer):
    """Serializer for user reports"""
    reporter_email = serializers.EmailField(source='reporter_user.email', read_only=True)
    reporter_name = serializers.CharField(source='reporter_user.name', read_only=True)
    assigned_to_email = serializers.EmailField(source='assigned_to.email', read_only=True, allow_null=True)
    resolved_by_email = serializers.EmailField(source='resolved_by.email', read_only=True, allow_null=True)

    class Meta:
        model = Report
        fields = [
            'report_id',
            'reporter_user',
            'reporter_email',
            'reporter_name',
            'resource_type',
            'resource_id',
            'reason',
            'severity',
            'category',
            'status',
            'assigned_to',
            'assigned_to_email',
            'resolved_by',
            'resolved_by_email',
            'resolution_note',
            'created_at',
            'resolved_at',
        ]
        read_only_fields = ['report_id', 'created_at', 'resolved_at']


class ReportActionSerializer(serializers.Serializer):
    """Serializer for resolving/dismissing reports"""
    resolution_note = serializers.CharField(required=True, min_length=10, max_length=2000, help_text='Resolution note explaining action taken (mandatory)')
    action_taken = serializers.ChoiceField(
        required=False,
        choices=['none', 'user_suspended', 'facility_suspended', 'manager_suspended', 'content_removed', 'warning_issued'],
        help_text='Action taken based on report'
    )
