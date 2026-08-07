from django.core.management.base import BaseCommand
from inventory.models import Category, Supplier, Product, StockMovement, UserProfile

class Command(BaseCommand):
    help = 'Clears all data from the database so it is completely empty for testing.'

    def handle(self, *args, **options):
        self.stdout.write('Clearing all database records...')

        StockMovement.objects.all().delete()
        Product.objects.all().delete()
        Category.objects.all().delete()
        Supplier.objects.all().delete()
        UserProfile.objects.all().delete()

        self.stdout.write(self.style.SUCCESS('Database is now completely empty!'))
