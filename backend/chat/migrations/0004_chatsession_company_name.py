# Generated migration for company_name field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('chat', '0003_chatsession_revenue'),
    ]

    operations = [
        migrations.AddField(
            model_name='chatsession',
            name='company_name',
            field=models.CharField(blank=True, default='', max_length=255),
        ),
    ]