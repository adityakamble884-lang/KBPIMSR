#!/usr/bin/env bash
set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate

# Automatically populate initial users and seed data if database is empty
python manage.py shell -c "from core.models import User; exit(0 if User.objects.exists() else 1)" || python manage.py seed_data
