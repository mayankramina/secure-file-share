# User Roles
ROLE_ADMIN = 'ADMIN'
ROLE_USER = 'USER'
ROLE_GUEST = 'GUEST'

# Role choices for models
USER_ROLE_CHOICES = [
    (ROLE_ADMIN, 'Admin'),
    (ROLE_USER, 'User'),
    (ROLE_GUEST, 'Guest')
]

# Default role
DEFAULT_ROLE = ROLE_USER

# Permission Types
PERM_VIEW = 'VIEW'
PERM_DOWNLOAD = 'DOWNLOAD'

PERMISSION_CHOICES = [
    (PERM_VIEW, 'View'),
    (PERM_DOWNLOAD, 'Download')
] 