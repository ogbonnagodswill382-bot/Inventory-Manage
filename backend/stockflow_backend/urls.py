from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def root_health_check(request):
    return JsonResponse({
        "status": "online",
        "message": "StockFlow Backend API is live and running smoothly!",
        "version": "2.4.1"
    })

urlpatterns = [
    path('', root_health_check),
    path('admin/', admin.site.urls),
    path('api/', include('inventory.urls')),
]
