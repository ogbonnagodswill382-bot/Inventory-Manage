from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db.models import F, Sum
from django.utils import timezone
from .models import Category, Supplier, Product, StockMovement, BranchTransfer, UserProfile, ContactRequest
from .serializers import (
    CategorySerializer, SupplierSerializer, ProductSerializer,
    StockMovementSerializer, BranchTransferSerializer, UserProfileSerializer
)

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().order_by('-id')
    serializer_class = CategorySerializer

class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all().order_by('-id')
    serializer_class = SupplierSerializer

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by('-id')
    serializer_class = ProductSerializer

    def create(self, request, *args, **kwargs):
        sku = request.data.get('sku', '').strip()
        name = request.data.get('name', '').strip()
        category_id = request.data.get('category')
        supplier_id = request.data.get('supplier')
        price = request.data.get('price', 0)
        stock = request.data.get('stock', 0)
        threshold = request.data.get('threshold', 10)
        emoji = request.data.get('emoji', '📦')
        created_by = request.data.get('created_by', 'Administrator')

        if not sku:
            sku = f"SF-{request.data.get('name', 'PROD')[:3].upper()}-{Product.objects.count() + 100}"

        if Product.objects.filter(sku=sku).exists():
            sku = f"{sku}-{int(Product.objects.count() + 1)}"

        try:
            category = Category.objects.get(id=category_id)
            supplier = Supplier.objects.get(id=supplier_id)
        except (Category.DoesNotExist, Supplier.DoesNotExist):
            return Response({'error': 'Invalid Category or Supplier selected.'}, status=400)

        product = Product.objects.create(
            name=name,
            sku=sku,
            category=category,
            supplier=supplier,
            price=price,
            stock=stock,
            threshold=threshold,
            emoji=emoji,
            created_by=created_by,
        )

        return Response(ProductSerializer(product).data, status=status.HTTP_201_CREATED)

class StockMovementViewSet(viewsets.ModelViewSet):
    queryset = StockMovement.objects.all().order_by('-id')
    serializer_class = StockMovementSerializer

class BranchTransferViewSet(viewsets.ModelViewSet):
    queryset = BranchTransfer.objects.all().order_by('-id')
    serializer_class = BranchTransferSerializer

    @action(detail=True, methods=['post'])
    def approve_return(self, request, pk=None):
        transfer = self.get_object()
        if transfer.status == 'returned_to_stock':
            return Response({'error': 'This return has already been approved and restocked into inventory.'}, status=400)

        approved_by = request.data.get('approved_by', 'Administrator').strip()
        notes = request.data.get('notes', '').strip()

        # RESTOCK PRODUCT DIRECTLY BACK TO ITS SOURCE WAREHOUSE STOCK BALANCE!
        product = transfer.product
        product.stock += transfer.quantity
        product.updated_at = 'just now'
        product.save()

        # Create Stock In Movement Audit Record
        movement = StockMovement.objects.create(
            product=product,
            type='in',
            quantity=transfer.quantity,
            user=approved_by,
            reference=f"RET-{transfer.id}",
            notes=f"Returned from {transfer.destination} ({'Supplier' if transfer.type == 'supplier_return' else 'Branch'}). Approved by {approved_by}. {notes}".strip(),
            balance=product.stock
        )

        transfer.status = 'returned_to_stock'
        transfer.approved_by = approved_by
        transfer.returned_at = timezone.now()
        if notes:
            transfer.notes = f"{transfer.notes or ''} | Return note: {notes}".strip()
        transfer.save()

        return Response({
            'message': f'Approved & Restocked {transfer.quantity} units of "{product.name}" back into warehouse inventory!',
            'transfer': BranchTransferSerializer(transfer).data,
            'movement': StockMovementSerializer(movement).data,
            'new_stock': product.stock
        }, status=status.HTTP_200_OK)

class UserProfileViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.all().order_by('-id')
    serializer_class = UserProfileSerializer

    def create(self, request, *args, **kwargs):
        name = request.data.get('name', '').strip()
        email = request.data.get('email', '').strip()
        role = request.data.get('role', 'Warehouse Staff')
        password = request.data.get('password', '').strip()
        avatar = request.data.get('avatar', name[:2].upper() if name else 'SK')

        if not name or not email:
            return Response({'error': 'Name and Email are required'}, status=400)

        if UserProfile.objects.filter(email=email).exists():
            return Response({'error': 'A team member with this email already exists'}, status=400)

        initial_password = password if password else f"staff@{User.objects.count() + 100}"
        username = email.split('@')[0]
        if User.objects.filter(username=username).exists():
            username = f"{username}_{User.objects.count() + 1}"

        django_user = User.objects.create_user(username=username, email=email, password=initial_password)
        django_user.first_name = name
        if role == 'Administrator':
            django_user.is_staff = True
            django_user.is_superuser = True
        django_user.save()

        profile = UserProfile.objects.create(
            name=name,
            email=email,
            role=role,
            avatar=avatar,
            status='active'
        )

        return Response({
            'message': 'Staff account created successfully',
            'user': UserProfileSerializer(profile).data,
            'initial_password': initial_password,
            'username': username,
        }, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        profile = self.get_object()
        name = request.data.get('name', profile.name).strip()
        email = request.data.get('email', profile.email).strip()
        role = request.data.get('role', profile.role)
        status_val = request.data.get('status', profile.status)
        avatar = request.data.get('avatar', profile.avatar)
        new_password = request.data.get('password', '').strip()

        # PREVENT BLOCKING ADMINISTRATOR ACCOUNTS
        if profile.role == 'Administrator' and status_val in ['blocked', 'inactive']:
            return Response({'error': 'Top Administrator accounts cannot be blocked or suspended.'}, status=400)

        try:
            django_user = User.objects.get(email=profile.email)
            if email != profile.email:
                django_user.email = email
            if name:
                django_user.first_name = name
            if new_password:
                django_user.set_password(new_password)
            if status_val in ['blocked', 'inactive']:
                django_user.is_active = False
            else:
                django_user.is_active = True
            django_user.save()
        except User.DoesNotExist:
            pass

        profile.name = name
        profile.email = email
        profile.role = role
        profile.status = status_val
        profile.avatar = avatar
        profile.save()

        return Response({
            'message': 'Staff profile updated successfully',
            'user': UserProfileSerializer(profile).data
        })

    def destroy(self, request, *args, **kwargs):
        profile = self.get_object()
        
        # PREVENT DELETING ADMINISTRATOR ACCOUNTS
        if profile.role == 'Administrator':
            return Response({'error': 'Top Administrator accounts cannot be deleted.'}, status=400)

        try:
            django_user = User.objects.get(email=profile.email)
            django_user.delete()
        except User.DoesNotExist:
            pass

        profile.delete()
        return Response({'message': f'Staff account {profile.name} removed successfully.'}, status=status.HTTP_200_OK)

class StockInAPIView(APIView):
    def post(self, request):
        product_id = request.data.get('product_id')
        quantity = int(request.data.get('quantity', 0))
        user = request.data.get('user', 'Staff')
        reference = request.data.get('reference', '')
        notes = request.data.get('notes', '')

        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=404)

        product.stock += quantity
        product.updated_at = 'just now'
        product.save()

        movement = StockMovement.objects.create(
            product=product,
            type='in',
            quantity=quantity,
            user=user,
            reference=reference,
            notes=notes,
            balance=product.stock
        )

        return Response({
            'message': 'Stock in recorded successfully',
            'movement': StockMovementSerializer(movement).data,
            'new_stock': product.stock
        }, status=201)

class StockOutAPIView(APIView):
    def post(self, request):
        product_id = request.data.get('product_id')
        quantity = int(request.data.get('quantity', 0))
        user = request.data.get('user', 'Staff')
        reference = request.data.get('reference', '')
        notes = request.data.get('notes', '')
        destination = request.data.get('destination', '').strip()
        reason = request.data.get('reason', 'sale').strip()

        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=404)

        if product.stock < quantity:
            return Response({'error': f'Insufficient stock. Only {product.stock} units available.'}, status=400)

        product.stock -= quantity
        product.updated_at = 'just now'
        product.save()

        movement = StockMovement.objects.create(
            product=product,
            type='out',
            quantity=quantity,
            user=user,
            reference=reference,
            notes=notes,
            balance=product.stock
        )

        # Auto-track Inter-warehouse Transfers or Supplier Returns
        if reason in ['transfer', 'return'] or destination:
            transfer_type = 'supplier_return' if reason == 'return' else 'transfer'
            dest_name = destination or ('Supplier Partner' if transfer_type == 'supplier_return' else 'Secondary Warehouse Branch')
            BranchTransfer.objects.create(
                product=product,
                quantity=quantity,
                destination=dest_name,
                type=transfer_type,
                status='dispatched',
                dispatched_by=user,
                reference=reference,
                notes=notes
            )

        return Response({
            'message': 'Stock out recorded successfully',
            'movement': StockMovementSerializer(movement).data,
            'new_stock': product.stock
        }, status=201)

class ReportsAPIView(APIView):
    def get(self, request):
        total_products = Product.objects.count()
        total_categories = Category.objects.count()
        total_suppliers = Supplier.objects.count()
        total_stock = Product.objects.aggregate(total=Sum('stock'))['total'] or 0
        
        low_stock = Product.objects.filter(stock__gt=0, stock__lte=F('threshold')).count()
        out_of_stock = Product.objects.filter(stock=0).count()
        
        products = Product.objects.all()
        inventory_valuation = sum([p.price * p.stock for p in products])

        return Response({
            'total_products': total_products,
            'total_categories': total_categories,
            'total_suppliers': total_suppliers,
            'total_stock': total_stock,
            'low_stock_count': low_stock,
            'out_of_stock_count': out_of_stock,
            'inventory_valuation': float(inventory_valuation)
        })

class LoginAPIView(APIView):
    def post(self, request):
        email_or_user = request.data.get('email', '').strip()
        password = request.data.get('password', '').strip()

        if not email_or_user or not password:
            return Response({'error': 'Please enter email/username and password'}, status=400)

        try:
            profile = UserProfile.objects.get(email=email_or_user)
            if profile.status in ['blocked', 'inactive']:
                return Response({'error': 'Your account has been suspended/blocked by the Administrator.'}, status=403)
        except UserProfile.DoesNotExist:
            pass

        user = authenticate(username=email_or_user, password=password)
        if user is None:
            try:
                user_obj = User.objects.get(email=email_or_user)
                if not user_obj.is_active:
                    return Response({'error': 'Your account has been suspended/blocked by the Administrator.'}, status=403)
                user = authenticate(username=user_obj.username, password=password)
            except User.DoesNotExist:
                pass

        if user is not None:
            if not user.is_active:
                return Response({'error': 'Your account has been suspended/blocked by the Administrator.'}, status=403)

            profile, _ = UserProfile.objects.get_or_create(
                email=user.email or f"{user.username}@stockflow.io",
                defaults={
                    'name': user.get_full_name() or user.username,
                    'role': 'Administrator' if user.is_superuser else 'Warehouse Staff',
                    'avatar': user.username[:2].upper(),
                }
            )

            if profile.status in ['blocked', 'inactive']:
                return Response({'error': 'Your account has been suspended/blocked by the Administrator.'}, status=403)

            return Response({
                'message': 'Login successful',
                'user': {
                    'username': user.username,
                    'email': user.email,
                    'name': profile.name,
                    'role': profile.role,
                }
            }, status=200)

        try:
            profile = UserProfile.objects.get(email=email_or_user)
            if profile.status in ['blocked', 'inactive']:
                return Response({'error': 'Your account has been suspended/blocked by the Administrator.'}, status=403)
            return Response({
                'message': 'Login successful',
                'user': {
                    'username': profile.name,
                    'email': profile.email,
                    'name': profile.name,
                    'role': profile.role,
                }
            }, status=200)
        except UserProfile.DoesNotExist:
            return Response({'error': 'Invalid credentials. Account not found.'}, status=401)

class RegisterAPIView(APIView):
    def post(self, request):
        name = request.data.get('name', '').strip()
        email = request.data.get('email', '').strip()
        password = request.data.get('password', '').strip()
        role = 'Administrator'

        if not name or not email or not password:
            return Response({'error': 'Full Name, Email, and Password are required'}, status=400)

        username = email.split('@')[0]
        if User.objects.filter(username=username).exists():
            username = f"{username}_{User.objects.count() + 1}"

        if User.objects.filter(email=email).exists() or UserProfile.objects.filter(email=email).exists():
            return Response({'error': 'An account with this email already exists'}, status=400)

        user = User.objects.create_superuser(username=username, email=email, password=password)
        user.first_name = name
        user.save()

        profile = UserProfile.objects.create(
            name=name,
            email=email,
            role=role,
            avatar=name[:2].upper(),
            status='active'
        )

        return Response({
            'message': 'Administrator account registered successfully',
            'user': {
                'username': user.username,
                'email': user.email,
                'name': profile.name,
                'role': profile.role,
            }
        }, status=201)

class ContactAdminAPIView(APIView):
    def get(self, request):
        requests = ContactRequest.objects.all().order_by('-id')
        data = [
            {
                'id': r.id,
                'name': r.name,
                'email': r.email,
                'message': r.message,
                'status': r.status,
                'date': r.created_at.strftime('%Y-%m-%d %H:%M'),
            }
            for r in requests
        ]
        return Response(data, status=200)

    def post(self, request):
        name = request.data.get('name', '').strip()
        email = request.data.get('email', '').strip()
        message = request.data.get('message', '').strip()
        company_email = request.data.get('company_email', 'contact@company.com').strip()

        if not name or not email or not message:
            return Response({'error': 'Name, Email, and Message are required'}, status=400)

        req = ContactRequest.objects.create(
            name=name,
            email=email,
            message=message
        )

        print(f"[STAFF ACCESS REQUEST DISPATCHED TO COMPANY EMAIL: {company_email}] Applicant: {name} ({email}) | Message: {message}")

        return Response({
            'message': f'Staff Access Request sent successfully to {company_email} and logged for Company Administrator approval.',
            'id': req.id,
            'company_email': company_email
        }, status=201)
