import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

import AddProduct from "./components/AddProduct";
import Cart from "./components/Cart";
import Login from "./components/Login";
import ProductList from "./components/ProductList";

import Context from "./Context";

const App = () => {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState({});
  const [products, setProducts] = useState([]);
  const [showMenu, setShowMenu] = useState(false);
  
  useEffect(() => {
    const fetchData = async () => {
      let storedUser = localStorage.getItem("user");
      let storedCart = localStorage.getItem("cart");
      
      const { data: productsData } = await axios.get("http://localhost:3001/products");
      setProducts(productsData);
      
      setUser(storedUser ? JSON.parse(storedUser) : null);
      setCart(storedCart ? JSON.parse(storedCart) : {});
    };

    fetchData();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await axios.post("http://localhost:3001/login", { email, password });
      if (res.status === 200) {
        const { email } = jwtDecode(res.data.accessToken);
        const newUser = {
          email,
          token: res.data.accessToken,
          accessLevel: email === "admin@example.com" ? 0 : 1,
        };
        setUser(newUser);
        localStorage.setItem("user", JSON.stringify(newUser));
        return true;
      }
    } catch {
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  const addProduct = (product, callback) => {
    setProducts((prevProducts) => [...prevProducts, product]);
    if (callback) callback();
  };

  const addToCart = (cartItem) => {
    setCart((prevCart) => {
      const updatedCart = { ...prevCart };
      updatedCart[cartItem.id] = updatedCart[cartItem.id] || { ...cartItem, amount: 0 };
      updatedCart[cartItem.id].amount += cartItem.amount;
      
      if (updatedCart[cartItem.id].amount > updatedCart[cartItem.id].product.stock) {
        updatedCart[cartItem.id].amount = updatedCart[cartItem.id].product.stock;
      }
      
      localStorage.setItem("cart", JSON.stringify(updatedCart));
      return updatedCart;
    });
  };

  const removeFromCart = (cartItemId) => {
    setCart((prevCart) => {
      const updatedCart = { ...prevCart };
      delete updatedCart[cartItemId];
      localStorage.setItem("cart", JSON.stringify(updatedCart));
      return updatedCart;
    });
  };

  const clearCart = () => {
    setCart({});
    localStorage.removeItem("cart");
  };

  const checkout = () => {
    if (!user) {
      return <Navigate to="/login" />;
    }

    const updatedProducts = products.map((p) => {
      if (cart[p.id]) {
        p.stock -= cart[p.id].amount;
        axios.put(`http://localhost:3001/products/${p.id}`, { ...p });
      }
      return p;
    });

    setProducts(updatedProducts);
    clearCart();
  };

  return (
    <Context.Provider
      value={{
        user,
        cart,
        products,
        removeFromCart,
        addToCart,
        login,
        addProduct,
        clearCart,
        checkout,
      }}
    >
      <BrowserRouter>
        <div className="App">
          <nav className="navbar container" role="navigation" aria-label="main navigation">
            <div className="navbar-brand">
              <b className="navbar-item is-size-4">ecommerce</b>
              <button
                className={`navbar-burger burger ${showMenu ? "is-active" : ""}`}
                aria-label="menu"
                onClick={() => setShowMenu(!showMenu)}
              >
                <span aria-hidden="true"></span>
                <span aria-hidden="true"></span>
                <span aria-hidden="true"></span>
              </button>
            </div>
            <div className={`navbar-menu ${showMenu ? "is-active" : ""}`}>
              <Link to="/products" className="navbar-item">Products</Link>
              {user && user.accessLevel < 1 && <Link to="/add-product" className="navbar-item">Add Product</Link>}
              <Link to="/cart" className="navbar-item">Cart
                <span className="tag is-primary" style={{ marginLeft: "5px" }}>{Object.keys(cart).length}</span>
              </Link>
              {!user ? <Link to="/login" className="navbar-item">Login</Link> :
                <Link to="/" onClick={logout} className="navbar-item">Logout</Link>}
            </div>
          </nav>
          <Routes>
            <Route path="/" element={<ProductList />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/add-product" element={<AddProduct />} />
            <Route path="/products" element={<ProductList />} />
          </Routes>
        </div>
      </BrowserRouter>
    </Context.Provider>
  );
};

export default App;