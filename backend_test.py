#!/usr/bin/env python3
"""
Comprehensive Backend Test for Caisy Perfume E-commerce
Tests all backend APIs according to priority order
"""

import requests
import json
import time
import random
import string
from datetime import datetime

# Base URL from environment
BASE_URL = "https://dupe-fragrance-shop.preview.emergentagent.com/api"

# Test data
ADMIN_EMAIL = "admin@caisyperfume.com"
ADMIN_PASSWORD = "Admin@Caisy2024!"

def generate_random_email():
    """Generate random email for testing"""
    random_str = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
    return f"test{random_str}@example.com"

def log_test(test_name, success, details=""):
    """Log test results"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status} {test_name}")
    if details:
        print(f"    {details}")
    return success

class CaisyBackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        self.user_token = None
        self.test_user_email = None
        self.test_order_id = None
        self.test_product_id = None
        
    def test_1_public_basics(self):
        """Test public basic endpoints"""
        print("\n=== 1. PUBLIC BASICS ===")
        
        # Health check
        try:
            resp = self.session.get(f"{BASE_URL}/health")
            success = resp.status_code == 200 and resp.json().get('ok') == True
            log_test("GET /api/health", success, f"Status: {resp.status_code}, Response: {resp.json()}")
        except Exception as e:
            log_test("GET /api/health", False, f"Error: {e}")
            
        # Products default (12 products with pagination)
        try:
            resp = self.session.get(f"{BASE_URL}/products")
            data = resp.json()
            success = (resp.status_code == 200 and 
                      'products' in data and 
                      len(data['products']) <= 12 and
                      'total' in data and 'page' in data)
            log_test("GET /api/products (default)", success, 
                    f"Status: {resp.status_code}, Products: {len(data.get('products', []))}, Total: {data.get('total')}")
            
            # Store first product ID for later tests
            if data.get('products'):
                self.test_product_id = data['products'][0]['id']
        except Exception as e:
            log_test("GET /api/products (default)", False, f"Error: {e}")
            
        # Products by category - wanita
        try:
            resp = self.session.get(f"{BASE_URL}/products?category=wanita")
            data = resp.json()
            success = resp.status_code == 200 and 'products' in data
            wanita_count = len(data.get('products', []))
            log_test("GET /api/products?category=wanita", success, 
                    f"Status: {resp.status_code}, Wanita products: {wanita_count}")
        except Exception as e:
            log_test("GET /api/products?category=wanita", False, f"Error: {e}")
            
        # Products by category - pria
        try:
            resp = self.session.get(f"{BASE_URL}/products?category=pria")
            data = resp.json()
            success = resp.status_code == 200 and 'products' in data
            pria_count = len(data.get('products', []))
            log_test("GET /api/products?category=pria", success, 
                    f"Status: {resp.status_code}, Pria products: {pria_count}")
        except Exception as e:
            log_test("GET /api/products?category=pria", False, f"Error: {e}")
            
        # Products by category - unisex
        try:
            resp = self.session.get(f"{BASE_URL}/products?category=unisex")
            data = resp.json()
            success = resp.status_code == 200 and 'products' in data
            unisex_count = len(data.get('products', []))
            log_test("GET /api/products?category=unisex", success, 
                    f"Status: {resp.status_code}, Unisex products: {unisex_count}")
        except Exception as e:
            log_test("GET /api/products?category=unisex", False, f"Error: {e}")
            
        # Search for "rose"
        try:
            resp = self.session.get(f"{BASE_URL}/products?search=rose")
            data = resp.json()
            success = resp.status_code == 200 and 'products' in data
            found_rose = any('rose' in p.get('name', '').lower() for p in data.get('products', []))
            log_test("GET /api/products?search=rose", success, 
                    f"Status: {resp.status_code}, Found Rose products: {found_rose}")
        except Exception as e:
            log_test("GET /api/products?search=rose", False, f"Error: {e}")
            
        # Sort by price ascending with limit
        try:
            resp = self.session.get(f"{BASE_URL}/products?sort=price_asc&limit=3")
            data = resp.json()
            success = resp.status_code == 200 and len(data.get('products', [])) <= 3
            if success and data.get('products'):
                prices = [p.get('price', 0) for p in data['products']]
                success = prices == sorted(prices)  # Check if sorted ascending
            log_test("GET /api/products?sort=price_asc&limit=3", success, 
                    f"Status: {resp.status_code}, Products: {len(data.get('products', []))}")
        except Exception as e:
            log_test("GET /api/products?sort=price_asc&limit=3", False, f"Error: {e}")
            
        # Price range filter
        try:
            resp = self.session.get(f"{BASE_URL}/products?min_price=100000&max_price=130000")
            data = resp.json()
            success = resp.status_code == 200 and 'products' in data
            if success and data.get('products'):
                in_range = all(100000 <= p.get('price', 0) <= 130000 for p in data['products'])
                success = in_range
            log_test("GET /api/products?min_price=100000&max_price=130000", success, 
                    f"Status: {resp.status_code}, Products in range: {len(data.get('products', []))}")
        except Exception as e:
            log_test("GET /api/products?min_price=100000&max_price=130000", False, f"Error: {e}")
            
        # Featured products
        try:
            resp = self.session.get(f"{BASE_URL}/products/featured")
            data = resp.json()
            success = resp.status_code == 200 and 'products' in data and len(data['products']) <= 8
            log_test("GET /api/products/featured", success, 
                    f"Status: {resp.status_code}, Featured products: {len(data.get('products', []))}")
        except Exception as e:
            log_test("GET /api/products/featured", False, f"Error: {e}")
            
        # Product by slug
        try:
            resp = self.session.get(f"{BASE_URL}/products/slug/rose-elegante")
            data = resp.json()
            success = resp.status_code == 200 and 'product' in data and 'related' in data
            log_test("GET /api/products/slug/rose-elegante", success, 
                    f"Status: {resp.status_code}, Has product: {'product' in data}, Has related: {'related' in data}")
        except Exception as e:
            log_test("GET /api/products/slug/rose-elegante", False, f"Error: {e}")
    
    def test_2_auth_flow(self):
        """Test authentication flow"""
        print("\n=== 2. AUTH FLOW ===")
        
        # Generate random email for testing
        self.test_user_email = generate_random_email()
        
        # Register new user
        try:
            register_data = {
                "name": "Test User",
                "email": self.test_user_email,
                "password": "TestPassword123!",
                "phone": "081234567890"
            }
            resp = self.session.post(f"{BASE_URL}/auth/register", json=register_data)
            data = resp.json()
            success = (resp.status_code == 200 and 
                      'user' in data and 'token' in data and
                      data['user']['email'] == self.test_user_email)
            if success:
                self.user_token = data['token']
            log_test("POST /api/auth/register (new user)", success, 
                    f"Status: {resp.status_code}, Has token: {'token' in data}")
        except Exception as e:
            log_test("POST /api/auth/register (new user)", False, f"Error: {e}")
            
        # Try to register same email again (should fail)
        try:
            resp = self.session.post(f"{BASE_URL}/auth/register", json=register_data)
            success = resp.status_code == 409  # Conflict
            log_test("POST /api/auth/register (duplicate email)", success, 
                    f"Status: {resp.status_code} (expected 409)")
        except Exception as e:
            log_test("POST /api/auth/register (duplicate email)", False, f"Error: {e}")
            
        # Login with wrong password
        try:
            login_data = {
                "email": self.test_user_email,
                "password": "WrongPassword"
            }
            resp = self.session.post(f"{BASE_URL}/auth/login", json=login_data)
            success = resp.status_code == 401  # Unauthorized
            log_test("POST /api/auth/login (wrong password)", success, 
                    f"Status: {resp.status_code} (expected 401)")
        except Exception as e:
            log_test("POST /api/auth/login (wrong password)", False, f"Error: {e}")
            
        # Login with correct credentials
        try:
            login_data = {
                "email": self.test_user_email,
                "password": "TestPassword123!"
            }
            resp = self.session.post(f"{BASE_URL}/auth/login", json=login_data)
            data = resp.json()
            success = (resp.status_code == 200 and 
                      'user' in data and 'token' in data)
            if success:
                self.user_token = data['token']
            log_test("POST /api/auth/login (correct creds)", success, 
                    f"Status: {resp.status_code}, Has token: {'token' in data}")
        except Exception as e:
            log_test("POST /api/auth/login (correct creds)", False, f"Error: {e}")
            
        # Get current user info
        try:
            headers = {'Cookie': f'caisy_token={self.user_token}'} if self.user_token else {}
            resp = self.session.get(f"{BASE_URL}/auth/me", headers=headers)
            data = resp.json()
            success = (resp.status_code == 200 and 
                      'user' in data and 
                      data['user'] is not None)
            log_test("GET /api/auth/me (with cookie)", success, 
                    f"Status: {resp.status_code}, User: {data.get('user', {}).get('email', 'None')}")
        except Exception as e:
            log_test("GET /api/auth/me (with cookie)", False, f"Error: {e}")
            
        # Update user profile
        try:
            update_data = {
                "name": "Updated Test User",
                "phone": "081987654321"
            }
            headers = {'Cookie': f'caisy_token={self.user_token}'} if self.user_token else {}
            resp = self.session.post(f"{BASE_URL}/auth/update", json=update_data, headers=headers)
            data = resp.json()
            success = (resp.status_code == 200 and 
                      'user' in data and
                      data['user']['name'] == "Updated Test User")
            log_test("POST /api/auth/update (with cookie)", success, 
                    f"Status: {resp.status_code}, Updated name: {data.get('user', {}).get('name', 'None')}")
        except Exception as e:
            log_test("POST /api/auth/update (with cookie)", False, f"Error: {e}")
            
        # Login as admin
        try:
            admin_login_data = {
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            }
            resp = self.session.post(f"{BASE_URL}/auth/login", json=admin_login_data)
            data = resp.json()
            success = (resp.status_code == 200 and 
                      'user' in data and 'token' in data and
                      data['user']['role'] == 'admin')
            if success:
                self.admin_token = data['token']
            log_test("POST /api/auth/login (admin)", success, 
                    f"Status: {resp.status_code}, Role: {data.get('user', {}).get('role', 'None')}")
        except Exception as e:
            log_test("POST /api/auth/login (admin)", False, f"Error: {e}")
            
        # Logout
        try:
            resp = self.session.post(f"{BASE_URL}/auth/logout")
            success = resp.status_code == 200
            log_test("POST /api/auth/logout", success, f"Status: {resp.status_code}")
        except Exception as e:
            log_test("POST /api/auth/logout", False, f"Error: {e}")
    
    def test_3_ai_smart_search(self):
        """Test AI Smart Search with Gemini"""
        print("\n=== 3. AI SMART SEARCH (Gemini 2.5 Flash) ===")
        
        # Test 1: Parfum wanita floral manis
        try:
            search_data = {"query": "parfum wanita floral manis"}
            resp = self.session.post(f"{BASE_URL}/smart-search", json=search_data)
            data = resp.json()
            success = (resp.status_code == 200 and 
                      'products' in data and 
                      len(data.get('products', [])) >= 3 and
                      len(data.get('products', [])) <= 5)
            # Check if products have ai_reason
            has_ai_reason = all('ai_reason' in p for p in data.get('products', []))
            log_test("POST /api/smart-search (parfum wanita floral manis)", success and has_ai_reason, 
                    f"Status: {resp.status_code}, Products: {len(data.get('products', []))}, Has AI reasons: {has_ai_reason}")
        except Exception as e:
            log_test("POST /api/smart-search (parfum wanita floral manis)", False, f"Error: {e}")
            
        # Test 2: Parfum pria maskulin
        try:
            search_data = {"query": "parfum pria maskulin"}
            resp = self.session.post(f"{BASE_URL}/smart-search", json=search_data)
            data = resp.json()
            success = (resp.status_code == 200 and 
                      'products' in data and 
                      len(data.get('products', [])) >= 1)
            # Check if returned products are mostly pria category
            pria_products = [p for p in data.get('products', []) if p.get('category') == 'pria']
            has_pria = len(pria_products) > 0
            log_test("POST /api/smart-search (parfum pria maskulin)", success and has_pria, 
                    f"Status: {resp.status_code}, Products: {len(data.get('products', []))}, Pria products: {len(pria_products)}")
        except Exception as e:
            log_test("POST /api/smart-search (parfum pria maskulin)", False, f"Error: {e}")
            
        # Test 3: Parfum oud mewah
        try:
            search_data = {"query": "parfum oud mewah"}
            resp = self.session.post(f"{BASE_URL}/smart-search", json=search_data)
            data = resp.json()
            success = resp.status_code == 200 and 'products' in data
            # Check if any product mentions "oud" or "Dark Oud"
            has_oud = any('oud' in p.get('name', '').lower() or 'oud' in p.get('description', '').lower() 
                         for p in data.get('products', []))
            log_test("POST /api/smart-search (parfum oud mewah)", success, 
                    f"Status: {resp.status_code}, Products: {len(data.get('products', []))}, Has Oud: {has_oud}")
        except Exception as e:
            log_test("POST /api/smart-search (parfum oud mewah)", False, f"Error: {e}")
    
    def test_4_cart(self):
        """Test cart functionality"""
        print("\n=== 4. CART (user logged in) ===")
        
        # Login first
        if not self.user_token:
            try:
                login_data = {
                    "email": self.test_user_email,
                    "password": "TestPassword123!"
                }
                resp = self.session.post(f"{BASE_URL}/auth/login", json=login_data)
                data = resp.json()
                if resp.status_code == 200:
                    self.user_token = data['token']
            except:
                pass
                
        headers = {'Cookie': f'caisy_token={self.user_token}'} if self.user_token else {}
        
        # Get empty cart
        try:
            resp = self.session.get(f"{BASE_URL}/cart", headers=headers)
            data = resp.json()
            success = resp.status_code == 200 and 'items' in data
            log_test("GET /api/cart (empty)", success, 
                    f"Status: {resp.status_code}, Items: {len(data.get('items', []))}")
        except Exception as e:
            log_test("GET /api/cart (empty)", False, f"Error: {e}")
            
        # Add items to cart
        try:
            cart_data = {
                "items": [
                    {
                        "product_id": self.test_product_id or "test-product-1",
                        "quantity": 2,
                        "name": "Test Product",
                        "price": 95000,
                        "image_url": "test.jpg"
                    }
                ]
            }
            resp = self.session.post(f"{BASE_URL}/cart", json=cart_data, headers=headers)
            data = resp.json()
            success = resp.status_code == 200 and data.get('ok') == True
            log_test("POST /api/cart (add items)", success, 
                    f"Status: {resp.status_code}, Response: {data}")
        except Exception as e:
            log_test("POST /api/cart (add items)", False, f"Error: {e}")
            
        # Get cart with items
        try:
            resp = self.session.get(f"{BASE_URL}/cart", headers=headers)
            data = resp.json()
            success = resp.status_code == 200 and len(data.get('items', [])) > 0
            log_test("GET /api/cart (with items)", success, 
                    f"Status: {resp.status_code}, Items: {len(data.get('items', []))}")
        except Exception as e:
            log_test("GET /api/cart (with items)", False, f"Error: {e}")
    
    def test_5_location_dropdowns(self):
        """Test location dropdown endpoints"""
        print("\n=== 5. LOCATION DROPDOWNS ===")
        
        # Get provinces
        try:
            resp = self.session.get(f"{BASE_URL}/location/provinces")
            data = resp.json()
            success = (resp.status_code == 200 and 
                      'provinces' in data and 
                      len(data['provinces']) == 6)
            log_test("GET /api/location/provinces", success, 
                    f"Status: {resp.status_code}, Provinces: {len(data.get('provinces', []))}")
        except Exception as e:
            log_test("GET /api/location/provinces", False, f"Error: {e}")
            
        # Get cities for DKI Jakarta (province_id=31)
        try:
            resp = self.session.get(f"{BASE_URL}/location/cities?province_id=31")
            data = resp.json()
            success = resp.status_code == 200 and 'cities' in data
            has_jakarta_pusat = any('Jakarta Pusat' in city.get('name', '') for city in data.get('cities', []))
            log_test("GET /api/location/cities?province_id=31", success, 
                    f"Status: {resp.status_code}, Cities: {len(data.get('cities', []))}, Has Jakarta Pusat: {has_jakarta_pusat}")
        except Exception as e:
            log_test("GET /api/location/cities?province_id=31", False, f"Error: {e}")
            
        # Get districts for Jakarta Pusat (city_id=3171)
        try:
            resp = self.session.get(f"{BASE_URL}/location/districts?city_id=3171")
            data = resp.json()
            success = resp.status_code == 200 and 'districts' in data
            has_jubelio_id = all('jubelio_destination_id' in d for d in data.get('districts', []))
            log_test("GET /api/location/districts?city_id=3171", success, 
                    f"Status: {resp.status_code}, Districts: {len(data.get('districts', []))}, Has Jubelio IDs: {has_jubelio_id}")
        except Exception as e:
            log_test("GET /api/location/districts?city_id=3171", False, f"Error: {e}")
    
    def test_6_shipping_rates(self):
        """Test shipping rates"""
        print("\n=== 6. SHIPPING RATES ===")
        
        try:
            shipping_data = {
                "district_id": "317101",  # Jakarta Pusat district
                "weight": 300,
                "subtotal": 200000
            }
            resp = self.session.post(f"{BASE_URL}/shipping/rates", json=shipping_data)
            data = resp.json()
            success = resp.status_code == 200 and 'rates' in data
            rates = data.get('rates', [])
            has_required_fields = all(
                'courier' in rate and 'service' in rate and 'etd' in rate and 'price' in rate 
                for rate in rates
            )
            # Should have fallback mock rates (6 options)
            has_fallback = len(rates) >= 6
            log_test("POST /api/shipping/rates", success and has_required_fields, 
                    f"Status: {resp.status_code}, Rates: {len(rates)}, Has required fields: {has_required_fields}, Has fallback: {has_fallback}")
        except Exception as e:
            log_test("POST /api/shipping/rates", False, f"Error: {e}")
    
    def test_7_orders(self):
        """Test order creation and retrieval"""
        print("\n=== 7. ORDERS ===")
        
        # Login first
        if not self.user_token:
            try:
                login_data = {
                    "email": self.test_user_email,
                    "password": "TestPassword123!"
                }
                resp = self.session.post(f"{BASE_URL}/auth/login", json=login_data)
                data = resp.json()
                if resp.status_code == 200:
                    self.user_token = data['token']
            except:
                pass
                
        headers = {'Cookie': f'caisy_token={self.user_token}'} if self.user_token else {}
        
        # Create order
        try:
            order_data = {
                "items": [
                    {
                        "product_id": self.test_product_id or "test-product-1",
                        "quantity": 1
                    }
                ],
                "guest_name": "Test Customer",
                "guest_email": "test@example.com",
                "guest_phone": "081234567890",
                "district_id": "317101",
                "address_detail": "Jl. Test No. 123",
                "postal_code": "10110",
                "shipping_cost": 15000,
                "shipping_carrier": "JNE",
                "shipping_service": "REG",
                "shipping_etd": "2-3 hari"
            }
            resp = self.session.post(f"{BASE_URL}/orders", json=order_data, headers=headers)
            data = resp.json()
            success = (resp.status_code == 200 and 
                      'order' in data and 
                      data['order'].get('order_code', '').startswith('CAISY-') and
                      data['order'].get('status') == 'pending')
            if success:
                self.test_order_id = data['order']['id']
            log_test("POST /api/orders (create)", success, 
                    f"Status: {resp.status_code}, Order code: {data.get('order', {}).get('order_code', 'None')}")
        except Exception as e:
            log_test("POST /api/orders (create)", False, f"Error: {e}")
            
        # Test stock validation (over-quantity should fail)
        try:
            order_data_invalid = {
                "items": [
                    {
                        "product_id": self.test_product_id or "test-product-1",
                        "quantity": 9999  # Excessive quantity
                    }
                ],
                "guest_name": "Test Customer",
                "guest_email": "test@example.com"
            }
            resp = self.session.post(f"{BASE_URL}/orders", json=order_data_invalid, headers=headers)
            success = resp.status_code == 400  # Should fail with stock error
            log_test("POST /api/orders (stock validation)", success, 
                    f"Status: {resp.status_code} (expected 400 for insufficient stock)")
        except Exception as e:
            log_test("POST /api/orders (stock validation)", False, f"Error: {e}")
            
        # Get order by ID
        if self.test_order_id:
            try:
                resp = self.session.get(f"{BASE_URL}/orders/{self.test_order_id}")
                data = resp.json()
                success = resp.status_code == 200 and 'order' in data
                log_test("GET /api/orders/:id", success, 
                        f"Status: {resp.status_code}, Order ID: {data.get('order', {}).get('id', 'None')}")
            except Exception as e:
                log_test("GET /api/orders/:id", False, f"Error: {e}")
                
        # Get user's orders
        try:
            resp = self.session.get(f"{BASE_URL}/orders", headers=headers)
            data = resp.json()
            success = resp.status_code == 200 and 'orders' in data
            log_test("GET /api/orders (user's orders)", success, 
                    f"Status: {resp.status_code}, Orders count: {len(data.get('orders', []))}")
        except Exception as e:
            log_test("GET /api/orders (user's orders)", False, f"Error: {e}")
    
    def test_8_midtrans_payment(self):
        """Test Midtrans payment integration"""
        print("\n=== 8. MIDTRANS PAYMENT ===")
        
        if not self.test_order_id:
            log_test("POST /api/payment/create-transaction", False, "No test order ID available")
            return
            
        try:
            payment_data = {"order_id": self.test_order_id}
            resp = self.session.post(f"{BASE_URL}/payment/create-transaction", json=payment_data)
            data = resp.json()
            success = resp.status_code == 200 and 'snap_token' in data
            log_test("POST /api/payment/create-transaction", success, 
                    f"Status: {resp.status_code}, Has snap_token: {'snap_token' in data}")
            if not success and 'error' in data:
                print(f"    Midtrans error: {data['error']}")
        except Exception as e:
            log_test("POST /api/payment/create-transaction", False, f"Error: {e}")
    
    def test_9_waiting_list(self):
        """Test waiting list functionality"""
        print("\n=== 9. WAITING LIST ===")
        
        # Submit waiting list request
        try:
            waiting_data = {
                "requester_name": "Test Requester",
                "requester_email": "requester@example.com",
                "perfume_name": "Chanel Coco",
                "brand": "Chanel",
                "gender_preference": "wanita",
                "description": "Looking for this classic fragrance"
            }
            resp = self.session.post(f"{BASE_URL}/waiting-list", json=waiting_data)
            data = resp.json()
            success = resp.status_code == 200 and data.get('ok') == True
            log_test("POST /api/waiting-list (first request)", success, 
                    f"Status: {resp.status_code}, Response: {data}")
        except Exception as e:
            log_test("POST /api/waiting-list (first request)", False, f"Error: {e}")
            
        # Submit same perfume again (should increment count)
        try:
            waiting_data_2 = {
                "requester_name": "Another Requester",
                "requester_email": "another@example.com",
                "perfume_name": "Chanel Coco",  # Same perfume
                "brand": "Chanel",
                "gender_preference": "wanita"
            }
            resp = self.session.post(f"{BASE_URL}/waiting-list", json=waiting_data_2)
            data = resp.json()
            success = resp.status_code == 200 and data.get('ok') == True
            log_test("POST /api/waiting-list (duplicate perfume)", success, 
                    f"Status: {resp.status_code}, Should increment count")
        except Exception as e:
            log_test("POST /api/waiting-list (duplicate perfume)", False, f"Error: {e}")
            
        # Get top waiting list
        try:
            resp = self.session.get(f"{BASE_URL}/waiting-list/top")
            data = resp.json()
            success = resp.status_code == 200 and 'items' in data
            # Check if Chanel Coco has request_count = 2
            chanel_coco = next((item for item in data.get('items', []) 
                              if item.get('perfume_name') == 'Chanel Coco'), None)
            has_correct_count = chanel_coco and chanel_coco.get('request_count') == 2
            log_test("GET /api/waiting-list/top", success, 
                    f"Status: {resp.status_code}, Items: {len(data.get('items', []))}, Chanel Coco count: {chanel_coco.get('request_count') if chanel_coco else 'Not found'}")
        except Exception as e:
            log_test("GET /api/waiting-list/top", False, f"Error: {e}")
    
    def test_10_admin_apis(self):
        """Test admin APIs"""
        print("\n=== 10. ADMIN APIs (requires admin auth) ===")
        
        # Login as admin first
        if not self.admin_token:
            try:
                admin_login_data = {
                    "email": ADMIN_EMAIL,
                    "password": ADMIN_PASSWORD
                }
                resp = self.session.post(f"{BASE_URL}/auth/login", json=admin_login_data)
                data = resp.json()
                if resp.status_code == 200:
                    self.admin_token = data['token']
            except:
                pass
                
        admin_headers = {'Cookie': f'caisy_token={self.admin_token}'} if self.admin_token else {}
        
        # Admin stats
        try:
            resp = self.session.get(f"{BASE_URL}/admin/stats", headers=admin_headers)
            data = resp.json()
            required_fields = ['revenueToday', 'revenueMonth', 'ordersToday', 'ordersMonth', 
                             'statusBreakdown', 'criticalStock', 'salesChart', 'categoryDistribution', 'latestOrders']
            success = resp.status_code == 200 and all(field in data for field in required_fields)
            log_test("GET /api/admin/stats", success, 
                    f"Status: {resp.status_code}, Has all required fields: {success}")
        except Exception as e:
            log_test("GET /api/admin/stats", False, f"Error: {e}")
            
        # Admin products list
        try:
            resp = self.session.get(f"{BASE_URL}/admin/products", headers=admin_headers)
            data = resp.json()
            success = resp.status_code == 200 and 'products' in data
            log_test("GET /api/admin/products", success, 
                    f"Status: {resp.status_code}, Products: {len(data.get('products', []))}")
        except Exception as e:
            log_test("GET /api/admin/products", False, f"Error: {e}")
            
        # Create new product
        try:
            new_product = {
                "name": "Test Product Admin",
                "category": "unisex",
                "description": "Test product created by admin",
                "price": 150000,
                "stock": 50,
                "is_active": True,
                "is_featured": False
            }
            resp = self.session.post(f"{BASE_URL}/admin/products", json=new_product, headers=admin_headers)
            data = resp.json()
            success = resp.status_code == 200 and 'product' in data
            created_product_id = data.get('product', {}).get('id')
            log_test("POST /api/admin/products", success, 
                    f"Status: {resp.status_code}, Created product ID: {created_product_id}")
        except Exception as e:
            log_test("POST /api/admin/products", False, f"Error: {e}")
            
        # Update product
        if created_product_id:
            try:
                update_data = {
                    "name": "Updated Test Product",
                    "price": 175000
                }
                resp = self.session.put(f"{BASE_URL}/admin/products/{created_product_id}", 
                                      json=update_data, headers=admin_headers)
                data = resp.json()
                success = resp.status_code == 200 and 'product' in data
                log_test("PUT /api/admin/products/:id", success, 
                        f"Status: {resp.status_code}, Updated: {success}")
            except Exception as e:
                log_test("PUT /api/admin/products/:id", False, f"Error: {e}")
                
        # Delete product
        if created_product_id:
            try:
                resp = self.session.delete(f"{BASE_URL}/admin/products/{created_product_id}", 
                                         headers=admin_headers)
                data = resp.json()
                success = resp.status_code == 200 and data.get('ok') == True
                log_test("DELETE /api/admin/products/:id", success, 
                        f"Status: {resp.status_code}, Deleted: {success}")
            except Exception as e:
                log_test("DELETE /api/admin/products/:id", False, f"Error: {e}")
                
        # Admin orders
        try:
            resp = self.session.get(f"{BASE_URL}/admin/orders", headers=admin_headers)
            data = resp.json()
            success = resp.status_code == 200 and 'orders' in data
            log_test("GET /api/admin/orders", success, 
                    f"Status: {resp.status_code}, Orders: {len(data.get('orders', []))}")
        except Exception as e:
            log_test("GET /api/admin/orders", False, f"Error: {e}")
            
        # Update order status
        if self.test_order_id:
            try:
                status_data = {
                    "status": "shipped",
                    "tracking_number": "JNE123456789"
                }
                resp = self.session.patch(f"{BASE_URL}/admin/orders/{self.test_order_id}/status", 
                                        json=status_data, headers=admin_headers)
                data = resp.json()
                success = resp.status_code == 200 and data.get('ok') == True
                log_test("PATCH /api/admin/orders/:id/status", success, 
                        f"Status: {resp.status_code}, Updated: {success}")
            except Exception as e:
                log_test("PATCH /api/admin/orders/:id/status", False, f"Error: {e}")
                
        # Admin customers
        try:
            resp = self.session.get(f"{BASE_URL}/admin/customers", headers=admin_headers)
            data = resp.json()
            success = resp.status_code == 200 and 'customers' in data
            # Check if customers have order_count and total_spend
            has_stats = all('order_count' in c and 'total_spend' in c for c in data.get('customers', []))
            log_test("GET /api/admin/customers", success and has_stats, 
                    f"Status: {resp.status_code}, Customers: {len(data.get('customers', []))}, Has stats: {has_stats}")
        except Exception as e:
            log_test("GET /api/admin/customers", False, f"Error: {e}")
            
        # Admin stock
        try:
            resp = self.session.get(f"{BASE_URL}/admin/stock", headers=admin_headers)
            data = resp.json()
            success = resp.status_code == 200 and 'stock' in data
            # Check if stock items have total_sold
            has_sold_stats = all('total_sold' in item for item in data.get('stock', []))
            log_test("GET /api/admin/stock", success and has_sold_stats, 
                    f"Status: {resp.status_code}, Stock items: {len(data.get('stock', []))}, Has sold stats: {has_sold_stats}")
        except Exception as e:
            log_test("GET /api/admin/stock", False, f"Error: {e}")
            
        # Stock adjustment (positive)
        if self.test_product_id:
            try:
                adjust_data = {
                    "product_id": self.test_product_id,
                    "quantity_change": 10,
                    "reason": "Restock Barang Masuk",
                    "notes": "Test adjustment"
                }
                resp = self.session.post(f"{BASE_URL}/admin/stock/adjust", 
                                       json=adjust_data, headers=admin_headers)
                data = resp.json()
                success = resp.status_code == 200 and data.get('ok') == True and 'new_stock' in data
                log_test("POST /api/admin/stock/adjust (positive)", success, 
                        f"Status: {resp.status_code}, New stock: {data.get('new_stock', 'None')}")
            except Exception as e:
                log_test("POST /api/admin/stock/adjust (positive)", False, f"Error: {e}")
                
        # Stock adjustment (negative that goes below 0 - should fail)
        if self.test_product_id:
            try:
                adjust_data = {
                    "product_id": self.test_product_id,
                    "quantity_change": -9999,  # Large negative
                    "reason": "Test negative adjustment",
                    "notes": "Should fail"
                }
                resp = self.session.post(f"{BASE_URL}/admin/stock/adjust", 
                                       json=adjust_data, headers=admin_headers)
                success = resp.status_code == 400  # Should fail
                log_test("POST /api/admin/stock/adjust (negative below 0)", success, 
                        f"Status: {resp.status_code} (expected 400)")
            except Exception as e:
                log_test("POST /api/admin/stock/adjust (negative below 0)", False, f"Error: {e}")
                
        # Stock logs
        try:
            resp = self.session.get(f"{BASE_URL}/admin/stock/logs", headers=admin_headers)
            data = resp.json()
            success = resp.status_code == 200 and 'logs' in data
            # Check if logs have product_name joined
            has_product_names = all('product_name' in log for log in data.get('logs', []))
            log_test("GET /api/admin/stock/logs", success and has_product_names, 
                    f"Status: {resp.status_code}, Logs: {len(data.get('logs', []))}, Has product names: {has_product_names}")
        except Exception as e:
            log_test("GET /api/admin/stock/logs", False, f"Error: {e}")
            
        # Admin waiting list
        try:
            resp = self.session.get(f"{BASE_URL}/admin/waiting-list", headers=admin_headers)
            data = resp.json()
            success = resp.status_code == 200 and 'items' in data
            log_test("GET /api/admin/waiting-list", success, 
                    f"Status: {resp.status_code}, Items: {len(data.get('items', []))}")
        except Exception as e:
            log_test("GET /api/admin/waiting-list", False, f"Error: {e}")
            
        # Update waiting list status
        try:
            # Get first waiting list item
            resp = self.session.get(f"{BASE_URL}/admin/waiting-list", headers=admin_headers)
            data = resp.json()
            if data.get('items'):
                item_id = data['items'][0]['id']
                status_data = {"status": "fulfilled"}
                resp = self.session.patch(f"{BASE_URL}/admin/waiting-list/{item_id}", 
                                        json=status_data, headers=admin_headers)
                data = resp.json()
                success = resp.status_code == 200 and data.get('ok') == True
                log_test("PATCH /api/admin/waiting-list/:id", success, 
                        f"Status: {resp.status_code}, Updated: {success}")
            else:
                log_test("PATCH /api/admin/waiting-list/:id", False, "No waiting list items to update")
        except Exception as e:
            log_test("PATCH /api/admin/waiting-list/:id", False, f"Error: {e}")
            
        # Admin reports
        try:
            resp = self.session.get(f"{BASE_URL}/admin/reports", headers=admin_headers)
            data = resp.json()
            required_fields = ['totalRevenue', 'orderCount', 'topProducts']
            success = resp.status_code == 200 and all(field in data for field in required_fields)
            log_test("GET /api/admin/reports", success, 
                    f"Status: {resp.status_code}, Has required fields: {success}")
        except Exception as e:
            log_test("GET /api/admin/reports", False, f"Error: {e}")
            
        # Admin settings get
        try:
            resp = self.session.get(f"{BASE_URL}/admin/settings", headers=admin_headers)
            data = resp.json()
            success = resp.status_code == 200 and 'settings' in data
            log_test("GET /api/admin/settings", success, 
                    f"Status: {resp.status_code}, Has settings: {'settings' in data}")
        except Exception as e:
            log_test("GET /api/admin/settings", False, f"Error: {e}")
            
        # Admin settings update
        try:
            settings_data = {
                "store_name": "Caisy Updated",
                "store_description": "Updated description"
            }
            resp = self.session.put(f"{BASE_URL}/admin/settings", 
                                  json=settings_data, headers=admin_headers)
            data = resp.json()
            success = resp.status_code == 200 and data.get('ok') == True
            log_test("PUT /api/admin/settings", success, 
                    f"Status: {resp.status_code}, Updated: {success}")
        except Exception as e:
            log_test("PUT /api/admin/settings", False, f"Error: {e}")
            
        # Test admin route without admin cookie (should fail)
        try:
            resp = self.session.get(f"{BASE_URL}/admin/stats")  # No admin headers
            success = resp.status_code == 403  # Forbidden
            log_test("GET /api/admin/* without admin auth", success, 
                    f"Status: {resp.status_code} (expected 403)")
        except Exception as e:
            log_test("GET /api/admin/* without admin auth", False, f"Error: {e}")
    
    def test_11_webhook(self):
        """Test webhook signature verification"""
        print("\n=== 11. WEBHOOK (signature verification) ===")
        
        # Test invalid signature
        try:
            webhook_data = {
                "order_id": "CAISY-TEST",
                "status_code": "200",
                "gross_amount": "100000",
                "signature_key": "invalid_signature",
                "transaction_status": "settlement",
                "payment_type": "credit_card"
            }
            resp = self.session.post(f"{BASE_URL}/webhook/midtrans", json=webhook_data)
            success = resp.status_code == 403  # Should fail with invalid signature
            log_test("POST /api/webhook/midtrans (invalid signature)", success, 
                    f"Status: {resp.status_code} (expected 403)")
        except Exception as e:
            log_test("POST /api/webhook/midtrans (invalid signature)", False, f"Error: {e}")
    
    def run_all_tests(self):
        """Run all backend tests in priority order"""
        print("🧪 Starting Caisy Perfume Backend Tests")
        print(f"📍 Base URL: {BASE_URL}")
        print("=" * 60)
        
        start_time = time.time()
        
        # Run tests in priority order
        self.test_1_public_basics()
        self.test_2_auth_flow()
        self.test_3_ai_smart_search()
        self.test_4_cart()
        self.test_5_location_dropdowns()
        self.test_6_shipping_rates()
        self.test_7_orders()
        self.test_8_midtrans_payment()
        self.test_9_waiting_list()
        self.test_10_admin_apis()
        self.test_11_webhook()
        
        end_time = time.time()
        duration = end_time - start_time
        
        print("\n" + "=" * 60)
        print(f"🏁 Backend testing completed in {duration:.2f} seconds")
        print("=" * 60)

if __name__ == "__main__":
    tester = CaisyBackendTester()
    tester.run_all_tests()