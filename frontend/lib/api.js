const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export async function fetchFromAPI(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `API error ${res.status}: ${res.statusText}`);
    }
    if (res.status === 204) {
      return { success: true };
    }
    return await res.json();
  } catch (error) {
    console.warn(`API call error ${endpoint}:`, error.message);
    return { error: error.message };
  }
}

// Authentication Endpoints
export async function loginUser(payload) {
  return await fetchFromAPI('/login/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function registerUser(payload) {
  return await fetchFromAPI('/register/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function sendContactAdmin(payload) {
  return await fetchFromAPI('/contact-admin/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getContactRequests() {
  return await fetchFromAPI('/contact-admin/');
}

// Product Endpoints
export async function getProducts(params = {}) {
  const query = new URLSearchParams(params).toString();
  return await fetchFromAPI(`/products/${query ? `?${query}` : ''}`);
}

export async function createProduct(payload) {
  return await fetchFromAPI('/products/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateProduct(id, payload) {
  return await fetchFromAPI(`/products/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteProduct(id) {
  return await fetchFromAPI(`/products/${id}/`, {
    method: 'DELETE',
  });
}

// Category Endpoints
export async function getCategories() {
  return await fetchFromAPI('/categories/');
}

export async function createCategory(payload) {
  return await fetchFromAPI('/categories/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateCategory(id, payload) {
  return await fetchFromAPI(`/categories/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteCategory(id) {
  return await fetchFromAPI(`/categories/${id}/`, {
    method: 'DELETE',
  });
}

// Supplier Endpoints
export async function getSuppliers() {
  return await fetchFromAPI('/suppliers/');
}

export async function createSupplier(payload) {
  return await fetchFromAPI('/suppliers/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateSupplier(id, payload) {
  return await fetchFromAPI(`/suppliers/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteSupplier(id) {
  return await fetchFromAPI(`/suppliers/${id}/`, {
    method: 'DELETE',
  });
}

// User Endpoints
export async function getUsers() {
  return await fetchFromAPI('/users/');
}

export async function createUser(payload) {
  return await fetchFromAPI('/users/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateUser(id, payload) {
  return await fetchFromAPI(`/users/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteUser(id) {
  return await fetchFromAPI(`/users/${id}/`, {
    method: 'DELETE',
  });
}

// Stock Movement Endpoints
export async function getMovements() {
  return await fetchFromAPI('/movements/');
}

export async function recordStockIn(payload) {
  return await fetchFromAPI('/stock-in/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function recordStockOut(payload) {
  return await fetchFromAPI('/stock-out/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// Branch Transfers & Supplier Returns Endpoints
export async function getTransfers() {
  return await fetchFromAPI('/transfers/');
}

export async function approveTransferReturn(id, payload) {
  return await fetchFromAPI(`/transfers/${id}/approve_return/`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// Reports & Valuation Endpoints
export async function getReports() {
  return await fetchFromAPI('/reports/');
}
