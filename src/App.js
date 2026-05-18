import React, { useEffect, useState } from "react";
import "./index.css";

const API =
  process.env.REACT_APP_API_URL ||
  "https://smartcart-ai-production.up.railway.app";

function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [activePage, setActivePage] = useState("home");
  const [accountTab, setAccountTab] = useState("");

  const [user, setUser] = useState(null);
  const [loginMode, setLoginMode] = useState("login");

  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({ name: "", email: "", password: "" });

  const [checkoutData, setCheckoutData] = useState({
    address: "",
    phone: "",
    payment: "Cash on Delivery",
    savedAddressId: "",
  });

  const [editProfileData, setEditProfileData] = useState({ name: "", email: "" });

  const [passwordData, setPasswordData] = useState({
    old_password: "",
    new_password: "",
  });

  const [addresses, setAddresses] = useState([]);

  const [addressForm, setAddressForm] = useState({
    full_name: "",
    phone: "",
    address_line: "",
    city: "",
    state: "",
    pincode: "",
  });

  useEffect(() => {
    loadProducts();
    loadCart();
    loadWishlist();

    const savedUser = localStorage.getItem("smartcart_user");
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      loadAddresses(parsedUser.id);
    }
  }, []);

  const loadProducts = async () => {
    try {
      const res = await fetch(`${API}/products`);
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      alert("Products load nahi ho rahe. Backend check karo.");
    }
  };

  const loadCart = async () => {
    try {
      const res = await fetch(`${API}/cart/1`);
      const data = await res.json();
      setCart(Array.isArray(data) ? data : []);
    } catch {
      setCart([]);
    }
  };

  const loadWishlist = async () => {
    try {
      const res = await fetch(`${API}/wishlist/1`);
      const data = await res.json();
      setWishlist(Array.isArray(data) ? data : []);
    } catch {
      setWishlist([]);
    }
  };

  const loadOrders = async () => {
    try {
      const res = await fetch(`${API}/orders/1`);
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      setOrders([]);
    }
  };

  const loadAddresses = async (userId) => {
    if (!userId) return;
    try {
      const res = await fetch(`${API}/addresses/${userId}`);
      const data = await res.json();
      setAddresses(Array.isArray(data) ? data : []);
    } catch {
      setAddresses([]);
    }
  };

  const handleSignup = async () => {
    try {
      const res = await fetch(`${API}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signupData),
      });

      const data = await res.json();
      alert(data.message || "Signup done");
      if (res.ok) setLoginMode("login");
    } catch {
      alert("Signup failed");
    }
  };

  const handleLogin = async () => {
    try {
      const res = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Invalid login");
        return;
      }

      setUser(data.user);
      localStorage.setItem("smartcart_user", JSON.stringify(data.user));
      await loadAddresses(data.user.id);
      alert("Login successful ✅");
      setActivePage("account");
    } catch {
      alert("Login failed");
    }
  };

  const logout = () => {
    localStorage.removeItem("smartcart_user");
    setUser(null);
    setAddresses([]);
    setAccountTab("");
    setActivePage("home");
    alert("Logout successful");
  };

  const updateProfile = async () => {
    if (!user) return;

    try {
      const res = await fetch(`${API}/update-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          name: editProfileData.name || user.name,
          email: editProfileData.email || user.email,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Profile update failed");
        return;
      }

      setUser(data.user);
      localStorage.setItem("smartcart_user", JSON.stringify(data.user));
      alert(data.message || "Profile updated");
    } catch {
      alert("Profile update error");
    }
  };

  const changePassword = async () => {
    if (!user) return;

    try {
      const res = await fetch(`${API}/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          old_password: passwordData.old_password,
          new_password: passwordData.new_password,
        }),
      });

      const data = await res.json();
      alert(data.message || "Password updated");

      if (res.ok) {
        setPasswordData({ old_password: "", new_password: "" });
      }
    } catch {
      alert("Password change error");
    }
  };

  const saveAddress = async () => {
    if (!user) return;

    try {
      const res = await fetch(`${API}/add-address`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, ...addressForm }),
      });

      const data = await res.json();
      alert(data.message || "Address saved");

      if (res.ok) {
        setAddressForm({
          full_name: "",
          phone: "",
          address_line: "",
          city: "",
          state: "",
          pincode: "",
        });
        await loadAddresses(user.id);
      }
    } catch {
      alert("Address save error");
    }
  };

  const addToCart = async (product) => {
    try {
      const res = await fetch(`${API}/add-to-cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: 1, product_id: product.id }),
      });

      const data = await res.json();
      alert(data.message || "Added to cart");
      await loadCart();
      setActivePage("cart");
    } catch {
      alert("Backend connection error");
    }
  };

  const addToWishlist = async (product) => {
    try {
      const res = await fetch(`${API}/add-to-wishlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: 1, product_id: product.id }),
      });

      const data = await res.json();
      alert(data.message || "Wishlist updated");
      await loadWishlist();
    } catch {
      alert("Backend connection error");
    }
  };

  const removeFromCart = async (productId) => {
    try {
      await fetch(`${API}/remove-cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: 1, product_id: productId }),
      });
      await loadCart();
    } catch {
      alert("Remove failed");
    }
  };

  const proceedToCheckout = async () => {
    if (!user) {
      alert("Please login first to continue checkout");
      setActivePage("account");
      return;
    }

    await loadAddresses(user.id);
    setActivePage("checkout");
  };

  const confirmOrder = async () => {
    if (!checkoutData.address || !checkoutData.phone) {
      alert("Address and phone number required");
      return;
    }

    try {
      const res = await fetch(`${API}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: 1,
          address: checkoutData.address,
          phone: checkoutData.phone,
          payment_method: checkoutData.payment,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Checkout failed");
        return;
      }

      alert(data.message || "Order placed successfully");
      await loadCart();
      await loadOrders();
      setActivePage("orders");
    } catch {
      alert("Checkout error");
    }
  };

  const openOrders = async () => {
    if (!user) {
      alert("Please login first");
      setActivePage("account");
      return;
    }
    await loadOrders();
    setActivePage("orders");
  };

  const filteredProducts = products.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  );

  const cartTotal = cart.reduce((total, item) => {
    return total + Number(item.price || 0) * Number(item.quantity || 1);
  }, 0);

  return (
    <div className="app">
      <header className="top-navbar">
     <div className="logo" onClick={() => setActivePage("home")}>
  <img src="/logo.png" alt="SmartCart AI" className="brand-logo" />
  <span className="brand-text">SmartCart AI</span>
</div>

        <input
          className="search-box"
          type="text"
          placeholder="Search for products, brands and more"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setActivePage("home");
          }}
        />

        <div className="nav-links">
          <span onClick={() => setActivePage("home")}>Home</span>
          <span onClick={openOrders}>Orders</span>
          <span onClick={() => setActivePage("wishlist")}>
            Wishlist: {wishlist.length}
          </span>
          <span onClick={() => setActivePage("cart")}>Cart: {cart.length}</span>
          <span onClick={() => setActivePage("account")}>
            {user ? `Hi, ${user.name}` : "Account"}
          </span>
        </div>
      </header>

      {activePage === "home" && (
        <>
          <section className="hero">
            <div>
              <h1>Big Shopping Days</h1>
              <p>SmartCart AI - Fast, Smart & Simple Shopping</p>
              <button onClick={() => setActivePage("home")}>Shop Now</button>
            </div>
          </section>

          <section className="quick-menu">
            <div onClick={() => setSearch("mobile")}>📱 Mobiles</div>
            <div onClick={() => setSearch("laptop")}>💻 Laptops</div>
            <div onClick={() => setSearch("headphones")}>🎧 Headphones</div>
            <div onClick={() => setSearch("watch")}>⌚ Watches</div>
            <div onClick={() => setSearch("fashion")}>👕 Fashion</div>
            <div onClick={() => setSearch("")}>🏠 All</div>
          </section>

          <section className="products-section">
            <h2>Top Deals For You</h2>

            <div className="product-grid">
              {filteredProducts.map((product) => (
                <div className="product-card" key={product.id}>
                  <button
                    className="wishlist-btn"
                    onClick={() => addToWishlist(product)}
                  >
                    ♡
                  </button>

                  <img src={`${API}/images/${product.image}`} alt={product.name} />

                  <h3>{product.name}</h3>
                  <p className="category">{product.category}</p>
                  <h2 className="price">₹{product.price}</h2>
                  <div className="rating">★★★★☆ 4.2</div>

                  <button className="cart-btn" onClick={() => addToCart(product)}>
                    Add to Cart
                  </button>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {activePage === "cart" && (
        <section className="page-section">
          <h1>🛒 My Cart</h1>

          {cart.length === 0 ? (
            <div className="empty-box">
              <h2>Your cart is empty</h2>
              <button onClick={() => setActivePage("home")}>Continue Shopping</button>
            </div>
          ) : (
            <div className="cart-layout">
              <div className="cart-list">
                {cart.map((item) => (
                  <div className="cart-product" key={item.id}>
                    <img src={`${API}/images/${item.image}`} alt={item.name} />

                    <div>
                      <h3>{item.name}</h3>
                      <p>{item.category}</p>
                      <h2>₹{item.price}</h2>
                      <p>Quantity: {item.quantity}</p>

                      <button onClick={() => addToCart(item)}>+ Add More</button>
                      <button onClick={() => removeFromCart(item.id)}>Remove</button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="price-card">
                <h2>Price Details</h2>
                <p>Total Items: {cart.length}</p>
                <h2>Total Amount: ₹{cartTotal.toFixed(2)}</h2>
                <button onClick={proceedToCheckout}>Proceed to Buy</button>
              </div>
            </div>
          )}
        </section>
      )}

      {activePage === "wishlist" && (
        <section className="page-section">
          <h1>❤️ My Wishlist</h1>

          {wishlist.length === 0 ? (
            <div className="empty-box">
              <h2>Your wishlist is empty</h2>
              <button onClick={() => setActivePage("home")}>Explore Products</button>
            </div>
          ) : (
            <div className="product-grid">
              {wishlist.map((product) => (
                <div className="product-card" key={product.id}>
                  <img src={`${API}/images/${product.image}`} alt={product.name} />

                  <h3>{product.name}</h3>
                  <p className="category">{product.category}</p>
                  <h2 className="price">₹{product.price}</h2>

                  <button className="cart-btn" onClick={() => addToCart(product)}>
                    Move to Cart
                  </button>

                  <button className="remove-btn" onClick={() => addToWishlist(product)}>
                    Remove Wishlist
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {activePage === "account" && (
        <section className="page-section">
          <h1>👤 Your Account</h1>

          {user ? (
            <>
              <div className="account-hero">
                <div>
                  <h2>Hello, {user.name}</h2>
                  <p>Manage your profile, orders, security and saved delivery details.</p>
                </div>
                <button onClick={logout}>Logout</button>
              </div>

              {!accountTab && (
  <div className="account-dashboard account-menu-grid">
                <div className="account-box account-menu-card" onClick={() => setAccountTab("profile")}>
                  <h2>👤 My Profile</h2>
                  <p>View and update your name and email.</p>
                </div>
              

                <div className="account-box account-menu-card" onClick={() => setAccountTab("security")}>
                  <h2>🔐 Login & Security</h2>
                  <p>Change password and manage security.</p>
                </div>

                <div className="account-box account-menu-card" onClick={() => setAccountTab("addresses")}>
                  <h2>📍 Saved Addresses</h2>
                  <p>Add and manage delivery addresses.</p>
                </div>

                <div className="account-box account-menu-card" onClick={openOrders}>
                  <h2>📦 My Orders</h2>
                  <p>Track orders and delivery status.</p>
                </div>

                <div className="account-box account-menu-card" onClick={openOrders}>
                  <h2>🔁 Buy Again</h2>
                  <p>Reorder your previously purchased products.</p>
                </div>

                <div className="account-box account-menu-card logout-box" onClick={logout}>
                  <h2>🚪 Logout</h2>
                  <p>Sign out safely from your account.</p>
                </div>
              </div>
)}
              {accountTab && (
                <div className="account-detail-panel">
                  <button className="back-btn" onClick={() => setAccountTab("")}>
                    ← Back to Account
                  </button>

                  {accountTab === "profile" && (
                    <div className="account-box account-detail-box">
                      <h2>👤 My Profile</h2>
                      <p><b>Name:</b> {user.name}</p>
                      <p><b>Email:</b> {user.email}</p>

                      <input
                        type="text"
                        placeholder="New Name"
                        onChange={(e) =>
                          setEditProfileData({ ...editProfileData, name: e.target.value })
                        }
                      />

                      <input
                        type="email"
                        placeholder="New Email"
                        onChange={(e) =>
                          setEditProfileData({ ...editProfileData, email: e.target.value })
                        }
                      />

                      <button onClick={updateProfile}>Update Profile</button>
                    </div>
                  )}

                  {accountTab === "security" && (
                    <div className="account-box account-detail-box">
                      <h2>🔐 Login & Security</h2>
                      <p>Password and account security settings.</p>

                      <input
                        type="password"
                        placeholder="Old Password"
                        value={passwordData.old_password}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, old_password: e.target.value })
                        }
                      />

                      <input
                        type="password"
                        placeholder="New Password"
                        value={passwordData.new_password}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, new_password: e.target.value })
                        }
                      />

                      <button onClick={changePassword}>Change Password</button>
                    </div>
                  )}

                  {accountTab === "addresses" && (
                    <div className="account-box account-detail-box">
                      <h2>📍 Saved Addresses</h2>

                      <input
                        placeholder="Full Name"
                        value={addressForm.full_name}
                        onChange={(e) =>
                          setAddressForm({ ...addressForm, full_name: e.target.value })
                        }
                      />

                      <input
                        placeholder="Phone"
                        value={addressForm.phone}
                        onChange={(e) =>
                          setAddressForm({ ...addressForm, phone: e.target.value })
                        }
                      />

                      <textarea
                        placeholder="Address"
                        value={addressForm.address_line}
                        onChange={(e) =>
                          setAddressForm({ ...addressForm, address_line: e.target.value })
                        }
                      />

                      <input
                        placeholder="City"
                        value={addressForm.city}
                        onChange={(e) =>
                          setAddressForm({ ...addressForm, city: e.target.value })
                        }
                      />

                      <input
                        placeholder="State"
                        value={addressForm.state}
                        onChange={(e) =>
                          setAddressForm({ ...addressForm, state: e.target.value })
                        }
                      />

                      <input
                        placeholder="Pincode"
                        value={addressForm.pincode}
                        onChange={(e) =>
                          setAddressForm({ ...addressForm, pincode: e.target.value })
                        }
                      />

                      <button onClick={saveAddress}>Save Address</button>

                      {addresses.length > 0 && (
                        <div className="saved-address-list">
                          <h3>Saved Addresses</h3>

                          {addresses.map((addr) => (
                            <div className="saved-address-card" key={addr.id}>
                              <strong>{addr.full_name}</strong>
                              <p>{addr.phone}</p>
                              <p>{addr.address_line}</p>
                              <p>{addr.city}, {addr.state} - {addr.pincode}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="auth-card">
              <div className="auth-tabs">
                <button onClick={() => setLoginMode("login")}>Login</button>
                <button onClick={() => setLoginMode("signup")}>Signup</button>
              </div>

              {loginMode === "login" ? (
                <>
                  <h2>Login</h2>
                  <input
                    placeholder="Email"
                    onChange={(e) =>
                      setLoginData({ ...loginData, email: e.target.value })
                    }
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    onChange={(e) =>
                      setLoginData({ ...loginData, password: e.target.value })
                    }
                  />
                  <button onClick={handleLogin}>Login</button>
                </>
              ) : (
                <>
                  <h2>Create Account</h2>
                  <input
                    placeholder="Name"
                    onChange={(e) =>
                      setSignupData({ ...signupData, name: e.target.value })
                    }
                  />
                  <input
                    placeholder="Email"
                    onChange={(e) =>
                      setSignupData({ ...signupData, email: e.target.value })
                    }
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    onChange={(e) =>
                      setSignupData({ ...signupData, password: e.target.value })
                    }
                  />
                  <button onClick={handleSignup}>Signup</button>
                </>
              )}
            </div>
          )}
        </section>
      )}

      {activePage === "checkout" && (
        <section className="page-section">
          <h1>📦 Checkout</h1>

          <div className="checkout-card">
            <h2>Delivery Address</h2>

            {addresses.length > 0 && (
              <select
                value={checkoutData.savedAddressId}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  const selectedAddress = addresses.find(
                    (addr) => String(addr.id) === selectedId
                  );

                  if (selectedAddress) {
                    setCheckoutData({
                      ...checkoutData,
                      savedAddressId: selectedId,
                      phone: selectedAddress.phone,
                      address: `${selectedAddress.full_name}, ${selectedAddress.address_line}, ${selectedAddress.city}, ${selectedAddress.state} - ${selectedAddress.pincode}`,
                    });
                  }
                }}
              >
                <option value="">Select Saved Address</option>

                {addresses.map((addr) => (
                  <option key={addr.id} value={addr.id}>
                    {addr.full_name} - {addr.city}
                  </option>
                ))}
              </select>
            )}

            <input
              placeholder="Phone Number"
              value={checkoutData.phone}
              onChange={(e) =>
                setCheckoutData({ ...checkoutData, phone: e.target.value })
              }
            />

            <textarea
              placeholder="Full Address"
              value={checkoutData.address}
              onChange={(e) =>
                setCheckoutData({ ...checkoutData, address: e.target.value })
              }
            />

            <h2>Payment Method</h2>

            <select
              value={checkoutData.payment}
              onChange={(e) =>
                setCheckoutData({ ...checkoutData, payment: e.target.value })
              }
            >
              <option>Cash on Delivery</option>
              <option>UPI Payment</option>
              <option>Debit/Credit Card</option>
            </select>

            <h2>Total: ₹{cartTotal.toFixed(2)}</h2>
            <button onClick={confirmOrder}>Confirm Order</button>
          </div>
        </section>
      )}

      {activePage === "orders" && (
        <section className="page-section">
          <h1>📦 My Orders</h1>

          {orders.length === 0 ? (
            <div className="empty-box">
              <h2>No orders yet</h2>
              <button onClick={() => setActivePage("home")}>Shop Now</button>
            </div>
          ) : (
            <div className="orders-list">
              {orders.map((order, index) => (
                <div className="order-card" key={`${order.id}-${index}`}>
                  {order.product_image && (
                    <img
                      src={`${API}/images/${order.product_image}`}
                      alt={order.product_name}
                      className="order-image"
                    />
                  )}

                  <div className="order-info">
                    <h2>{order.product_name || `Order #${order.id}`}</h2>
                    <p><b>Order ID:</b> #{order.id}</p>
                    <p><b>Status:</b> {order.order_status}</p>
                    <p><b>Payment:</b> {order.payment_method}</p>
                    <p><b>Quantity:</b> {order.quantity || 1}</p>
                    <p><b>Phone:</b> {order.phone}</p>
                    <p><b>Address:</b> {order.address_line}</p>
                    <h3>Total: ₹{order.total_amount}</h3>

                    <button
                      onClick={() =>
                        addToCart({
                          id: order.product_id || order.id,
                          name: order.product_name,
                          image: order.product_image,
                          price: order.product_price,
                        })
                      }
                    >
                      Buy Again
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default App;