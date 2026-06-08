import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from apps.accounts.models import User


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def test_user(db):
    user = User.objects.create_user(
        email='testuser@example.com',
        password='TestPass@123',
        role='customer',
    )
    user.profile.first_name = 'Test'
    user.profile.last_name = 'User'
    user.profile.save()
    return user


@pytest.mark.django_db
def test_register_success(client):
    response = client.post('/api/v1/auth/register/', {
        'email': 'newuser@example.com',
        'password': 'NewPass@123',
        'password_confirm': 'NewPass@123',
        'first_name': 'New',
        'last_name': 'User',
    }, format='json')
    assert response.status_code == 201
    assert response.data['status'] == 'success'
    assert User.objects.filter(email='newuser@example.com').exists()


@pytest.mark.django_db
def test_register_duplicate_email(client, test_user):
    response = client.post('/api/v1/auth/register/', {
        'email': 'testuser@example.com',
        'password': 'NewPass@123',
        'password_confirm': 'NewPass@123',
        'first_name': 'New',
        'last_name': 'User',
    }, format='json')
    assert response.status_code == 400
    assert response.data['status'] == 'error'


@pytest.mark.django_db
def test_login_success(client, test_user):
    response = client.post('/api/v1/auth/login/', {
        'email': 'testuser@example.com',
        'password': 'TestPass@123',
    }, format='json')
    assert response.status_code == 200
    assert 'access' in response.data['data']
    assert 'refresh' in response.data['data']
    assert response.data['data']['user']['role'] == 'customer'


@pytest.mark.django_db
def test_login_wrong_password(client, test_user):
    response = client.post('/api/v1/auth/login/', {
        'email': 'testuser@example.com',
        'password': 'WrongPass@123',
    }, format='json')
    assert response.status_code == 401


@pytest.mark.django_db
def test_get_me_authenticated(client, test_user):
    client.force_authenticate(user=test_user)
    response = client.get('/api/v1/auth/me/')
    assert response.status_code == 200
    assert response.data['data']['email'] == test_user.email


@pytest.mark.django_db
def test_get_me_unauthenticated(client):
    response = client.get('/api/v1/auth/me/')
    assert response.status_code == 401


@pytest.mark.django_db
def test_password_validation(client):
    response = client.post('/api/v1/auth/register/', {
        'email': 'weak@example.com',
        'password': 'weak',
        'password_confirm': 'weak',
        'first_name': 'Test',
        'last_name': 'User',
    }, format='json')
    assert response.status_code == 400