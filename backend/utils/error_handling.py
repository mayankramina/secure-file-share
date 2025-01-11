def format_serializer_errors(serializer_errors):
    """
    Formats serializer errors into a single string.
    Input: serializer.errors dictionary
    Output: Single error string with all messages joined
    """
    error_messages = []
    for field, errors in serializer_errors.items():
        # Handle both string and list errors
        if isinstance(errors, list):
            error_messages.append(' '.join(errors))
        else:
            error_messages.append(errors)
            
    return ' '.join(error_messages) 