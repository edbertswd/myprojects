"""
User-facing views for profile management and manager applications
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from django.db import IntegrityError

from app.auth.permissions import IsAuthenticated
from app.admindashboard.models import ManagerRequest
from .serializers import ManagerApplicationSerializer, ManagerApplicationStatusSerializer
from app.utils.audit import ActivityLogger


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_manager_application(request):
    """
    Submit manager application request
    POST /api/users/apply-manager/

    Request body:
    {
        "facility_name": "Downtown Tennis Club",
        "facility_address": "123 Main St, Sydney NSW 2000",
        "contact_phone": "+61 2 1234 5678",
        "proposed_timezone": "Australia/Sydney",
        "proposed_latitude": -33.8688,
        "proposed_longitude": 151.2093,
        "court_count": 5,
        "operating_hours": {"mon": "08:00-22:00", "tue": "08:00-22:00", ...},
        "business_experience": "10 years managing sports facilities...",
        "reason": "I have been operating a tennis club for 10 years...",
        "sport_type_ids": [1, 2, 3]
    }

    Returns:
    - 201: Application submitted successfully
    - 400: Validation error or duplicate application
    - 401: Not authenticated
    """
    # Check if user already has a pending or approved application
    existing_request = ManagerRequest.objects.filter(
        user=request.user,
        status__in=['pending', 'approved']
    ).first()

    if existing_request:
        if existing_request.status == 'approved':
            return Response(
                {'error': 'You already have an approved manager application.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        else:  # pending
            return Response(
                {
                    'error': 'You already have a pending manager application.',
                    'request_id': existing_request.request_id,
                    'submitted_at': existing_request.created_at
                },
                status=status.HTTP_400_BAD_REQUEST
            )

    # Validate and create application
    serializer = ManagerApplicationSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Add user to validated data
        manager_request = serializer.save(user=request.user)

        # Log the application submission
        ActivityLogger.log_user_action(
            user=request.user,
            action='submit_manager_application',
            resource_type='manager_request',
            resource_id=manager_request.request_id,
            metadata={
                'facility_name': manager_request.facility_name,
                'facility_address': manager_request.facility_address,
                'court_count': manager_request.court_count
            }
        )

        return Response({
            'message': 'Manager application submitted successfully! We will review your application within 2-3 business days.',
            'request_id': manager_request.request_id,
            'status': manager_request.status,
            'facility_name': manager_request.facility_name,
            'created_at': manager_request.created_at
        }, status=status.HTTP_201_CREATED)

    except IntegrityError:
        return Response(
            {'error': 'An application for this facility already exists.'},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_manager_application_status(request):
    """
    Get current user's manager application status
    GET /api/users/manager-application-status/

    Returns:
    - 200: Application data (if exists)
    - 404: No application found
    - 401: Not authenticated
    """
    try:
        # Get the most recent manager request for this user
        manager_request = ManagerRequest.objects.filter(
            user=request.user
        ).order_by('-created_at').first()

        if not manager_request:
            return Response(
                {'message': 'No manager application found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = ManagerApplicationStatusSerializer(manager_request)
        return Response({
            'data': serializer.data
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response(
            {'error': f'Failed to retrieve application status: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )