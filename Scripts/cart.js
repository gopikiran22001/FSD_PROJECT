// ------------------------------
// ✅ Cleaned Cart Page Script
// ------------------------------

// ===== Constants and Configuration =====
const apiUrl = 'https://qn3tesot21.execute-api.ap-south-1.amazonaws.com/E-Commerce';

// ===== Utility Functions =====
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

if (!getCookie("Login")) {
  window.location.href = "index.html";
}

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ===== API Functions =====
async function updateField(fieldName, value, mail) {
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      collection: 'users',
      operation: 'updateField',
      field: fieldName,
      value: value,
      mail: mail
    })
  });
  const json = await response.json();
  const body = typeof json.body === 'string' ? JSON.parse(json.body) : json.body;
  return body.message === 'Field updated successfully.';
}

async function getField(fieldName, mail) {
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      collection: 'users',
      operation: 'getFieldValuesByMail',
      field: fieldName,
      mail: mail
    })
  });
  const json = await response.json();
  return typeof json.body === 'string' ? JSON.parse(json.body) : json.body;
}

async function search_menu_mongo() {
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ collection: 'search_menu', operation: 'search_menu' })
  });
  const json = await response.json();
  return typeof json.body === 'string' ? JSON.parse(json.body)[0]?.menu || [] : json.body[0]?.menu || [];
}

// ===== Cart Functions =====
function searchProduct(value) {
  if (value) {
    window.location.href = `search-product.html?search=${encodeURIComponent(value)}`;
  }
}

const userCookie = getCookie("User");
let cartItems = [];
let orderList = [];
let addressList = [];

const cartContainer = document.getElementById("cart-items");
const orderContainer = document.getElementById("panel");
const user = JSON.parse(decodeURIComponent(userCookie));
const loader = document.querySelector(".loader-background");

async function addressListCall() {
  orderContainer.innerHTML = '<h3>SELECT ADDRESS</h3>';
  addressList.forEach((address, index) => {
    const div = document.createElement("div");
    div.classList.add("address");
    div.innerHTML = `
      <div class="address-details">
        <span class="address-type">${address.addressType}</span>
        <span class="user-name-mobile"><b>${user.firstName} ${user.lastName}</b> | <b>${user.phone}</b></span>
        <span class="fullAdress1">${address.flatNo}, ${address.apartment}, ${address.street}, ${address.city}, ${address.district},</span>
        <span class="fullAdress2">${address.state}, ${address.pincode}, LandMark: ${address.landmark}</span>
      </div>
      <div class="order-option" style="display: none;" data-index="${index}"></div>
    `;
    orderContainer.appendChild(div);
  });
}

function renderCart() {
  if (cartItems.length > 0) {
    document.getElementById("cart-empty").style.display = "none";
    document.getElementById("cart-container").style.display = "flex";
  } else {
    document.getElementById("cart-container").style.display = "none";
    document.getElementById("cart-empty").style.display = "flex";
  }

  cartContainer.innerHTML = "";
  orderContainer.innerHTML = "";

  let totalPrice = 0;
  let totalDiscount = 0;
  let itemCount = 0;

  cartItems.forEach((it, index) => {
    const item = it.product;
    const random = getRandomNumber(1, 30);
    const discountedPrice = (((random / 100) * item.price) + item.price).toFixed(2);

    if (!item.outOfStock) {
      totalPrice += discountedPrice * it.quantity;
      totalDiscount += (discountedPrice - item.price) * it.quantity;
      itemCount += it.quantity;
    }

    cartContainer.innerHTML += `
      <div class="cart-item">
        <img src="${item.images ? item.images[0] : item.image}" alt="${item.title}">
        <div class="cart-details">
          <h4>${item.title}</h4>
          <p>${item.brand??''}</p>
          ${item.outOfStock ? '<p style="color:red">Out Of Stock</p>' : ''}
          <div class="price">
            $${item.price}
            <span class="original-price">$${discountedPrice}</span>
            <span class="discount">${random}% Off</span>
          </div>
          <div class="quantity-controls">
            <span class="quantity">Quantity: ${it.quantity}</span>
          </div>
          <div class="delete-icon" data-index="${index}">REMOVE</div>
        </div>
      </div>
    `;
  });

  document.querySelectorAll(".delete-icon").forEach(icon => {
    icon.addEventListener("click", async (event) => {
      event.stopPropagation();
      const index = parseInt(icon.getAttribute("data-index"));
      cartItems.splice(index, 1);
      const success = await updateField("cart", cartItems, user.mail);
      if (!success) {
        alert("Can't update Cart.");
        return;
      }
      renderCart();
    });
  });

  document.getElementById("place-order-btn").addEventListener("click", async () => {
    if (!addressList.length) {
      alert("No addresses found. Please add an address in your profile.");
      return;
    }

    document.getElementById("order-panel").style.display = "block";
    document.getElementById("exit-order-panel").addEventListener("click", () => {
      document.getElementById("order-panel").style.display = "none";
    });

    loader.style.display = "block";
    await addressListCall();
    loader.style.display = "none";

    document.querySelectorAll(".address").forEach(icon => {
      icon.addEventListener("click", async (event) => {
        event.stopPropagation();
        loader.style.display = "block";
        const index = parseInt(icon.getAttribute("data-index"));
        const orderAddress = addressList[index];

        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();
        const formatted = `${year}-${month}-${day}`;

        const orderDetails = {
          orderDate: formatted,
          address: orderAddress,
          products: cartItems,
          totalPrice: totalPrice - totalDiscount + 5
        };

        orderList.push(orderDetails);

        const success = await updateField("orders", orderList, user.mail);
        if (!success) {
          alert("Can't update orders.");
          document.getElementById("order-panel").style.display = "none";
          loader.style.display = "none";
          return;
        }

        if (!await updateField("cart", [], user.mail)) {
          alert("Can't update Cart.");
          document.getElementById("order-panel").style.display = "none";
          loader.style.display = "none";
          return;
        }

        alert("Order Successfully");
        document.getElementById("order-panel").style.display = "none";
        loader.style.display = "none";
        location.reload();
      });
    });
  });

  addressListCall();

  document.getElementById("total-price").textContent = "$" + totalPrice.toFixed(2);
  document.getElementById("total-discount").textContent = '$'+totalDiscount.toFixed(2) ;
  document.getElementById("item-count").textContent = itemCount;
  document.getElementById("total-amount").textContent = " $" + (totalPrice - totalDiscount + 5).toFixed(2);
  document.getElementById("total-savings").textContent = "You will save $" + totalDiscount.toFixed(2) + " on this order";
}

// ===== Event Handlers =====
window.onload = async () => {
  loader.style.display = "flex";

  if (!userCookie) {
    loader.style.display = "none";
    window.location.href = "index.html";
    return;
  }

  const data = await getField("cart", user.mail);
  cartItems = data.cart || [];

  const orderData = await getField("orders", user.mail);
  orderList = orderData.orders || [];

  const addressData = await getField("address", user.mail);
  addressList = addressData.address || [];

  const loginStatus = getCookie("Login");

  if (loginStatus && userCookie) {
    document.getElementById("profile-name").innerHTML = user.firstName;
    document.querySelector(".login-profile").style.display = "none";
    document.querySelector(".profile").style.display = "flex";
    document.getElementById("three-dots").addEventListener("mouseover", threeDots);
  } else {
    document.querySelector(".profile").style.display = "none";
    document.querySelector(".login-profile").style.display = "flex";
    document.getElementById("three-dots").removeEventListener("mouseover", threeDots);
  }

  document.getElementById("logo").addEventListener("click", () => window.location.href = 'index.html');
  document.getElementById("profile-check").addEventListener("click", () => window.location.href = "profile.html");
  document.getElementById("orders").addEventListener("click", () => window.location.href = "orders.html");
  document.getElementById("wishlist").addEventListener("click", () => window.location.href = "wishlist.html");
  document.getElementById("cart").addEventListener("click", (e) => {
    e.preventDefault();
    window.location.href = "cart.html";
  });

  document.getElementById("logout").addEventListener("click", () => {
    loader.style.display = "block";
    setTimeout(() => {
      document.cookie = "Login=; max-age=0; path=/";
      document.cookie = "User=; max-age=0; path=/";
      loader.style.display = "none";
      location.reload();
    }, 500);
  });

  let search_menu = [];

  if (!sessionStorage.getItem("isSearchMenu")) {
    search_menu = await search_menu_mongo();
    sessionStorage.setItem("isSearchMenu", "true");
    sessionStorage.setItem("searchMenu", JSON.stringify(search_menu));
  } else {
    search_menu = JSON.parse(sessionStorage.getItem("searchMenu"));
  }

  const searchInput = document.getElementById("search-input");
  const dropdown = document.getElementById("search_menu");

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && searchInput.value) {
      e.preventDefault();
      searchProduct(searchInput.value);
    }
  });

  searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim().toLowerCase();
    if (query.length === 0) {
      dropdown.innerHTML = "";
      dropdown.style.display = "none";
      return;
    }

    const suggestions = search_menu
      .filter(item => item.toLowerCase().includes(query))
      .slice(0, 20);

    if (suggestions.length > 0) {
      dropdown.innerHTML = suggestions.map(item => `<div class='dropdown-item'>${item}</div>`).join("");
      dropdown.style.display = "block";

      document.querySelectorAll(".dropdown-item").forEach(item => {
        item.addEventListener("click", () => {
          searchInput.value = item.textContent;
          dropdown.innerHTML = "";
          dropdown.style.display = "none";
          searchProduct(item.textContent);
        });
      });
    } else {
      dropdown.innerHTML = "";
      dropdown.style.display = "none";
    }
  });

  dropdown.addEventListener("mousedown", (event) => event.preventDefault());
  searchInput.addEventListener("blur", () => dropdown.style.display = "none");

  function threeDots() {
    document.getElementById("three-dots-menu").style.display = "flex";
  }

  document.getElementById("three-dots-menu").addEventListener("mouseover", () => {
    document.getElementById("three-dots-menu").style.display = "flex";
  });

  document.getElementById("three-dots").addEventListener("mouseleave", () => {
    document.getElementById("three-dots-menu").style.display = "none";
  });

  document.getElementById("three-dots-menu").addEventListener("mouseleave", () => {
    document.getElementById("three-dots-menu").style.display = "none";
  });

  loader.style.display = "none";
  renderCart();
};
