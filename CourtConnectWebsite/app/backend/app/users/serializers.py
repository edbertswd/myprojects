"""
User-facing serializers for user profile and manager applications
"""

from rest_framework import serializers
from app.admindashboard.models import ManagerRequest, ManagerRequestSportType
from app.facilities.models import SportType


class ManagerApplicationSerializer(serializers.Serializer):
    """Serializer for user manager application submission"""
    facility_name = serializers.CharField(max_length=255, required=True)
    facility_address = serializers.CharField(max_length=500, required=True)
    contact_phone = serializers.CharField(max_length=32, required=True)
    proposed_timezone = serializers.CharField(max_length=50, required=True)
    proposed_latitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    proposed_longitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    court_count = serializers.IntegerField(required=False, allow_null=True, min_value=1, max_value=100)
    operating_hours = serializers.JSONField(required=False, allow_null=True)
    business_experience = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    reason = serializers.CharField(required=True, min_length=50, max_length=2000,
                                   error_messages={
                                       'min_length': 'Please provide at least 50 characters explaining why you want to become a manager.',
                                       'max_length': 'Reason cannot exceed 2000 characters.'
                                   })
    sport_type_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=True,
        min_length=1,
        error_messages={'min_length': 'Please select at least one sport type.'}
    )

    def validate_facility_name(self, value):
        """Validate facility name is not empty after stripping"""
        if not value.strip():
            raise serializers.ValidationError('Facility name cannot be empty.')
        return value.strip()

    def validate_facility_address(self, value):
        """Validate facility address is not empty after stripping"""
        if not value.strip():
            raise serializers.ValidationError('Facility address cannot be empty.')
        return value.strip()

    def validate_contact_phone(self, value):
        """Validate phone number format"""
        # Remove common separators and country code prefix
        cleaned = value.replace(' ', '').replace('-', '').replace('(', '').replace(')', '').replace('+', '')
        if not cleaned.isdigit() or len(cleaned) < 8:
            raise serializers.ValidationError('Please provide a valid phone number with at least 8 digits.')
        return value

    def validate_sport_type_ids(self, value):
        """Validate that all sport type IDs exist in the database"""
        existing_ids = set(SportType.objects.filter(sport_type_id__in=value).values_list('sport_type_id', flat=True))
        invalid_ids = set(value) - existing_ids

        if invalid_ids:
            raise serializers.ValidationError(f'Invalid sport type IDs: {", ".join(map(str, invalid_ids))}')

        return value

    def create(self, validated_data):
        """Create ManagerRequest and associated sport types"""
        sport_type_ids = validated_data.pop('sport_type_ids')
        user = validated_data.pop('user')

        # Create the manager request
        manager_request = ManagerRequest.objects.create(
            user=user,
            status='pending',
            **validated_data
        )

        # Create sport type associations
        sport_types = SportType.objects.filter(sport_type_id__in=sport_type_ids)
        for sport_type in sport_types:
            ManagerRequestSportType.objects.create(
                request=manager_request,
                sport_type=sport_type
            )

        return manager_request


class ManagerApplicationStatusSerializer(serializers.ModelSerializer):
    """Serializer for checking user's manager application status"""
    sport_types = serializers.SerializerMethodField()

    class Meta:
        model = ManagerRequest
        fields = [
            'request_id', 'status', 'facility_name', 'facility_address',
            'contact_phone', 'proposed_timezone', 'court_count',
            'business_experience', 'reason', 'sport_types',
            'created_at', 'decided_at'
        ]
        read_only_fields = fields

    def get_sport_types(self, obj):
        """Get list of sport types for this request"""
        sport_types = SportType.objects.filter(
            managerrequestsporttype__request=obj
        ).values('sport_type_id', 'sport_name')
        return list(sport_types)
