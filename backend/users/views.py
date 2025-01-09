from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .serializers import UserCreateSerializer
from django.db import IntegrityError


@api_view(['POST'])
def register(request):
    serializer = UserCreateSerializer(data=request.data)
    try:
        if serializer.is_valid():
            serializer.save()
            return Response(
                {'message': 'Registration successful', 'username': serializer.data['username']},
                status=status.HTTP_201_CREATED
            )
        return Response(
            {'message': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )
    except IntegrityError:
        return Response(
            {'message': 'Database integrity error occurred'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {'message': f'An unexpected error occurred: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    

@api_view(['GET'])
def sample_api(request):
    data = {
        "message": "Hello from Users API",
        "users": [
            {"id": 1, "name": "John Doe", "email": "john@example.com"},
            {"id": 2, "name": "Jane Smith", "email": "jane@example.com"}
        ]
    }
    return Response(data) 