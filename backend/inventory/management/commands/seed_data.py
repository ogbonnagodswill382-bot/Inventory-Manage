from django.core.management.base import BaseCommand
from inventory.models import Category, Supplier, Product, StockMovement, UserProfile

class Command(BaseCommand):
    help = 'Seeds initial stock inventory mock data'

    def handle(self, *args, **options):
        self.stdout.write('Seeding data...')

        Category.objects.all().delete()
        Supplier.objects.all().delete()
        Product.objects.all().delete()
        StockMovement.objects.all().delete()
        UserProfile.objects.all().delete()

        c1 = Category.objects.create(name='Electronics', status='active')
        c2 = Category.objects.create(name='Groceries', status='active')
        c3 = Category.objects.create(name='Beverages', status='active')
        c4 = Category.objects.create(name='Pharmacy', status='active')
        c5 = Category.objects.create(name='Office Supplies', status='inactive')
        c6 = Category.objects.create(name='Hardware', status='active')

        s1 = Supplier.objects.create(name='NorthWind Traders', contact='Alice Chen', email='alice@northwind.co', phone='+1 415 555 0132', address='San Francisco, CA', status='active')
        s2 = Supplier.objects.create(name='Globex Corp', contact='Marcus Reed', email='m.reed@globex.io', phone='+1 212 555 0198', address='New York, NY', status='active')
        s3 = Supplier.objects.create(name='Umbrella Supplies', contact='Priya Patel', email='priya@umbrella.com', phone='+44 20 7946 0018', address='London, UK', status='active')
        s4 = Supplier.objects.create(name='Initech Distribution', contact='Tom Yang', email='tom@initech.co', phone='+1 512 555 0121', address='Austin, TX', status='active')
        s5 = Supplier.objects.create(name='Acme Wholesale', contact='Sara Lopez', email='sara@acme.com', phone='+1 305 555 0177', address='Miami, FL', status='inactive')

        p1 = Product.objects.create(name='Wireless Headphones Pro', sku='WH-1001', category=c1, supplier=s1, price=129.99, stock=84, threshold=20, emoji='🎧')
        p2 = Product.objects.create(name='Organic Coffee Beans 1kg', sku='CB-2044', category=c2, supplier=s2, price=18.50, stock=12, threshold=25, emoji='☕')
        p3 = Product.objects.create(name='Sparkling Water 24pk', sku='BV-3011', category=c3, supplier=s5, price=14.99, stock=0, threshold=15, emoji='🥤')
        p4 = Product.objects.create(name='Vitamin D3 Softgels', sku='PH-4207', category=c4, supplier=s3, price=22.00, stock=156, threshold=30, emoji='💊')
        p5 = Product.objects.create(name='A4 Printer Paper 500sh', sku='OS-5121', category=c5, supplier=s4, price=8.75, stock=240, threshold=50, emoji='📄')
        p6 = Product.objects.create(name='Cordless Drill 18V', sku='HW-6033', category=c6, supplier=s1, price=189.00, stock=8, threshold=10, emoji='🔧')
        p7 = Product.objects.create(name='USB-C Cable 2m', sku='WH-1099', category=c1, supplier=s2, price=12.99, stock=320, threshold=60, emoji='🔌')

        StockMovement.objects.create(product=p1, type='in', quantity=50, user='Sarah K.', reference='PO-8821', balance=84)
        StockMovement.objects.create(product=p2, type='out', quantity=30, user='Miguel R.', reference='SO-5510', balance=12)
        StockMovement.objects.create(product=p5, type='in', quantity=100, user='James L.', reference='PO-8820', balance=240)

        UserProfile.objects.create(name='Sarah Kim', email='sarah@stockflow.io', role='Administrator', status='active', avatar='SK')
        UserProfile.objects.create(name='Miguel Rodriguez', email='miguel@stockflow.io', role='Inventory Manager', status='active', avatar='MR')
        UserProfile.objects.create(name='James Liu', email='james@stockflow.io', role='Warehouse Staff', status='active', avatar='JL')

        self.stdout.write(self.style.SUCCESS('Successfully seeded database!'))
