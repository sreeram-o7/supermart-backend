# SuperMart — Full-Stack Supermarket E-Commerce Platform

A production-grade supermarket e-commerce platform built with React + Django REST Framework.

## Live Demo

- **Frontend:** https://supermart-frontend.vercel.app
- **Backend API:** https://supermart-backend-yi78.onrender.com
- **API Docs:** https://supermart-backend-yi78.onrender.com/api/docs/

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Zustand, TanStack Query |
| Backend | Django 4.2, Django REST Framework, Python 3.12 |
| Database | PostgreSQL 15 (Neon) |
| Auth | JWT (djangorestframework-simplejwt) |
| Deployment | Vercel (frontend), Render (backend) |
| Barcode | ZXing-js |
| Images | Cloudinary |

## Features

### Customer Portal
- Browse and search 10,000+ products
- Barcode scanner to find products instantly
- Add to cart, apply coupons, checkout
- Order tracking with real-time status updates
- Saved delivery addresses
- Order history

### Admin Dashboard
- Product and category management
- Order management with status updates
- User management and role assignment
- Coupon and discount management
- Inventory tracking with low-stock alerts
- Sales analytics with charts

### Delivery Portal
- Delivery partner dashboard
- Assignment management
- Status updates (picked up → out for delivery → delivered)
- OTP-based delivery confirmation

## User Roles

| Role | Access |
|------|--------|
| Customer | Shopping portal |
| Delivery Partner | Delivery portal |
| Delivery Manager | Delivery management |
| Admin | Admin dashboard |
| Super Admin | Full access |

## Local Development

### Backend

```bash
cd SuperMart
python -m venv venv
source venv/Scripts/activate  # Windows Git Bash
pip install -r requirements.txt
cp .env.example .env          # Fill in your values
python manage.py migrate
python manage.py seed_catalog
python manage.py runserver
```

### Frontend

```bash
cd supermart-frontend
npm install
cp .env.example .env          # Fill in VITE_API_BASE_URL
npm run dev
```

## API Documentation

Full Swagger documentation available at `/api/docs/`

## Project Structure