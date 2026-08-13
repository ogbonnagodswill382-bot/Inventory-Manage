from rest_framework import serializers
from .models import Category, Supplier, Product, StockMovement, BranchTransfer, UserProfile

class CategorySerializer(serializers.ModelSerializer):
    productCount = serializers.SerializerMethodField()
    date = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'productCount', 'status', 'created_by', 'created_at', 'date']

    def get_productCount(self, obj):
        return obj.products.count()

    def get_date(self, obj):
        if not obj.created_at:
            return "Just now"
        if hasattr(obj.created_at, 'strftime'):
            return obj.created_at.strftime('%Y-%m-%d')
        return str(obj.created_at)

class SupplierSerializer(serializers.ModelSerializer):
    productCount = serializers.SerializerMethodField()
    date = serializers.SerializerMethodField()

    class Meta:
        model = Supplier
        fields = ['id', 'name', 'contact', 'email', 'phone', 'address', 'productCount', 'status', 'created_by', 'created_at', 'date']

    def get_productCount(self, obj):
        return obj.products.count()

    def get_date(self, obj):
        if not obj.created_at:
            return "Just now"
        if hasattr(obj.created_at, 'strftime'):
            return obj.created_at.strftime('%Y-%m-%d')
        return str(obj.created_at)

class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    status = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'sku', 'category', 'category_name',
            'supplier', 'supplier_name', 'price', 'stock', 'threshold',
            'status', 'emoji', 'created_by', 'updated_at', 'created_at'
        ]

    def get_status(self, obj):
        if obj.stock == 0:
            return 'out_of_stock'
        elif obj.stock <= obj.threshold:
            return 'low_stock'
        return 'in_stock'

class StockMovementSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    date = serializers.SerializerMethodField()

    class Meta:
        model = StockMovement
        fields = [
            'id', 'product', 'product_name', 'type', 'quantity',
            'user', 'reference', 'notes', 'balance', 'date'
        ]

    def get_date(self, obj):
        if not obj.created_at:
            return "Just now"
        if hasattr(obj.created_at, 'strftime'):
            return obj.created_at.strftime('%Y-%m-%d %H:%M')
        return str(obj.created_at)

class BranchTransferSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    date = serializers.SerializerMethodField()
    returned_date = serializers.SerializerMethodField()

    class Meta:
        model = BranchTransfer
        fields = [
            'id', 'product', 'product_name', 'product_sku', 'quantity',
            'destination', 'type', 'status', 'dispatched_by', 'approved_by',
            'reference', 'notes', 'date', 'returned_date'
        ]

    def get_date(self, obj):
        if not obj.created_at:
            return "Just now"
        if hasattr(obj.created_at, 'strftime'):
            return obj.created_at.strftime('%Y-%m-%d %H:%M')
        return str(obj.created_at)

    def get_returned_date(self, obj):
        if not obj.returned_at:
            return None
        if hasattr(obj.returned_at, 'strftime'):
            return obj.returned_at.strftime('%Y-%m-%d %H:%M')
        return str(obj.returned_at)

class UserProfileSerializer(serializers.ModelSerializer):
    lastLogin = serializers.CharField(source='last_login')

    class Meta:
        model = UserProfile
        fields = ['id', 'name', 'email', 'role', 'status', 'avatar', 'last_login', 'lastLogin']
