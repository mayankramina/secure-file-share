from rest_framework.decorators import api_view
from rest_framework.response import Response

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