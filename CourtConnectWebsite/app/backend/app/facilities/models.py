from django.db import models


class SportType(models.Model):
    sport_type_id = models.BigAutoField(primary_key=True)
    sport_name = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'sport_types'

    def __str__(self):
        """
        Return string representation of the sport type.

        Returns:
            str: Name of the sport
        """
        return self.sport_name


class Facility(models.Model):
    # Australian timezone choices
    TIMEZONE_CHOICES = [
        ('Australia/Sydney', 'Sydney (NSW, ACT)'),
        ('Australia/Melbourne', 'Melbourne (VIC)'),
        ('Australia/Brisbane', 'Brisbane (QLD)'),
        ('Australia/Adelaide', 'Adelaide (SA)'),
        ('Australia/Perth', 'Perth (WA)'),
        ('Australia/Hobart', 'Hobart (TAS)'),
        ('Australia/Darwin', 'Darwin (NT)'),
    ]

    facility_id = models.BigAutoField(primary_key=True)
    manager = models.ForeignKey('users.Manager', on_delete=models.RESTRICT, null=True, blank=True)
    facility_name = models.CharField(max_length=255)
    address = models.CharField(max_length=500)
    timezone = models.CharField(max_length=50, choices=TIMEZONE_CHOICES, default='Australia/Sydney')
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    court_count = models.IntegerField(null=True, blank=True, help_text="Number of courts at this facility")
    operating_hours = models.JSONField(null=True, blank=True, help_text="Operating hours as JSON (e.g., {'Monday': '9am-5pm'})")
    image = models.ImageField(upload_to='facilities/', null=True, blank=True, help_text="Facility image")
    commission_rate = models.DecimalField(max_digits=5, decimal_places=4, default='0.1000', help_text="Commission rate as decimal (e.g., 0.10 for 10%)")
    approval_status = models.CharField(max_length=20, default='pending')
    approved_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_facilities')
    approved_at = models.DateTimeField(null=True, blank=True)
    submitted_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='submitted_facilities')
    is_active = models.BooleanField(default=True)
    is_suspended = models.BooleanField(default=False, help_text='Whether facility is currently suspended by admin')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'facilities'
        constraints = [
            models.UniqueConstraint(
                fields=['manager', 'facility_name'],
                name='ux_facilities_manager_name_nonnull',
                condition=models.Q(manager__isnull=False)
            )
        ]
        indexes = [
            models.Index(fields=['latitude', 'longitude'], name='idx_facilities_latlon'),
            models.Index(fields=['facility_name', 'address'], name='idx_fac_dupe_guard'),
        ]

    def __str__(self):
        """
        Return string representation of the facility.

        Returns:
            str: Name of the facility
        """
        return self.facility_name


class FacilitySportType(models.Model):
    """
    Links facilities to the sport types they support.
    Allows a facility to support multiple sports.
    """
    facility = models.ForeignKey(Facility, on_delete=models.CASCADE, related_name='sport_types')
    sport_type = models.ForeignKey(SportType, on_delete=models.RESTRICT)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'facility_sport_types'
        constraints = [
            models.UniqueConstraint(fields=['facility', 'sport_type'], name='unique_facility_sport_type')
        ]

    def __str__(self):
        """
        Return string representation of the facility-sport relationship.

        Returns:
            str: Formatted string with facility name and sport type
        """
        return f"{self.facility.facility_name} - {self.sport_type.sport_name}"


class Court(models.Model):
    court_id = models.BigAutoField(primary_key=True)
    facility = models.ForeignKey(Facility, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    sport_type = models.ForeignKey(SportType, on_delete=models.RESTRICT)
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)
    opening_time = models.TimeField(null=True, blank=True, help_text="Daily opening time (e.g., 06:00)")
    closing_time = models.TimeField(null=True, blank=True, help_text="Daily closing time (e.g., 22:00)")
    availability_start_date = models.DateField(null=True, blank=True, help_text="Date from which availability is generated")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'courts'
        constraints = [
            models.UniqueConstraint(fields=['facility', 'name'], name='unique_court_per_facility'),
            models.CheckConstraint(
                check=models.Q(hourly_rate__gte=10, hourly_rate__lte=200),
                name='check_hourly_rate_range'
            )
        ]

    def __str__(self):
        """
        Return string representation of the court.

        Returns:
            str: Formatted string with facility name and court name
        """
        return f"{self.facility.facility_name} - {self.name}"


class Availability(models.Model):
    availability_id = models.BigAutoField(primary_key=True)
    court = models.ForeignKey(Court, on_delete=models.CASCADE)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    is_available = models.BooleanField()

    class Meta:
        db_table = 'availabilities'
        constraints = [
            models.UniqueConstraint(fields=['court', 'start_time'], name='unique_court_start_time'),
            models.UniqueConstraint(fields=['availability_id', 'court', 'start_time', 'end_time'], name='unique_availability_composite')
        ]

    def __str__(self):
        """
        Return string representation of the availability slot.

        Returns:
            str: Formatted string with court info and time range
        """
        return f"{self.court} - {self.start_time} to {self.end_time}"


class FacilityReview(models.Model):
    """
    User reviews for facilities.
    One review per booking - users can only review after their booking time has passed.
    """
    review_id = models.BigAutoField(primary_key=True)
    facility = models.ForeignKey(Facility, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='reviews')
    booking = models.OneToOneField('bookings.Booking', on_delete=models.CASCADE, related_name='review')
    rating = models.IntegerField(help_text="Rating from 1-5 stars")
    comment = models.TextField(blank=True, null=True, help_text="Optional review comment")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'facility_reviews'
        constraints = [
            models.CheckConstraint(
                check=models.Q(rating__gte=1, rating__lte=5),
                name='check_rating_range'
            ),
            models.UniqueConstraint(fields=['user', 'booking'], name='unique_user_booking_review')
        ]
        indexes = [
            models.Index(fields=['facility', 'created_at'], name='idx_reviews_facility_created'),
            models.Index(fields=['user', 'created_at'], name='idx_reviews_user_created'),
        ]

    def __str__(self):
        """
        Return string representation of the review.

        Returns:
            str: Formatted string with user, facility, and rating
        """
        return f"Review by {self.user.name} for {self.facility.facility_name} - {self.rating} stars"