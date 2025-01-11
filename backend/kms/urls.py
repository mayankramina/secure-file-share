from django.urls import path
from . import views

urlpatterns = [
    path('key', views.create_or_get_key, name='create-or-get-key'),
    path('decrypt', views.decrypt_string, name='decrypt-string'),
] 