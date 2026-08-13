from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db.models import F, Sum
from django.utils import timezone
from django.utils.text import slugify
from .models import CompanyWorkspace, Category, Supplier, Product, StockMovement, BranchTransfer, UserProfile, ContactRequest
from .serializers import (
    CompanyWorkspaceSerializer, CategorySerializer, SupplierSerializer, ProductSerializer,
    StockMovementSerializer, BranchTransferSerializer, UserProfileSerializer
)

class CompanyWorkspaceViewSet(viewsets.ModelViewSet):
    queryset = CompanyWorkspace.objects.all().order_by('-id')
    serializer_class = CompanyWorkspaceSerializer
    lookup_field = 'slug'

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().order_by('-id')
    serializer_class = CategorySerializer

    def get_queryset(self):
        qs = super().get_queryset()
        company_slug = self.request.query_params.get('company_slug')
        if company_slug:
            return qs.filter(company_slug=company_slug)
        return qs

    def perform_create(self, serializer):
        company_slug = self.request.data.get('company_slug', 'default')
        serializer.save(company_slug=company_slug)

class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all().order_by('-id')
    serializer_class = SupplierSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        company_slug = self.request.query_params.get('company_slug')
        if company_slug:
            return qs.filter(company_slug=company_slug)
        return qs

    def perform_create(self, serializer):
        company_slug = self.request.data.get('company_slug', 'default')
        serializer.save(company_slug=company_slug)

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by('-id')
    serializer_class = ProductSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        company_slug = self.request.query_params.get('company_slug')
        if company_slug:
            return qs.filter(company_slug=company_slug)
        return qs

    def create(self, request, *args, **kwargs):
        company_slug = request.data.get('company_slug', 'default')
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
            company_slug=company_slug,
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

    def get_queryset(self):
        qs = super().get_queryset()
        company_slug = self.request.query_params.get('company_slug')
        if company_slug:
            return qs.filter(company_slug=company_slug)
        return qs

class BranchTransferViewSet(viewsets.ModelViewSet):
    queryset = BranchTransfer.objects.all().order_by('-id')
    serializer_class = BranchTransferSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        company_slug = self.request.query_params.get('company_slug')
        if company_slug:
            return qs.filter(company_slug=company_slug)
        return qs

    def perform_create(self, serializer):
        company_slug = self.request.data.get('company_slug', 'default')
        serializer.save(company_slug=company_slug)

    @action(detail=True, methods=['post'])
    def approve_return(self, request, pk=None):
        transfer = self.get_object()
        if transfer.status == 'returned_to_stock':
            return Response({'error': 'This return has already been approved and restocked into inventory.'}, status=400)

        approved_by = request.data.get('approved_by', 'Administrator').strip()
        notes = request.data.get('notes', '').strip()

        product = transfer.product
        product.stock += transfer.quantity
        product.updated_at = 'just now'
        product.save()

        movement = StockMovement.objects.create(
            company_slug=transfer.company_slug,
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

    def get_queryset(self):
        qs = super().get_queryset()
        company_slug = self.request.query_params.get('company_slug')
        if company_slug:
            return qs.filter(company_slug=company_slug)
        return qs

    def create(self, request, *args, **kwargs):
        company_slug = request.data.get('company_slug', 'default')
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
            company_slug=company_slug,
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

class StockInAPIView(APIView):
    def post(self, request):
        company_slug = request.data.get('company_slug', 'default')
        product_id = request.data.get('product_id')
        quantity = int(request.data.get('quantity', 0))
        user = request.data.get('user', 'Staff')
        reference = request.data.get('reference', '')
        notes = request.data.get('notes', '')

        if not product_id or quantity <= 0:
            return Response({'error': 'Please select a valid product and quantity greater than zero.'}, status=400)

        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=404)

        product.stock += quantity
        product.updated_at = 'just now'
        product.save()

        movement = StockMovement.objects.create(
            company_slug=company_slug,
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
        company_slug = request.data.get('company_slug', 'default')
        product_id = request.data.get('product_id')
        quantity = int(request.data.get('quantity', 0))
        user = request.data.get('user', 'Staff')
        reference = request.data.get('reference', '')
        notes = request.data.get('notes', '')

        if not product_id or quantity <= 0:
            return Response({'error': 'Please select a valid product and quantity greater than zero.'}, status=400)

        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=404)

        if product.stock < quantity:
            return Response({'error': f'Insufficient stock balance! Available: {product.stock} units, Requested: {quantity} units.'}, status=400)

        product.stock -= quantity
        product.updated_at = 'just now'
        product.save()

        movement = StockMovement.objects.create(
            company_slug=company_slug,
            product=product,
            type='out',
            quantity=quantity,
            user=user,
            reference=reference,
            notes=notes,
            balance=product.stock
        )

        return Response({
            'message': 'Stock out recorded successfully',
            'movement': StockMovementSerializer(movement).data,
            'new_stock': product.stock
        }, status=201)

class ReportsAPIView(APIView):
    def get(self, request):
        company_slug = request.query_params.get('company_slug')
        products = Product.objects.all()
        categories = Category.objects.all()
        suppliers = Supplier.objects.all()

        if company_slug:
            products = products.filter(company_slug=company_slug)
            categories = categories.filter(company_slug=company_slug)
            suppliers = suppliers.filter(company_slug=company_slug)

        total_products = products.count()
        total_categories = categories.count()
        total_suppliers = suppliers.count()
        total_stock = products.aggregate(total=Sum('stock'))['total'] or 0
        
        low_stock = products.filter(stock__gt=0, stock__lte=F('threshold')).count()
        out_of_stock = products.filter(stock=0).count()
        
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
        company_slug = request.data.get('company_slug')

        if not email_or_user or not password:
            return Response({'error': 'Please enter email/username and password'}, status=400)

        try:
            profiles = UserProfile.objects.filter(email=email_or_user)
            if company_slug:
                profiles = profiles.filter(company_slug=company_slug)
            profile = profiles.first()
            if profile and profile.status in ['blocked', 'inactive']:
                return Response({'error': 'Your account has been suspended/blocked by the Administrator.'}, status=403)
        except UserProfile.DoesNotExist:
            profile = None

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

            comp_slug = company_slug or (profile.company_slug if profile else 'default')
            profile, _ = UserProfile.objects.get_or_create(
                email=user.email or f"{user.username}@stockflow.io",
                defaults={
                    'company_slug': comp_slug,
                    'name': user.get_full_name() or user.username,
                    'role': 'Administrator' if user.is_superuser else 'Warehouse Staff',
                    'avatar': user.username[:2].upper(),
                }
            )

            if profile.status in ['blocked', 'inactive']:
                return Response({'error': 'Your account has been suspended/blocked by the Administrator.'}, status=403)

            comp = CompanyWorkspace.objects.filter(slug=profile.company_slug).first()

            return Response({
                'message': 'Login successful',
                'user': {
                    'username': user.username,
                    'email': user.email,
                    'name': profile.name,
                    'role': profile.role,
                    'company_slug': profile.company_slug,
                    'company_name': comp.name if comp else '',
                    'company_email': comp.contact_email if comp else '',
                }
            }, status=200)

        if profile:
            comp = CompanyWorkspace.objects.filter(slug=profile.company_slug).first()
            return Response({
                'message': 'Login successful',
                'user': {
                    'username': profile.name,
                    'email': profile.email,
                    'name': profile.name,
                    'role': profile.role,
                    'company_slug': profile.company_slug,
                    'company_name': comp.name if comp else '',
                    'company_email': comp.contact_email if comp else '',
                }
            }, status=200)

        return Response({'error': 'Invalid credentials. Account not found.'}, status=401)

class CompanyRegisterAPIView(APIView):
    def post(self, request):
        company_name = request.data.get('company_name', '').strip()
        contact_email = request.data.get('contact_email', '').strip()
        admin_name = request.data.get('admin_name', '').strip()
        admin_email = request.data.get('admin_email', '').strip()
        password = request.data.get('password', '').strip()

        if not company_name or not admin_email or not password:
            return Response({'error': 'Company Name, Admin Email, and Password are required.'}, status=400)

        slug = slugify(company_name)
        if not slug:
            slug = f"company-{CompanyWorkspace.objects.count() + 1}"

        # STRICT IDENTITY & UNIQUNESS GUARD: No two companies can use the same name or slug!
        if CompanyWorkspace.objects.filter(name__iexact=company_name).exists() or CompanyWorkspace.objects.filter(slug=slug).exists():
            return Response({'error': f'Company name or workspace identity "{company_name}" is already registered. Please enter a unique company name.'}, status=400)

        if User.objects.filter(email=admin_email).exists() or UserProfile.objects.filter(email=admin_email).exists():
            return Response({'error': f'An account with email "{admin_email}" already exists.'}, status=400)

        company = CompanyWorkspace.objects.create(
            name=company_name,
            slug=slug,
            contact_email=contact_email or admin_email,
            admin_name=admin_name or 'Administrator'
        )

        username = admin_email.split('@')[0]
        if User.objects.filter(username=username).exists():
            username = f"{username}_{User.objects.count() + 1}"

        user = User.objects.create_superuser(username=username, email=admin_email, password=password)
        user.first_name = admin_name or 'Administrator'
        user.save()

        profile = UserProfile.objects.create(
            company_slug=slug,
            name=admin_name or 'Administrator',
            email=admin_email,
            role='Administrator',
            avatar=(admin_name or 'AD')[:2].upper(),
            status='active'
        )

        return Response({
            'message': f'Company workspace "{company_name}" registered successfully!',
            'company': {
                'id': company.id,
                'name': company.name,
                'slug': company.slug,
                'contact_email': company.contact_email,
            },
            'user': {
                'username': user.username,
                'email': user.email,
                'name': profile.name,
                'role': profile.role,
                'company_slug': profile.company_slug,
                'company_name': company.name,
                'company_email': company.contact_email,
            }
        }, status=201)

class CompanyLookupAPIView(APIView):
    def get(self, request, slug):
        try:
            company = CompanyWorkspace.objects.get(slug=slug)
            return Response({
                'id': company.id,
                'name': company.name,
                'slug': company.slug,
                'contact_email': company.contact_email,
                'admin_name': company.admin_name,
            }, status=200)
        except CompanyWorkspace.DoesNotExist:
            return Response({'error': f'Company workspace "{slug}" not found.'}, status=404)

class RegisterAPIView(APIView):
    def post(self, request):
        company_slug = request.data.get('company_slug', 'default')
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
            company_slug=company_slug,
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
                'company_slug': profile.company_slug,
            }
        }, status=201)

class ContactAdminAPIView(APIView):
    def get(self, request):
        company_slug = request.query_params.get('company_slug')
        requests = ContactRequest.objects.all().order_by('-id')
        if company_slug:
            requests = requests.filter(company_slug=company_slug)

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
        company_slug = request.data.get('company_slug', 'default')
        name = request.data.get('name', '').strip()
        email = request.data.get('email', '').strip()
        message = request.data.get('message', '').strip()
        company_email = request.data.get('company_email', 'contact@company.com').strip()

        if not name or not email or not message:
            return Response({'error': 'Name, Email, and Message are required'}, status=400)

        req = ContactRequest.objects.create(
            company_slug=company_slug,
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
