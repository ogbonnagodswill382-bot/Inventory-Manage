from django.db import models

class CompanyWorkspace(models.Model):
    name = models.CharField(max_length=150, unique=True)
    slug = models.SlugField(max_length=150, unique=True)
    contact_email = models.EmailField()
    admin_name = models.CharField(max_length=150, default='Administrator')
    admin_phone = models.CharField(max_length=50, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.slug})"

class Category(models.Model):
    company_slug = models.CharField(max_length=150, default='default', db_index=True)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, default='')
    status = models.CharField(max_length=20, default='active')
    created_by = models.CharField(max_length=150, default='Administrator')
    created_at = models.DateField(auto_now_add=True)

    def __str__(self):
        return self.name

class Supplier(models.Model):
    company_slug = models.CharField(max_length=150, default='default', db_index=True)
    name = models.CharField(max_length=150)
    contact = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=50)
    address = models.CharField(max_length=255)
    status = models.CharField(max_length=20, default='active')
    created_by = models.CharField(max_length=150, default='Administrator')
    created_at = models.DateField(auto_now_add=True)

    def __str__(self):
        return self.name

class Product(models.Model):
    company_slug = models.CharField(max_length=150, default='default', db_index=True)
    name = models.CharField(max_length=200)
    sku = models.CharField(max_length=50, unique=True)
    category = models.ForeignKey(Category, related_name='products', on_delete=models.CASCADE)
    supplier = models.ForeignKey(Supplier, related_name='products', on_delete=models.CASCADE)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.IntegerField(default=0)
    threshold = models.IntegerField(default=10)
    emoji = models.CharField(max_length=10, default='📦')
    created_by = models.CharField(max_length=150, default='Administrator')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.CharField(max_length=50, default='just now')

    def __str__(self):
        return f"{self.name} ({self.sku})"

class StockMovement(models.Model):
    MOVEMENT_TYPES = (
        ('in', 'Stock In'),
        ('out', 'Stock Out'),
    )
    company_slug = models.CharField(max_length=150, default='default', db_index=True)
    product = models.ForeignKey(Product, related_name='movements', on_delete=models.CASCADE)
    type = models.CharField(max_length=5, choices=MOVEMENT_TYPES)
    quantity = models.IntegerField()
    reference = models.CharField(max_length=100, blank=True, null=True)
    user = models.CharField(max_length=100, default='Admin User')
    notes = models.TextField(blank=True, null=True)
    date = models.CharField(max_length=50, default='just now')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.type.upper()} - {self.quantity} x {self.product.name}"

class BranchTransfer(models.Model):
    TRANSFER_TYPES = (
        ('branch_out', 'Inter-Branch Dispatch'),
        ('supplier_return', 'Supplier Return'),
    )
    STATUS_CHOICES = (
        ('dispatched', 'Dispatched Out'),
        ('returned_to_stock', 'Approved & Restocked'),
    )
    company_slug = models.CharField(max_length=150, default='default', db_index=True)
    product = models.ForeignKey(Product, related_name='transfers', on_delete=models.CASCADE)
    type = models.CharField(max_length=20, choices=TRANSFER_TYPES, default='branch_out')
    quantity = models.IntegerField()
    destination = models.CharField(max_length=150)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='dispatched')
    dispatched_by = models.CharField(max_length=100, default='Administrator')
    approved_by = models.CharField(max_length=100, blank=True, null=True)
    reference = models.CharField(max_length=100, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    returned_at = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"{self.type.upper()} - {self.quantity} x {self.product.name} ({self.destination})"

class UserProfile(models.Model):
    company_slug = models.CharField(max_length=150, default='default', db_index=True)
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=50, blank=True, null=True)
    role = models.CharField(max_length=50, default='Warehouse Staff')
    status = models.CharField(max_length=20, default='active')
    avatar = models.CharField(max_length=10, default='SK')
    last_login = models.CharField(max_length=50, default='just now')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class ContactRequest(models.Model):
    company_slug = models.CharField(max_length=150, default='default', db_index=True)
    name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=50, blank=True, null=True)
    message = models.TextField()
    status = models.CharField(max_length=20, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Request from {self.name} ({self.email})"
