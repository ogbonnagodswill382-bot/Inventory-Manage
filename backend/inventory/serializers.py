from rest_framework import serializers
from .models import Category, Supplier, Product, StockMovement, UserProfile

class CategorySerializer(serializers.ModelSerializer):
    productCount = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'productCount', 'status', 'created_at']

    def get_productCount(self, obj):
        return obj.products.count()

class SupplierSerializer(serializers.ModelSerializer):
    productCount = serializers.SerializerMethodField()

    class Meta:
        model = Supplier
        fields = ['id', 'name', 'contact', 'email', 'phone', 'address', 'productCount', 'status', 'created_at']

    def get_productCount(self, obj):
        return obj.products.count()

class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    status = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'sku', 'category', 'category_name',
            'supplier', 'supplier_name', 'price', 'stock', 'threshold',
            'status', 'emoji', 'updated_at', 'created_at'
        ]

    def get_status(self, obj):
        if obj.stock == 0:
            return 'out_of_stock'
        elif obj.stock <= obj.threshold:
            return 'low_stock'
        return 'in_stock'

class StockMovementSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    date = serializers.DateTimeField(source='created_at', format='%Y-%m-%d %H:%M', read_only=True)

    class Meta:
        model = StockMovement
        fields = [
            'id', 'product', 'product_name', 'type', 'quantity',
            'user', 'reference', 'notes', 'balance', 'date'
        ]

class UserProfileSerializer(serializers.ModelSerializer):
    lastLogin = serializers.CharField(source='last_login')

    class Meta:
        model = UserProfile
        fields = ['id', 'name', 'email', 'role', 'status', 'avatar', 'lastLogin']
