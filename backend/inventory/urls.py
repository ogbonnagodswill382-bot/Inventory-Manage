from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryViewSet, SupplierViewSet, ProductViewSet,
    StockMovementViewSet, BranchTransferViewSet, UserProfileViewSet,
    StockInAPIView, StockOutAPIView, ReportsAPIView,
    LoginAPIView, RegisterAPIView, ContactAdminAPIView
)

router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'suppliers', SupplierViewSet)
router.register(r'products', ProductViewSet)
router.register(r'movements', StockMovementViewSet)
router.register(r'transfers', BranchTransferViewSet)
router.register(r'users', UserProfileViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('stock-in/', StockInAPIView.as_view(), name='stock-in'),
    path('stock-out/', StockOutAPIView.as_view(), name='stock-out'),
    path('reports/', ReportsAPIView.as_view(), name='reports'),
    path('login/', LoginAPIView.as_view(), name='login'),
    path('register/', RegisterAPIView.as_view(), name='register'),
    path('contact-admin/', ContactAdminAPIView.as_view(), name='contact-admin'),
]
