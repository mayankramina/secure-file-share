from utils.sanitize import sanitize_input

def sanitize_dict(data):
    """Sanitize all string values in a dictionary"""
    if not isinstance(data, dict):
        return data
        
    return {k: sanitize_input(v, allow_spaces=True) for k, v in data.items()}

class SanitizeMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Sanitize POST data
        if request.method == 'POST':
            request.POST = sanitize_dict(request.POST.dict())
            
        # Sanitize query parameters
        request.GET = sanitize_dict(request.GET.dict())
            
        # If there's JSON data, sanitize it
        if hasattr(request, '_body') and request.content_type == 'application/json':
            try:
                request.data = sanitize_dict(request.data)
            except:
                pass

        response = self.get_response(request)
        return response 