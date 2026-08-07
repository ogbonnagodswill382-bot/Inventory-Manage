from django.db import models

class Category(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, default='')
    status = models.CharField(max_length=20, default='active')
    created_at = models.DateField(auto_now_add=True)

    def __str__(self):
        return self.name

class Supplier(models.Model):
    name = models.CharField(max_length=150)
    contact = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=50)
    address = models.CharField(max_length=255)
    status = models.CharField(max_length=20, default='active')
    created_at = models.DateField(auto_now_add=True)

    def __str__(self):
        return self.name

class Product(models.Model):
    name = models.CharField(max_length=200)
    sku = models.CharField(max_length=50, unique=True)
    category = models.ForeignKey(Category, related_name='products', on_delete=models.CASCADE)
    supplier = models.ForeignKey(Supplier, related_name='products', on_delete=models.CASCADE)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.IntegerField(default=0)
    threshold = models.IntegerField(default=10)
    emoji = models.CharField(max_length=10, default='📦')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.CharField(max_length=50, default='just now')

    def __str__(self):
        return f"{self.name} ({self.sku})"

class StockMovement(models.Model):
    MOVEMENT_TYPES = (
        ('in', 'Stock In'),
        ('out', 'Stock Out'),
    )
    product = models.ForeignKey(Product, related_name='movements', on_delete=models.CASCADE)
    type = models.CharField(max_length=10, choices=MOVEMENT_TYPES)
    quantity = models.IntegerField()
    user = models.CharField(max_length=100)
    reference = models.CharField(max_length=50, blank=True)
    notes = models.TextField(blank=True)
    balance = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.type.upper()} {self.quantity} - {self.product.name}"

class UserProfile(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=50, default='Warehouse Staff')
    status = models.CharField(max_length=20, default='active')
    avatar = models.CharField(max_length=10, default='SK')
    last_login = models.CharField(max_length=50, default='just now')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class ContactRequest(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField()
    message = models.TextField()
    status = models.CharField(max_length=20, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Request from {self.name} ({self.email})"
