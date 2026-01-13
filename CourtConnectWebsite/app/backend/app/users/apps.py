from django.apps import AppConfig


class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'app.users'

    def ready(self):
        """Import signals when the app is ready"""
        import app.utils.signals  # noqa: F401