from django.urls import path
from . import views

urlpatterns = [
    path('key', views.create_or_get_key, name='create-or-get-key'),
    path('decrypt', views.decrypt_string, name='decrypt-string'),
    path('access/grant', views.grant_access, name='grant-access'),
    path('access/revoke', views.revoke_access, name='revoke-access'),
] 