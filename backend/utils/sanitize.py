import re
import html

def sanitize_input(value, allow_spaces=True):
    if not isinstance(value, str):
        return value
        
    # Remove any HTML tags
    value = re.sub(r'<[^>]*?>', '', value)
    
    # Escape special characters
    value = html.escape(value)
    
    # Remove any null bytes
    value = value.replace('\x00', '')
    
    if allow_spaces:
        # Just trim leading/trailing whitespace
        value = value.strip()
    else:
        # Remove all whitespace characters
        value = re.sub(r'\s', '', value)
    
    return value

def sanitize_dict(data):
    """Sanitize all string values in a dictionary"""
    if not isinstance(data, dict):
        return data
        
    return {k: sanitize_input(v) for k, v in data.items()} 