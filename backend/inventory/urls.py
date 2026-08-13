from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CompanyWorkspaceViewSet, CategoryViewSet, SupplierViewSet, ProductViewSet,
    StockMovementViewSet, BranchTransferViewSet, UserProfileViewSet,
    StockInAPIView, StockOutAPIView, ReportsAPIView,
    LoginAPIView, RegisterAPIView, CompanyRegisterAPIView, CompanyLookupAPIView, ContactAdminAPIView
)

router = DefaultRouter()
router.register(r'workspaces', CompanyWorkspaceViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'suppliers', SupplierViewSet)
router.register(r'products', ProductViewSet)
router.register(r'movements', StockMovementViewSet)
router.register(r'transfers', BranchTransferViewSet)
router.register(r'users', UserProfileViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('company/register/', CompanyRegisterAPIView.as_view(), name='company-register'),
    path('company/lookup/<slug:slug>/', CompanyLookupAPIView.as_view(), name='company-lookup'),
    path('stock-in/', StockInAPIView.as_view(), name='stock-in'),
    path('stock-out/', StockOutAPIView.as_view(), name='stock-out'),
    path('reports/', ReportsAPIView.as_view(), name='reports'),
    path('login/', LoginAPIView.as_view(), name='login'),
    path('register/', RegisterAPIView.as_view(), name='register'),
    path('contact-admin/', ContactAdminAPIView.as_view(), name='contact-admin'),
]
