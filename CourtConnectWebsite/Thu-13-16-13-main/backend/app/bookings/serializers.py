from rest_framework import serializers
from django.utils import timezone
from .models import Booking, BookingStatus, TemporaryReservation
from app.facilities.models import Court, Availability
from app.users.models import User


class BookingCreateSerializer(serializers.ModelSerializer):
    availability_id = serializers.IntegerField(write_only=True, required=False)
    availability_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = Booking
        fields = ['availability_id', 'availability_ids']

    def validate(self, data):
        # Support both single availability_id and multiple availability_ids
        if 'availability_ids' in data and data['availability_ids']:
            availability_ids = data['availability_ids']
        elif 'availability_id' in data:
            availability_ids = [data['availability_id']]
        else:
            raise serializers.ValidationError("Either availability_id or availability_ids must be provided")

        # Validate all availability slots
        availabilities = []
        for avail_id in availability_ids:
            try:
                availability = Availability.objects.get(availability_id=avail_id, is_available=True)
            except Availability.DoesNotExist:
                raise serializers.ValidationError(f"Time slot {avail_id} is not available")

            # Check if availability is in the future (allow 1 minute grace period for clock differences)
            grace_period = timezone.timedelta(minutes=1)
            if availability.start_time < (timezone.now() - grace_period):
                raise serializers.ValidationError("Cannot book time slots in the past")

            # Check if booking already exists for this availability
            if Booking.objects.filter(availability=availability).exists():
                raise serializers.ValidationError(f"Time slot {avail_id} has already been booked")

            availabilities.append(availability)

        # Validate that all slots are on the same court
        if len(set(a.court_id for a in availabilities)) > 1:
            raise serializers.ValidationError("All time slots must be on the same court")

        # Store validated availabilities for use in create
        data['_validated_availabilities'] = availabilities
        return data


class BookingDetailSerializer(serializers.ModelSerializer):
    court_name = serializers.CharField(source='court.name', read_only=True)
    facility_name = serializers.CharField(source='court.facility.facility_name', read_only=True)
    facility_address = serializers.CharField(source='court.facility.address', read_only=True)
    sport_type = serializers.CharField(source='court.sport_type.sport_name', read_only=True)
    status_name = serializers.CharField(source='status.status_name', read_only=True)
    user_name = serializers.CharField(source='user.name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = Booking
        fields = [
            'booking_id', 'court_name', 'facility_name', 'facility_address',
            'sport_type', 'start_time', 'end_time', 'hourly_rate_snapshot',
            'commission_rate_snapshot', 'status_name', 'user_name', 'user_email',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['booking_id', 'created_at', 'updated_at']


class BookingListSerializer(serializers.ModelSerializer):
    court_name = serializers.CharField(source='court.name', read_only=True)
    facility_id = serializers.IntegerField(source='court.facility.facility_id', read_only=True)
    facility_name = serializers.CharField(source='court.facility.facility_name', read_only=True)
    facility_image_url = serializers.SerializerMethodField()
    sport_type = serializers.CharField(source='court.sport_type.sport_name', read_only=True)
    status = serializers.CharField(source='status.status_name', read_only=True)
    status_name = serializers.CharField(source='status.status_name', read_only=True)  # Kept for backwards compatibility
    total_price = serializers.SerializerMethodField()
    has_reviewed = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = [
            'booking_id', 'facility_id', 'court_name', 'facility_name', 'facility_image_url',
            'sport_type', 'start_time', 'end_time',
            'hourly_rate_snapshot', 'total_price', 'status', 'status_name',
            'has_reviewed', 'created_at'
        ]
        read_only_fields = ['booking_id', 'created_at']

    def get_facility_image_url(self, obj):
        """Get facility image URL if it exists"""
        if obj.court.facility.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.court.facility.image.url)
            return obj.court.facility.image.url
        return None

    def get_total_price(self, obj):
        """Calculate total price from hourly rate and duration"""
        from datetime import timedelta
        duration_hours = (obj.end_time - obj.start_time).total_seconds() / 3600
        total = float(obj.hourly_rate_snapshot) * duration_hours
        return f"{total:.2f}"

    def get_has_reviewed(self, obj):
        """Check if user has already reviewed this booking"""
        return hasattr(obj, 'review')


class BookingCancelSerializer(serializers.Serializer):
    reason = serializers.CharField(max_length=500, required=False, allow_blank=True)

    def validate(self, data):
        booking = self.instance

        # Check if booking can be cancelled (2 hours before start time)
        if booking.start_time <= timezone.now() + timezone.timedelta(hours=2):
            raise serializers.ValidationError(
                "Bookings can only be cancelled up to 2 hours before the start time"
            )

        # Check if booking is already cancelled
        if booking.status.status_name == 'cancelled':
            raise serializers.ValidationError("Booking is already cancelled")

        # Check if booking is completed
        if booking.status.status_name == 'completed':
            raise serializers.ValidationError("Cannot cancel completed bookings")

        return data


class ReservationSlotSerializer(serializers.Serializer):
    """Serializer for individual reservation slots"""
    availability_id = serializers.IntegerField(source='availability.availability_id', read_only=True)
    start_time = serializers.DateTimeField(source='availability.start_time', read_only=True)
    end_time = serializers.DateTimeField(source='availability.end_time', read_only=True)


class TemporaryReservationSerializer(serializers.ModelSerializer):
    """Serializer for viewing temporary reservations"""
    slots = ReservationSlotSerializer(many=True, read_only=True)
    slots_count = serializers.SerializerMethodField()
    time_remaining_seconds = serializers.SerializerMethodField()

    class Meta:
        model = TemporaryReservation
        fields = ['reservation_id', 'reserved_at', 'expires_at', 'time_remaining_seconds', 'slots', 'slots_count']
        read_only_fields = ['reservation_id', 'reserved_at', 'expires_at']

    def get_time_remaining_seconds(self, obj):
        from django.utils import timezone
        if obj.is_expired:
            return 0
        delta = obj.expires_at - timezone.now()
        return max(0, int(delta.total_seconds()))

    def get_slots_count(self, obj):
        return obj.slots.count()


class CreateReservationSerializer(serializers.Serializer):
    """Serializer for creating a temporary reservation"""
    availability_id = serializers.IntegerField(write_only=True, required=False)
    availability_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )

    def validate(self, data):
        # Ensure at least one of the fields is provided
        if not data.get('availability_ids') and not data.get('availability_id'):
            raise serializers.ValidationError(
                "Either availability_id or availability_ids must be provided"
            )

        # Convert single ID to list
        if 'availability_id' in data and not data.get('availability_ids'):
            data['availability_ids'] = [data['availability_id']]
        elif not data.get('availability_ids'):
            data['availability_ids'] = []

        return data