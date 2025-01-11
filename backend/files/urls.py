from django.urls import path
from . import views

urlpatterns = [
    path('list', views.list_files, name='list_files'),
    path('upload', views.upload_file, name='upload_file'),
    path('<int:file_id>', views.get_file_details, name='get_file_details'),
    path('<int:file_id>/download', views.download_file, name='download_file'),
    path('<int:file_id>/shares/list', views.list_file_shares, name='list_file_shares'),
    path('<int:file_id>/shares/add', views.add_share, name='add_share'),
    path('<int:file_id>/shares/<int:share_id>/delete', views.delete_share, name='delete_share'),
    path('<int:file_id>/shares/<int:share_id>', views.update_share, name='update_share'),
    path('<int:file_id>/permission', views.get_file_permission, name='get_file_permission'),
    path('shares/me', views.list_my_shares, name='list_my_shares'),
    path('<int:file_id>/links/generate', views.generate_link, name='generate_link'),
    path('links/verify', views.verify_link, name='verify_link'),
] 