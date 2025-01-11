from django.urls import path
from . import views

urlpatterns = [
    path('list', views.list_files, name='list_files'),
    path('upload', views.upload_file, name='upload_file'),
    path('<int:file_id>', views.get_file_details, name='get_file_details'),
    path('<int:file_id>/download', views.download_file, name='download_file'),
] 