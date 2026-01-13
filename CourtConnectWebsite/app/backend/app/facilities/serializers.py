from rest_framework import serializers
from django.db.models import Min, Count
from .models import Facility, Court, SportType, Availability, FacilityReview

HOURLY_RATE_MIN = 10
HOURLY_RATE_MAX = 200

class FacilityListSerializer(serializers.ModelSerializer):
    """Serializer for listing facilities"""
    manager_name = serializers.CharField(source='manager.user.name', read_only=True)
    image_url = serializers.SerializerMethodField()
    min_price = serializers.SerializerMethodField()
    sports = serializers.SerializerMethodField()
    total_courts = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()

    class Meta:
        model = Facility
        fields = [
            'facility_id', 'facility_name', 'address', 'timezone',
            'latitude', 'longitude', 'manager_name', 'approval_status',
            'is_active', 'created_at', 'image_url', 'min_price', 'sports',
            'total_courts', 'review_count', 'average_rating'
        ]
        read_only_fields = ['facility_id', 'created_at']

    def get_image_url(self, obj):
        """Get the full URL for the facility image"""
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None

    def get_min_price(self, obj):
        """Get the minimum hourly rate from all courts at this facility"""
        min_rate = Court.objects.filter(
            facility=obj,
            is_active=True
        ).aggregate(Min('hourly_rate'))['hourly_rate__min']
        return float(min_rate) if min_rate else None

    def get_sports(self, obj):
        """Get unique list of sports available at this facility"""
        sports = Court.objects.filter(
            facility=obj,
            is_active=True
        ).select_related('sport_type').values_list('sport_type__sport_name', flat=True).distinct()
        return list(sports)

    def get_total_courts(self, obj):
        """Get total number of active courts at this facility"""
        return Court.objects.filter(facility=obj, is_active=True).count()

    def get_review_count(self, obj):
        """Get total number of reviews for this facility"""
        return obj.reviews.count()

    def get_average_rating(self, obj):
        """Get average rating for this facility"""
        from django.db.models import Avg
        avg = obj.reviews.aggregate(Avg('rating'))['rating__avg']
        if avg is not None:
            return round(avg, 1)  # Round to 1 decimal place
        return None


class FacilityDetailSerializer(serializers.ModelSerializer):
    """Serializer for facility details"""
    manager_name = serializers.CharField(source='manager.user.name', read_only=True)
    manager_email = serializers.CharField(source='manager.user.email', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.name', read_only=True)

    class Meta:
        model = Facility
        fields = [
            'facility_id', 'facility_name', 'address', 'timezone',
            'latitude', 'longitude', 'commission_rate', 'approval_status',
            'is_active', 'manager_name', 'manager_email', 'approved_by_name',
            'approved_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['facility_id', 'approved_by_name', 'approved_at', 'created_at', 'updated_at']


class FacilityCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating facilities"""

    class Meta:
        model = Facility
        fields = [
            'facility_name', 'address', 'timezone', 'latitude', 'longitude',
            'image', 'is_active'
        ]

    def validate_timezone(self, value):
        """Ensure timezone is one of the allowed Australian timezones"""
        valid_timezones = [tz[0] for tz in Facility.TIMEZONE_CHOICES]
        if value not in valid_timezones:
            raise serializers.ValidationError(
                f"Invalid timezone. Must be one of: {', '.join(valid_timezones)}"
            )
        return value

    def validate(self, data):
        """Validate that address is provided and coordinates are valid"""
        if not data.get('address'):
            raise serializers.ValidationError({'address': 'Address is required'})

        # If latitude is provided, longitude must also be provided and vice versa
        lat = data.get('latitude')
        lon = data.get('longitude')
        if (lat is not None and lon is None) or (lon is not None and lat is None):
            raise serializers.ValidationError(
                'Both latitude and longitude must be provided together'
            )

        return data


class SportTypeSerializer(serializers.ModelSerializer):
    """Serializer for sport types"""

    class Meta:
        model = SportType
        fields = ['sport_type_id', 'sport_name', 'created_at']
        read_only_fields = ['sport_type_id', 'created_at']


class CourtSerializer(serializers.ModelSerializer):
    """Serializer for courts"""
    facility_name = serializers.CharField(source='facility.facility_name', read_only=True)
    sport_name = serializers.CharField(source='sport_type.sport_name', read_only=True)

    class Meta:
        model = Court
        fields = [
            'court_id', 'name', 'facility', 'facility_name',
            'sport_type', 'sport_name', 'hourly_rate', 'is_active',
            'opening_time', 'closing_time', 'availability_start_date',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['court_id', 'created_at', 'updated_at']


class CourtCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating courts by managers"""

    class Meta:
        model = Court
        fields = ['name', 'sport_type', 'hourly_rate', 'is_active', 'opening_time', 'closing_time', 'availability_start_date']

    def validate_hourly_rate(self, value):
        """Validate hourly rate is between 10 and 200 AUD"""
        if value < HOURLY_RATE_MIN or value > HOURLY_RATE_MAX:
            raise serializers.ValidationError(
                f'Hourly rate must be between ${HOURLY_RATE_MIN} and ${HOURLY_RATE_MAX} AUD'
            )
        return value

    def validate(self, data):
        """Additional validation"""
        # Only validate name if it's being provided (not on partial updates without name)
        if 'name' in data:
            if not data.get('name', '').strip():
                raise serializers.ValidationError({'name': 'Court name is required'})

        # Validate operating hours if provided
        opening_time = data.get('opening_time')
        closing_time = data.get('closing_time')

        if opening_time and closing_time:
            if closing_time <= opening_time:
                raise serializers.ValidationError({
                    'closing_time': 'Closing time must be after opening time'
                })

        # If one time is provided, require both
        if (opening_time and not closing_time) or (closing_time and not opening_time):
            raise serializers.ValidationError(
                'Both opening time and closing time must be provided together'
            )

        return data


class AvailabilitySerializer(serializers.ModelSerializer):
    """Serializer for court availability"""
    court_name = serializers.CharField(source='court.name', read_only=True)
    facility_name = serializers.CharField(source='court.facility.facility_name', read_only=True)

    class Meta:
        model = Availability
        fields = [
            'availability_id', 'court', 'court_name', 'facility_name',
            'start_time', 'end_time', 'is_available'
        ]
        read_only_fields = ['availability_id']


class AvailabilityCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating court availability by managers"""

    class Meta:
        model = Availability
        fields = ['start_time', 'end_time', 'is_available']

    def validate(self, data):
        """Validate availability time slots"""
        start_time = data.get('start_time')
        end_time = data.get('end_time')

        if start_time and end_time:
            if end_time <= start_time:
                raise serializers.ValidationError(
                    'End time must be after start time'
                )

        return data


class FacilityReviewSerializer(serializers.ModelSerializer):
    """Serializer for listing facility reviews"""
    user_name = serializers.CharField(source='user.name', read_only=True)
    facility_name = serializers.CharField(source='facility.facility_name', read_only=True)

    class Meta:
        model = FacilityReview
        fields = [
            'review_id', 'facility', 'facility_name', 'user_name',
            'rating', 'comment', 'created_at', 'updated_at'
        ]
        read_only_fields = ['review_id', 'created_at', 'updated_at']


class ReviewCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a facility review"""

    class Meta:
        model = FacilityReview
        fields = ['booking', 'rating', 'comment']

    def validate_rating(self, value):
        """Validate rating is between 1 and 5"""
        if value < 1 or value > 5:
            raise serializers.ValidationError('Rating must be between 1 and 5')
        return value

    def validate_booking(self, value):
        """Validate booking eligibility for review"""
        from django.utils import timezone

        # Check if booking exists and belongs to the user
        user = self.context['request'].user
        if value.user != user:
            raise serializers.ValidationError('You can only review your own bookings')

        # Check if booking time has passed
        if value.end_time > timezone.now():
            raise serializers.ValidationError('You can only review past bookings')

        # Check if booking is confirmed (not cancelled)
        if value.status.status_name == 'cancelled':
            raise serializers.ValidationError('Cannot review cancelled bookings')

        # Check if review already exists
        if hasattr(value, 'review'):
            raise serializers.ValidationError('You have already reviewed this booking')

        return value

    def create(self, validated_data):
        """Create review and link it to the facility"""
        booking = validated_data['booking']
        validated_data['facility'] = booking.court.facility
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class ReviewUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating an existing review"""

    class Meta:
        model = FacilityReview
        fields = ['rating', 'comment']

    def validate_rating(self, value):
        """Validate rating is between 1 and 5"""
        if value < 1 or value > 5:
            raise serializers.ValidationError('Rating must be between 1 and 5')
        return value
