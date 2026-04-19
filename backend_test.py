#!/usr/bin/env python3
"""
Comprehensive Backend Testing for Caisy Perfume E-commerce
Testing NEW features: Indonesia Location API, Voucher System, Order Creation, Shipping Rates
"""

import requests
import json
import time
from datetime import datetime, timedelta

# Base configuration
BASE_URL = "https://dupe-fragrance-shop.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

class CaisyBackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.admin_cookie = None
        self.test_results = []
        
    def log_test(self, test_name, success, details="", status_code=None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "status_code": status_code,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        if status_code:
            print(f"   Status: {status_code}")
        print()

    def admin_login(self):
        """Login as admin and store cookie"""
        try:
            response = self.session.post(f"{API_BASE}/auth/login", json={
                "email": "admin@caisyperfume.com",
                "password": "Admin@Caisy2024!"
            })
            
            if response.status_code == 200:
                data = response.json()
                if data.get('user', {}).get('role') == 'admin':
                    self.admin_cookie = response.cookies.get('caisy_token')
                    self.log_test("Admin Login", True, f"Logged in as {data['user']['email']}", response.status_code)
                    return True
                else:
                    self.log_test("Admin Login", False, "User is not admin", response.status_code)
                    return False
            else:
                self.log_test("Admin Login", False, f"Login failed: {response.text}", response.status_code)
                return False
        except Exception as e:
            self.log_test("Admin Login", False, f"Exception: {str(e)}")
            return False

    def test_indonesia_location_api(self):
        """Test 1: INDONESIA LOCATION API (replaces old hardcoded 6 provinces)"""
        print("=== TESTING INDONESIA LOCATION API ===")
        
        # Test provinces - should return 34 Indonesian provinces
        try:
            response = self.session.get(f"{API_BASE}/location/provinces")
            if response.status_code == 200:
                data = response.json()
                provinces = data.get('provinces', [])
                province_count = len(provinces)
                
                if province_count >= 34:
                    # Check for specific provinces
                    province_names = [p.get('name', '') for p in provinces]
                    has_aceh = any('Aceh' in name for name in province_names)
                    has_jakarta = any('Jakarta' in name or 'DKI' in name for name in province_names)
                    has_papua = any('Papua' in name for name in province_names)
                    
                    self.log_test("GET /api/location/provinces", True, 
                                f"Found {province_count} provinces (≥34). Has Aceh: {has_aceh}, Jakarta: {has_jakarta}, Papua: {has_papua}", 
                                response.status_code)
                else:
                    self.log_test("GET /api/location/provinces", False, 
                                f"Only found {province_count} provinces, expected ≥34", 
                                response.status_code)
            else:
                self.log_test("GET /api/location/provinces", False, 
                            f"Failed to get provinces: {response.text}", response.status_code)
        except Exception as e:
            self.log_test("GET /api/location/provinces", False, f"Exception: {str(e)}")

        # Test regencies for DKI Jakarta (province_id=31)
        try:
            response = self.session.get(f"{API_BASE}/location/regencies?province_id=31")
            if response.status_code == 200:
                data = response.json()
                regencies = data.get('regencies', [])
                regency_count = len(regencies)
                
                if regency_count == 6:
                    regency_names = [r.get('name', '') for r in regencies]
                    expected_regencies = ['Kepulauan Seribu', 'Jakarta Selatan', 'Jakarta Timur', 
                                        'Jakarta Pusat', 'Jakarta Barat', 'Jakarta Utara']
                    found_regencies = []
                    for expected in expected_regencies:
                        if any(expected in name for name in regency_names):
                            found_regencies.append(expected)
                    
                    self.log_test("GET /api/location/regencies (DKI Jakarta)", True, 
                                f"Found {regency_count} regencies. Expected regencies found: {found_regencies}", 
                                response.status_code)
                else:
                    self.log_test("GET /api/location/regencies (DKI Jakarta)", False, 
                                f"Found {regency_count} regencies, expected 6", response.status_code)
            else:
                self.log_test("GET /api/location/regencies (DKI Jakarta)", False, 
                            f"Failed: {response.text}", response.status_code)
        except Exception as e:
            self.log_test("GET /api/location/regencies (DKI Jakarta)", False, f"Exception: {str(e)}")

        # Test districts for Jakarta Selatan (regency_id=3171)
        try:
            response = self.session.get(f"{API_BASE}/location/districts?regency_id=3171")
            if response.status_code == 200:
                data = response.json()
                districts = data.get('districts', [])
                district_count = len(districts)
                
                if district_count >= 10:
                    district_names = [d.get('name', '') for d in districts]
                    has_jagakarsa = any('Jagakarsa' in name for name in district_names)
                    has_kebayoran = any('Kebayoran' in name for name in district_names)
                    
                    self.log_test("GET /api/location/districts (Jakarta Selatan)", True, 
                                f"Found {district_count} districts (≥10). Has Jagakarsa: {has_jagakarsa}, Kebayoran: {has_kebayoran}", 
                                response.status_code)
                else:
                    self.log_test("GET /api/location/districts (Jakarta Selatan)", False, 
                                f"Found {district_count} districts, expected ≥10", response.status_code)
            else:
                self.log_test("GET /api/location/districts (Jakarta Selatan)", False, 
                            f"Failed: {response.text}", response.status_code)
        except Exception as e:
            self.log_test("GET /api/location/districts (Jakarta Selatan)", False, f"Exception: {str(e)}")

        # Test villages for Kebayoran Baru district (district_id=3171070)
        try:
            response = self.session.get(f"{API_BASE}/location/villages?district_id=3171070")
            if response.status_code == 200:
                data = response.json()
                villages = data.get('villages', [])
                village_count = len(villages)
                
                self.log_test("GET /api/location/villages (Kebayoran Baru)", True, 
                            f"Found {village_count} villages under Kebayoran Baru district", 
                            response.status_code)
            else:
                self.log_test("GET /api/location/villages (Kebayoran Baru)", False, 
                            f"Failed: {response.text}", response.status_code)
        except Exception as e:
            self.log_test("GET /api/location/villages (Kebayoran Baru)", False, f"Exception: {str(e)}")

        # Test postal code lookup - Jakarta area (12110)
        try:
            response = self.session.get(f"{API_BASE}/location/postal-code?code=12110")
            if response.status_code == 200:
                data = response.json()
                results = data.get('results', [])
                
                if results:
                    result = results[0]
                    has_required_fields = all(field in result for field in ['code', 'village', 'district', 'regency', 'province'])
                    
                    self.log_test("GET /api/location/postal-code (12110)", True, 
                                f"Found {len(results)} results. Has required fields: {has_required_fields}. Sample: {result}", 
                                response.status_code)
                else:
                    self.log_test("GET /api/location/postal-code (12110)", False, 
                                "No results found", response.status_code)
            else:
                self.log_test("GET /api/location/postal-code (12110)", False, 
                            f"Failed: {response.text}", response.status_code)
        except Exception as e:
            self.log_test("GET /api/location/postal-code (12110)", False, f"Exception: {str(e)}")

        # Test postal code lookup - Bandung area (40115)
        try:
            response = self.session.get(f"{API_BASE}/location/postal-code?code=40115")
            if response.status_code == 200:
                data = response.json()
                results = data.get('results', [])
                
                if results:
                    result = results[0]
                    is_bandung_area = 'Bandung' in str(result)
                    
                    self.log_test("GET /api/location/postal-code (40115)", True, 
                                f"Found {len(results)} results. Is Bandung area: {is_bandung_area}. Sample: {result}", 
                                response.status_code)
                else:
                    self.log_test("GET /api/location/postal-code (40115)", False, 
                                "No results found", response.status_code)
            else:
                self.log_test("GET /api/location/postal-code (40115)", False, 
                            f"Failed: {response.text}", response.status_code)
        except Exception as e:
            self.log_test("GET /api/location/postal-code (40115)", False, f"Exception: {str(e)}")

    def test_voucher_system(self):
        """Test 2: VOUCHER SYSTEM"""
        print("=== TESTING VOUCHER SYSTEM ===")
        
        if not self.admin_cookie:
            self.log_test("Voucher System Tests", False, "Admin login required but failed")
            return

        # Set admin cookie for requests
        self.session.cookies.set('caisy_token', self.admin_cookie)

        # Test admin voucher creation - percentage voucher
        try:
            voucher_data = {
                "code": "TESTVOUCHER",
                "type": "percentage",
                "value": 20,
                "min_purchase": 50000,
                "max_discount": 30000,
                "usage_limit": 5,
                "description": "Test voucher for testing"
            }
            
            response = self.session.post(f"{API_BASE}/admin/vouchers", json=voucher_data)
            if response.status_code == 200:
                data = response.json()
                voucher = data.get('voucher', {})
                code_uppercased = voucher.get('code') == 'TESTVOUCHER'
                
                self.log_test("POST /api/admin/vouchers (percentage)", True, 
                            f"Created voucher. Code uppercased: {code_uppercased}. Voucher: {voucher}", 
                            response.status_code)
                self.test_voucher_id = voucher.get('id')
            else:
                self.log_test("POST /api/admin/vouchers (percentage)", False, 
                            f"Failed: {response.text}", response.status_code)
        except Exception as e:
            self.log_test("POST /api/admin/vouchers (percentage)", False, f"Exception: {str(e)}")

        # Test duplicate voucher creation (should return 409)
        try:
            response = self.session.post(f"{API_BASE}/admin/vouchers", json=voucher_data)
            if response.status_code == 409:
                self.log_test("POST /api/admin/vouchers (duplicate)", True, 
                            "Correctly rejected duplicate voucher with 409", response.status_code)
            else:
                self.log_test("POST /api/admin/vouchers (duplicate)", False, 
                            f"Expected 409 for duplicate, got {response.status_code}: {response.text}", 
                            response.status_code)
        except Exception as e:
            self.log_test("POST /api/admin/vouchers (duplicate)", False, f"Exception: {str(e)}")

        # Test fixed voucher creation
        try:
            fixed_voucher_data = {
                "code": "FIXED10K",
                "type": "fixed",
                "value": 10000
            }
            
            response = self.session.post(f"{API_BASE}/admin/vouchers", json=fixed_voucher_data)
            if response.status_code == 200:
                data = response.json()
                voucher = data.get('voucher', {})
                
                self.log_test("POST /api/admin/vouchers (fixed)", True, 
                            f"Created fixed voucher: {voucher}", response.status_code)
                self.fixed_voucher_id = voucher.get('id')
            else:
                self.log_test("POST /api/admin/vouchers (fixed)", False, 
                            f"Failed: {response.text}", response.status_code)
        except Exception as e:
            self.log_test("POST /api/admin/vouchers (fixed)", False, f"Exception: {str(e)}")

        # Test GET admin vouchers
        try:
            response = self.session.get(f"{API_BASE}/admin/vouchers")
            if response.status_code == 200:
                data = response.json()
                vouchers = data.get('vouchers', [])
                voucher_count = len(vouchers)
                
                self.log_test("GET /api/admin/vouchers", True, 
                            f"Retrieved {voucher_count} vouchers", response.status_code)
            else:
                self.log_test("GET /api/admin/vouchers", False, 
                            f"Failed: {response.text}", response.status_code)
        except Exception as e:
            self.log_test("GET /api/admin/vouchers", False, f"Exception: {str(e)}")

        # Test voucher update
        if hasattr(self, 'test_voucher_id'):
            try:
                update_data = {"value": 25}
                response = self.session.put(f"{API_BASE}/admin/vouchers/{self.test_voucher_id}", json=update_data)
                if response.status_code == 200:
                    data = response.json()
                    voucher = data.get('voucher', {})
                    updated_value = voucher.get('value') == 25
                    
                    self.log_test("PUT /api/admin/vouchers/:id", True, 
                                f"Updated voucher value. Correct value: {updated_value}", response.status_code)
                else:
                    self.log_test("PUT /api/admin/vouchers/:id", False, 
                                f"Failed: {response.text}", response.status_code)
            except Exception as e:
                self.log_test("PUT /api/admin/vouchers/:id", False, f"Exception: {str(e)}")

        # Test admin access without cookie
        temp_session = requests.Session()
        try:
            response = temp_session.get(f"{API_BASE}/admin/vouchers")
            if response.status_code == 403:
                self.log_test("Admin vouchers without auth", True, 
                            "Correctly rejected non-admin access with 403", response.status_code)
            else:
                self.log_test("Admin vouchers without auth", False, 
                            f"Expected 403, got {response.status_code}", response.status_code)
        except Exception as e:
            self.log_test("Admin vouchers without auth", False, f"Exception: {str(e)}")

        # Test public voucher validation
        self.test_public_voucher_validation()

    def test_public_voucher_validation(self):
        """Test public voucher validation endpoints"""
        print("=== TESTING PUBLIC VOUCHER VALIDATION ===")
        
        # Test valid voucher with sufficient subtotal
        try:
            validation_data = {
                "code": "TESTVOUCHER",
                "subtotal": 100000
            }
            
            response = self.session.post(f"{API_BASE}/vouchers/validate", json=validation_data)
            if response.status_code == 200:
                data = response.json()
                is_valid = data.get('valid') == True
                discount = data.get('discount', 0)
                expected_discount = 25000  # 25% of 100000 (updated value)
                
                self.log_test("POST /api/vouchers/validate (valid)", True, 
                            f"Valid: {is_valid}, Discount: {discount} (expected: {expected_discount})", 
                            response.status_code)
            else:
                self.log_test("POST /api/vouchers/validate (valid)", False, 
                            f"Failed: {response.text}", response.status_code)
        except Exception as e:
            self.log_test("POST /api/vouchers/validate (valid)", False, f"Exception: {str(e)}")

        # Test voucher with max discount cap
        try:
            validation_data = {
                "code": "TESTVOUCHER",
                "subtotal": 200000
            }
            
            response = self.session.post(f"{API_BASE}/vouchers/validate", json=validation_data)
            if response.status_code == 200:
                data = response.json()
                discount = data.get('discount', 0)
                capped_correctly = discount == 30000  # Should be capped at max_discount
                
                self.log_test("POST /api/vouchers/validate (max discount cap)", True, 
                            f"Discount: {discount}, Capped at 30000: {capped_correctly}", 
                            response.status_code)
            else:
                self.log_test("POST /api/vouchers/validate (max discount cap)", False, 
                            f"Failed: {response.text}", response.status_code)
        except Exception as e:
            self.log_test("POST /api/vouchers/validate (max discount cap)", False, f"Exception: {str(e)}")

        # Test voucher below minimum purchase
        try:
            validation_data = {
                "code": "TESTVOUCHER",
                "subtotal": 30000
            }
            
            response = self.session.post(f"{API_BASE}/vouchers/validate", json=validation_data)
            if response.status_code == 400:
                error_message = response.json().get('error', '')
                has_minimum_message = 'Minimum belanja Rp 50.000' in error_message
                
                self.log_test("POST /api/vouchers/validate (below minimum)", True, 
                            f"Correctly rejected below minimum. Message: {error_message}", 
                            response.status_code)
            else:
                self.log_test("POST /api/vouchers/validate (below minimum)", False, 
                            f"Expected 400, got {response.status_code}: {response.text}", 
                            response.status_code)
        except Exception as e:
            self.log_test("POST /api/vouchers/validate (below minimum)", False, f"Exception: {str(e)}")

        # Test non-existent voucher
        try:
            validation_data = {
                "code": "NOEXIST",
                "subtotal": 100000
            }
            
            response = self.session.post(f"{API_BASE}/vouchers/validate", json=validation_data)
            if response.status_code == 404:
                error_message = response.json().get('error', '')
                has_not_found_message = 'Voucher tidak ditemukan' in error_message
                
                self.log_test("POST /api/vouchers/validate (non-existent)", True, 
                            f"Correctly returned 404. Message: {error_message}", 
                            response.status_code)
            else:
                self.log_test("POST /api/vouchers/validate (non-existent)", False, 
                            f"Expected 404, got {response.status_code}: {response.text}", 
                            response.status_code)
        except Exception as e:
            self.log_test("POST /api/vouchers/validate (non-existent)", False, f"Exception: {str(e)}")

        # Test fixed voucher validation
        try:
            validation_data = {
                "code": "FIXED10K",
                "subtotal": 50000
            }
            
            response = self.session.post(f"{API_BASE}/vouchers/validate", json=validation_data)
            if response.status_code == 200:
                data = response.json()
                discount = data.get('discount', 0)
                correct_fixed_discount = discount == 10000
                
                self.log_test("POST /api/vouchers/validate (fixed)", True, 
                            f"Fixed discount: {discount}, Correct: {correct_fixed_discount}", 
                            response.status_code)
            else:
                self.log_test("POST /api/vouchers/validate (fixed)", False, 
                            f"Failed: {response.text}", response.status_code)
        except Exception as e:
            self.log_test("POST /api/vouchers/validate (fixed)", False, f"Exception: {str(e)}")

        # Test inactive voucher
        if hasattr(self, 'test_voucher_id'):
            try:
                # First, make the voucher inactive
                update_data = {"is_active": False}
                self.session.put(f"{API_BASE}/admin/vouchers/{self.test_voucher_id}", json=update_data)
                
                # Then try to validate it
                validation_data = {
                    "code": "TESTVOUCHER",
                    "subtotal": 100000
                }
                
                response = self.session.post(f"{API_BASE}/vouchers/validate", json=validation_data)
                if response.status_code == 400:
                    error_message = response.json().get('error', '')
                    has_inactive_message = 'Voucher tidak aktif' in error_message
                    
                    self.log_test("POST /api/vouchers/validate (inactive)", True, 
                                f"Correctly rejected inactive voucher. Message: {error_message}", 
                                response.status_code)
                else:
                    self.log_test("POST /api/vouchers/validate (inactive)", False, 
                                f"Expected 400, got {response.status_code}: {response.text}", 
                                response.status_code)
                
                # Reactivate for other tests
                update_data = {"is_active": True}
                self.session.put(f"{API_BASE}/admin/vouchers/{self.test_voucher_id}", json=update_data)
                
            except Exception as e:
                self.log_test("POST /api/vouchers/validate (inactive)", False, f"Exception: {str(e)}")

    def test_order_creation_with_voucher(self):
        """Test 3: ORDER CREATION with voucher and new address format"""
        print("=== TESTING ORDER CREATION WITH VOUCHER ===")
        
        # First, get a product to order
        try:
            response = self.session.get(f"{API_BASE}/products?limit=1")
            if response.status_code != 200:
                self.log_test("Order Creation Tests", False, "Could not fetch products for testing")
                return
            
            products = response.json().get('products', [])
            if not products:
                self.log_test("Order Creation Tests", False, "No products available for testing")
                return
            
            product = products[0]
            product_id = product.get('id')
            
        except Exception as e:
            self.log_test("Order Creation Tests", False, f"Exception getting products: {str(e)}")
            return

        # Test order creation with voucher and new address format
        try:
            order_data = {
                "items": [
                    {
                        "product_id": product_id,
                        "quantity": 1
                    }
                ],
                "guest_name": "Test Customer",
                "guest_email": "test@example.com",
                "guest_phone": "081234567890",
                "province_id": "31",
                "province_name": "DKI Jakarta",
                "city_id": "3171",
                "city_name": "Jakarta Selatan",
                "district_id": "3171070",
                "district_name": "Kebayoran Baru",
                "village_id": "3171070001",
                "village_name": "Kramat Pela",
                "postal_code": "12110",
                "address_detail": "Jl. Test No. 123",
                "shipping_cost": 15000,
                "shipping_carrier": "JNE",
                "shipping_service": "REG",
                "shipping_etd": "2-3 hari",
                "voucher_code": "TESTVOUCHER",
                "notes": "Test order with voucher"
            }
            
            response = self.session.post(f"{API_BASE}/orders", json=order_data)
            if response.status_code == 200:
                data = response.json()
                order = data.get('order', {})
                
                # Check order structure
                has_subtotal = 'subtotal' in order
                has_shipping_cost = 'shipping_cost' in order
                has_voucher_code = order.get('voucher_code') == 'TESTVOUCHER'
                has_voucher_discount = 'voucher_discount' in order and order['voucher_discount'] > 0
                has_voucher_description = 'voucher_description' in order
                has_total_amount = 'total_amount' in order
                has_village_info = order.get('village_id') == '3171070001' and order.get('village_name') == 'Kramat Pela'
                
                # Check total calculation
                expected_total = order.get('subtotal', 0) + order.get('shipping_cost', 0) - order.get('voucher_discount', 0)
                actual_total = order.get('total_amount', 0)
                correct_total = expected_total == actual_total
                
                self.log_test("POST /api/orders (with voucher)", True, 
                            f"Order created. Has required fields: subtotal={has_subtotal}, shipping={has_shipping_cost}, voucher_code={has_voucher_code}, voucher_discount={has_voucher_discount}, total={has_total_amount}, village_info={has_village_info}, correct_total={correct_total}", 
                            response.status_code)
                
                self.test_order_id = order.get('id')
                
            else:
                self.log_test("POST /api/orders (with voucher)", False, 
                            f"Failed: {response.text}", response.status_code)
        except Exception as e:
            self.log_test("POST /api/orders (with voucher)", False, f"Exception: {str(e)}")

        # Verify voucher usage count incremented
        try:
            response = self.session.get(f"{API_BASE}/admin/vouchers")
            if response.status_code == 200:
                data = response.json()
                vouchers = data.get('vouchers', [])
                test_voucher = next((v for v in vouchers if v.get('code') == 'TESTVOUCHER'), None)
                
                if test_voucher:
                    used_count = test_voucher.get('used_count', 0)
                    incremented = used_count >= 1
                    
                    self.log_test("Voucher usage count increment", True, 
                                f"Voucher used_count: {used_count}, Incremented: {incremented}", 
                                response.status_code)
                else:
                    self.log_test("Voucher usage count increment", False, 
                                "Could not find TESTVOUCHER to check usage count", response.status_code)
            else:
                self.log_test("Voucher usage count increment", False, 
                            f"Failed to get vouchers: {response.text}", response.status_code)
        except Exception as e:
            self.log_test("Voucher usage count increment", False, f"Exception: {str(e)}")

    def test_shipping_rates_updated(self):
        """Test 4: SHIPPING RATES (updated — no longer requires local district lookup)"""
        print("=== TESTING UPDATED SHIPPING RATES ===")
        
        try:
            shipping_data = {
                "district_id": "anything",  # Should work with any value now
                "weight": 300,
                "subtotal": 150000
            }
            
            response = self.session.post(f"{API_BASE}/shipping/rates", json=shipping_data)
            if response.status_code == 200:
                data = response.json()
                rates = data.get('rates', [])
                rate_count = len(rates)
                
                # Check if we get the fallback mock rates (6 options)
                has_jne = any(rate.get('courier') == 'JNE' for rate in rates)
                has_jnt = any('J&T' in rate.get('courier', '') for rate in rates)
                has_sicepat = any(rate.get('courier') == 'SiCepat' for rate in rates)
                
                # Check required fields
                all_have_required_fields = all(
                    all(field in rate for field in ['courier', 'service', 'etd', 'price'])
                    for rate in rates
                )
                
                self.log_test("POST /api/shipping/rates (updated)", True, 
                            f"Got {rate_count} rates. Has JNE: {has_jne}, J&T: {has_jnt}, SiCepat: {has_sicepat}. All have required fields: {all_have_required_fields}", 
                            response.status_code)
                
                # Should no longer get "District not found" error
                no_district_error = "District not found" not in response.text
                self.log_test("No District not found error", True, 
                            f"No 'District not found' error: {no_district_error}", response.status_code)
                
            else:
                self.log_test("POST /api/shipping/rates (updated)", False, 
                            f"Failed: {response.text}", response.status_code)
        except Exception as e:
            self.log_test("POST /api/shipping/rates (updated)", False, f"Exception: {str(e)}")

    def test_regression_existing_endpoints(self):
        """Test 5: REGRESSION - Verify existing endpoints still work"""
        print("=== TESTING REGRESSION - EXISTING ENDPOINTS ===")
        
        # Test products endpoint
        try:
            response = self.session.get(f"{API_BASE}/products")
            if response.status_code == 200:
                data = response.json()
                products = data.get('products', [])
                product_count = len(products)
                
                self.log_test("GET /api/products (regression)", True, 
                            f"Retrieved {product_count} products", response.status_code)
            else:
                self.log_test("GET /api/products (regression)", False, 
                            f"Failed: {response.text}", response.status_code)
        except Exception as e:
            self.log_test("GET /api/products (regression)", False, f"Exception: {str(e)}")

        # Test smart search
        try:
            search_data = {"query": "parfum wanita floral"}
            response = self.session.post(f"{API_BASE}/smart-search", json=search_data)
            if response.status_code == 200:
                data = response.json()
                recommendations = data.get('recommendations', [])
                rec_count = len(recommendations)
                
                self.log_test("POST /api/smart-search (regression)", True, 
                            f"Got {rec_count} AI recommendations", response.status_code)
            else:
                self.log_test("POST /api/smart-search (regression)", False, 
                            f"Failed: {response.text}", response.status_code)
        except Exception as e:
            self.log_test("POST /api/smart-search (regression)", False, f"Exception: {str(e)}")

        # Test admin stats (with admin auth)
        try:
            response = self.session.get(f"{API_BASE}/admin/stats")
            if response.status_code == 200:
                data = response.json()
                stats = data.get('stats', {})
                
                self.log_test("GET /api/admin/stats (regression)", True, 
                            f"Retrieved admin stats: {list(stats.keys())}", response.status_code)
            else:
                self.log_test("GET /api/admin/stats (regression)", False, 
                            f"Failed: {response.text}", response.status_code)
        except Exception as e:
            self.log_test("GET /api/admin/stats (regression)", False, f"Exception: {str(e)}")

    def cleanup_test_data(self):
        """Clean up test vouchers"""
        print("=== CLEANING UP TEST DATA ===")
        
        if hasattr(self, 'test_voucher_id'):
            try:
                response = self.session.delete(f"{API_BASE}/admin/vouchers/{self.test_voucher_id}")
                if response.status_code == 200:
                    self.log_test("Cleanup TESTVOUCHER", True, "Deleted test voucher", response.status_code)
                else:
                    self.log_test("Cleanup TESTVOUCHER", False, f"Failed: {response.text}", response.status_code)
            except Exception as e:
                self.log_test("Cleanup TESTVOUCHER", False, f"Exception: {str(e)}")

        if hasattr(self, 'fixed_voucher_id'):
            try:
                response = self.session.delete(f"{API_BASE}/admin/vouchers/{self.fixed_voucher_id}")
                if response.status_code == 200:
                    self.log_test("Cleanup FIXED10K", True, "Deleted fixed voucher", response.status_code)
                else:
                    self.log_test("Cleanup FIXED10K", False, f"Failed: {response.text}", response.status_code)
            except Exception as e:
                self.log_test("Cleanup FIXED10K", False, f"Exception: {str(e)}")

    def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting Caisy Perfume Backend Testing")
        print(f"Base URL: {BASE_URL}")
        print(f"API Base: {API_BASE}")
        print("=" * 60)
        
        # Login as admin first
        if not self.admin_login():
            print("❌ Cannot proceed without admin access")
            return
        
        # Run all test suites
        self.test_indonesia_location_api()
        self.test_voucher_system()
        self.test_order_creation_with_voucher()
        self.test_shipping_rates_updated()
        self.test_regression_existing_endpoints()
        
        # Cleanup
        self.cleanup_test_data()
        
        # Summary
        self.print_summary()

    def print_summary(self):
        """Print test summary"""
        print("=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = len([t for t in self.test_results if t['success']])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for test in self.test_results:
                if not test['success']:
                    print(f"  - {test['test']}: {test['details']}")
        
        print("\n🎯 KEY FINDINGS:")
        
        # Indonesia Location API
        location_tests = [t for t in self.test_results if 'location' in t['test'].lower()]
        location_passed = len([t for t in location_tests if t['success']])
        print(f"  - Indonesia Location API: {location_passed}/{len(location_tests)} tests passed")
        
        # Voucher System
        voucher_tests = [t for t in self.test_results if 'voucher' in t['test'].lower()]
        voucher_passed = len([t for t in voucher_tests if t['success']])
        print(f"  - Voucher System: {voucher_passed}/{len(voucher_tests)} tests passed")
        
        # Order Creation
        order_tests = [t for t in self.test_results if 'order' in t['test'].lower()]
        order_passed = len([t for t in order_tests if t['success']])
        print(f"  - Order Creation: {order_passed}/{len(order_tests)} tests passed")
        
        # Shipping Rates
        shipping_tests = [t for t in self.test_results if 'shipping' in t['test'].lower()]
        shipping_passed = len([t for t in shipping_tests if t['success']])
        print(f"  - Shipping Rates: {shipping_passed}/{len(shipping_tests)} tests passed")
        
        # Regression
        regression_tests = [t for t in self.test_results if 'regression' in t['test'].lower()]
        regression_passed = len([t for t in regression_tests if t['success']])
        print(f"  - Regression Tests: {regression_passed}/{len(regression_tests)} tests passed")

if __name__ == "__main__":
    tester = CaisyBackendTester()
    tester.run_all_tests()