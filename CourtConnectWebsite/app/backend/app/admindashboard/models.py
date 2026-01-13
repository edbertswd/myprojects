from django.db import models


class Report(models.Model):
    SEVERITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]

    CATEGORY_CHOICES = [
        ('spam', 'Spam'),
        ('fraud', 'Fraud'),
        ('harassment', 'Harassment'),
        ('inappropriate', 'Inappropriate Content'),
        ('policy_violation', 'Policy Violation'),
        ('other', 'Other'),
    ]

    STATUS_CHOICES = [
        ('open', 'Open'),
        ('in_review', 'In Review'),
        ('resolved', 'Resolved'),
        ('dismissed', 'Dismissed'),
    ]

    report_id = models.BigAutoField(primary_key=True)
    reporter_user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='reported_by')
    resource_type = models.CharField(max_length=50)
    resource_id = models.BigIntegerField()
    reason = models.TextField(null=True, blank=True)
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='medium')
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='other')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    assigned_to = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_reports')
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolved_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='resolved_reports')
    resolution_note = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'reports'
        indexes = [
            models.Index(fields=['resource_type', 'resource_id'], name='idx_reports_resource'),
            models.Index(fields=['status'], name='idx_reports_status'),
            models.Index(fields=['severity', 'created_at'], name='idx_reports_severity'),
            models.Index(fields=['assigned_to'], name='idx_reports_assigned'),
        ]

    def __str__(self):
        """
        Return string representation of the report.

        Returns:
            str: Formatted string with report ID, resource type, and resource ID
        """
        return f"Report {self.report_id} - {self.resource_type} {self.resource_id}"


class ActivityLog(models.Model):
    activity_id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=64)
    resource_type = models.CharField(max_length=50, null=True, blank=True)
    resource_id = models.BigIntegerField(null=True, blank=True)
    metadata = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'activity_log'
        indexes = [
            models.Index(fields=['user', 'created_at'], name='idx_activity_user_time'),
            models.Index(fields=['action'], name='idx_activity_action'),
        ]

    def __str__(self):
        """
        Return string representation of the activity log entry.

        Returns:
            str: Formatted string with activity ID and action name
        """
        return f"Activity {self.activity_id} - {self.action}"


class AdminActionLog(models.Model):
    action_id = models.BigAutoField(primary_key=True)
    admin_user = models.ForeignKey('users.User', on_delete=models.RESTRICT, related_name='admin_actions')
    action_name = models.CharField(max_length=255)
    resource_type = models.CharField(max_length=255)
    resource_id = models.BigIntegerField()
    reason = models.TextField()  # Changed from CharField to TextField to support reasons up to 2000 characters
    financial_impact = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    metadata = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    target_user = models.ForeignKey('users.User', on_delete=models.RESTRICT, null=True, blank=True, related_name='admin_actions_received')

    class Meta:
        db_table = 'admin_action_log'

    def __str__(self):
        """
        Return string representation of the admin action log entry.

        Returns:
            str: Formatted string with action ID and action name
        """
        return f"Admin Action {self.action_id} - {self.action_name}"


class ManagerRequest(models.Model):
    request_id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey('users.User', on_delete=models.CASCADE)
    status = models.CharField(max_length=20, default='pending')
    admin_user = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='processed_manager_requests')
    decided_at = models.DateTimeField(null=True, blank=True)
    reason = models.TextField()
    facility_name = models.CharField(max_length=255)
    facility_address = models.CharField(max_length=500)
    contact_phone = models.CharField(max_length=32)
    proposed_timezone = models.CharField(max_length=50)
    proposed_latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    proposed_longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    court_count = models.IntegerField(null=True, blank=True)
    operating_hours = models.JSONField(null=True, blank=True)
    business_experience = models.TextField(null=True, blank=True)
    approved_facility = models.ForeignKey('facilities.Facility', on_delete=models.SET_NULL, null=True, blank=True, related_name='manager_request')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'manager_requests'
        constraints = [
            models.UniqueConstraint(
                fields=['facility_name', 'facility_address', 'user'],
                name='ux_mgr_req_user_facility_key'
            )
        ]
        indexes = [
            models.Index(fields=['user'], name='idx_mgr_req_user'),
        ]

    def __str__(self):
        """
        Return string representation of the manager request.

        Returns:
            str: Formatted string with request ID and facility name
        """
        return f"Manager Request {self.request_id} - {self.facility_name}"


class ManagerRequestSportType(models.Model):
    request = models.ForeignKey(ManagerRequest, on_delete=models.CASCADE)
    sport_type = models.ForeignKey('facilities.SportType', on_delete=models.RESTRICT)

    class Meta:
        db_table = 'manager_request_sport_types'
        constraints = [
            models.UniqueConstraint(fields=['request', 'sport_type'], name='unique_request_sport_type')
        ]

    def __str__(self):
        """
        Return string representation of the manager request sport type.

        Returns:
            str: Formatted string with request and sport type
        """
        return f"{self.request} - {self.sport_type}"


class FacilityRequest(models.Model):
    request_id = models.BigAutoField(primary_key=True)
    submitted_by = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='facility_requests')
    status = models.CharField(max_length=20, default='pending')
    admin_user = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='processed_facility_requests')
    decided_at = models.DateTimeField(null=True, blank=True)
    motivation = models.TextField()
    facility_name = models.CharField(max_length=255)
    facility_address = models.CharField(max_length=500)
    contact_phone = models.CharField(max_length=32)
    proposed_timezone = models.CharField(max_length=50)
    proposed_latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    proposed_longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    court_count = models.IntegerField(null=True, blank=True)
    operating_hours = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    approved_facility = models.ForeignKey('facilities.Facility', on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        db_table = 'facility_requests'
        constraints = [
            models.UniqueConstraint(
                fields=['facility_name', 'facility_address', 'submitted_by'],
                name='ux_facreq_submitter_facility_key'
            )
        ]
        indexes = [
            models.Index(fields=['submitted_by'], name='idx_facreq_submitter'),
            models.Index(fields=['status', 'created_at'], name='idx_facreq_status'),
            models.Index(fields=['facility_name', 'facility_address'], name='idx_facreq_facility_name_addr'),
        ]

    def __str__(self):
        """
        Return string representation of the facility request.

        Returns:
            str: Formatted string with request ID and facility name
        """
        return f"Facility Request {self.request_id} - {self.facility_name}"


class FacilityRequestSportType(models.Model):
    request = models.ForeignKey(FacilityRequest, on_delete=models.CASCADE)
    sport_type = models.ForeignKey('facilities.SportType', on_delete=models.RESTRICT)

    class Meta:
        db_table = 'facility_request_sport_types'
        constraints = [
            models.UniqueConstraint(fields=['request', 'sport_type'], name='unique_facility_request_sport_type')
        ]

    def __str__(self):
        """
        Return string representation of the facility request sport type.

        Returns:
            str: Formatted string with request and sport type
        """
        return f"{self.request} - {self.sport_type}"


class ManagerSuspension(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('lifted', 'Lifted'),
    ]

    suspension_id = models.BigAutoField(primary_key=True)
    manager = models.ForeignKey('users.Manager', on_delete=models.CASCADE, related_name='suspensions')
    suspended_by = models.ForeignKey('users.User', on_delete=models.RESTRICT, related_name='manager_suspensions_created')
    reason = models.TextField()
    duration_days = models.IntegerField(null=True, blank=True, help_text='Suspension duration in days. Null for indefinite.')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    suspended_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True, help_text='Automatically calculated based on duration_days')
    unsuspended_at = models.DateTimeField(null=True, blank=True)
    unsuspended_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='manager_suspensions_lifted')
    unsuspension_reason = models.TextField(null=True, blank=True)
    metadata = models.JSONField(null=True, blank=True)

    class Meta:
        db_table = 'manager_suspensions'
        indexes = [
            models.Index(fields=['manager', 'status'], name='idx_mgr_susp_manager_status'),
            models.Index(fields=['suspended_at'], name='idx_mgr_susp_created'),
            models.Index(fields=['expires_at'], name='idx_mgr_susp_expires'),
        ]
        ordering = ['-suspended_at']

    def __str__(self):
        """
        Return string representation of the manager suspension.

        Returns:
            str: Formatted string with suspension ID, manager, and status
        """
        return f"Manager Suspension {self.suspension_id} - {self.manager} ({self.status})"


class FacilitySuspension(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('lifted', 'Lifted'),
    ]

    suspension_id = models.BigAutoField(primary_key=True)
    facility = models.ForeignKey('facilities.Facility', on_delete=models.CASCADE, related_name='suspensions')
    suspended_by = models.ForeignKey('users.User', on_delete=models.RESTRICT, related_name='facility_suspensions_created')
    reason = models.TextField()
    duration_days = models.IntegerField(null=True, blank=True, help_text='Suspension duration in days. Null for indefinite.')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    suspended_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True, help_text='Automatically calculated based on duration_days')
    unsuspended_at = models.DateTimeField(null=True, blank=True)
    unsuspended_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='facility_suspensions_lifted')
    unsuspension_reason = models.TextField(null=True, blank=True)
    metadata = models.JSONField(null=True, blank=True)

    class Meta:
        db_table = 'facility_suspensions'
        indexes = [
            models.Index(fields=['facility', 'status'], name='idx_fac_susp_facility_status'),
            models.Index(fields=['suspended_at'], name='idx_fac_susp_created'),
            models.Index(fields=['expires_at'], name='idx_fac_susp_expires'),
        ]
        ordering = ['-suspended_at']

    def __str__(self):
        """
        Return string representation of the facility suspension.

        Returns:
            str: Formatted string with suspension ID, facility, and status
        """
        return f"Facility Suspension {self.suspension_id} - {self.facility} ({self.status})"


class RefundRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('processed', 'Processed'),
    ]

    request_id = models.BigAutoField(primary_key=True)
    booking = models.ForeignKey('bookings.Booking', on_delete=models.CASCADE, related_name='refund_requests')
    requested_by = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='refund_requests')
    reason = models.TextField()
    amount = models.DecimalField(max_digits=10, decimal_places=2, help_text='Refund amount requested')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reviewed_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_refunds')
    review_reason = models.TextField(null=True, blank=True, help_text='Admin reason for approval/rejection')
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    refund_transaction_id = models.CharField(max_length=255, null=True, blank=True, help_text='Payment provider refund ID')
    metadata = models.JSONField(null=True, blank=True)

    class Meta:
        db_table = 'refund_requests'
        indexes = [
            models.Index(fields=['booking'], name='idx_refund_booking'),
            models.Index(fields=['requested_by'], name='idx_refund_requester'),
            models.Index(fields=['status', 'created_at'], name='idx_refund_status'),
        ]
        ordering = ['-created_at']

    def __str__(self):
        """
        Return string representation of the refund request.

        Returns:
            str: Formatted string with request ID, booking ID, and status
        """
        return f"Refund Request {self.request_id} - Booking {self.booking_id} ({self.status})"


class CommissionAdjustment(models.Model):
    adjustment_id = models.BigAutoField(primary_key=True)
    facility = models.ForeignKey('facilities.Facility', on_delete=models.CASCADE, related_name='commission_adjustments')
    adjusted_by = models.ForeignKey('users.User', on_delete=models.RESTRICT, related_name='commission_adjustments')
    old_rate = models.DecimalField(max_digits=5, decimal_places=4, help_text='Previous commission rate (e.g., 0.1000 for 10%)')
    new_rate = models.DecimalField(max_digits=5, decimal_places=4, help_text='New commission rate (e.g., 0.1500 for 15%)')
    reason = models.TextField()
    effective_date = models.DateTimeField(help_text='When this rate takes effect')
    created_at = models.DateTimeField(auto_now_add=True)
    metadata = models.JSONField(null=True, blank=True)

    class Meta:
        db_table = 'commission_adjustments'
        indexes = [
            models.Index(fields=['facility', 'effective_date'], name='idx_comm_adj_facility'),
            models.Index(fields=['adjusted_by'], name='idx_comm_adj_admin'),
        ]
        ordering = ['-created_at']

    def __str__(self):
        """
        Return string representation of the commission adjustment.

        Returns:
            str: Formatted string with adjustment ID, facility, old rate, and new rate
        """
        return f"Commission Adjustment {self.adjustment_id} - {self.facility} ({self.old_rate} → {self.new_rate})"