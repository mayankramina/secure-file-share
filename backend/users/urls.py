from django.urls import path
from . import views

# app_name = 'users'

urlpatterns = [
    # Authentication endpoints
    path('/auth/register', views.register, name='register'),
    path('/auth/login', views.login, name='login'),
    path('/auth/mfa/setup', views.setup_mfa, name='mfa-setup'),
    path('/auth/mfa/verify', views.verify_mfa, name='mfa-verify'),
    path('/auth/logout', views.logout, name='logout'),
    
    # authenticated user info
    path('/me', views.get_my_info, name='get_my_info'),
] 