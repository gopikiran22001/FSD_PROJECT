const apiUrl = 'https://qn3tesot21.execute-api.ap-south-1.amazonaws.com/E-Commerce';

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

if (!(getCookie("Login"))) {
  window.location.href = "index.html";
}

// ===== API Functions =====
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
let orders = [];
const user = JSON.parse(decodeURIComponent(userCookie));

async function renderOrderList() {
  const orderList = document.getElementById("order-list");

  orders.forEach(order => {
    const orderDate = new Date(order.orderDate);
    const futureDate = new Date(orderDate);
    futureDate.setDate(orderDate.getDate() + 7);
    const yyyy = futureDate.getFullYear();
    const mm = String(futureDate.getMonth() + 1).padStart(2, '0');
    const dd = String(futureDate.getDate()).padStart(2, '0');
    const deliveryDate = `${dd}-${mm}-${yyyy}`;
    const today = new Date();

    order.products.forEach(products => {
      const card = document.createElement("div");
      card.className = "order-card";
      const image = products.product.images[0] ?? products.product.image;
      const name = products.product.title;
      const price = products.product.price * products.quantity;
      card.dataset.index = name;
      card.innerHTML = `
        <img src="${image}" alt="Product" />
        <div class="order-info">
          <div class="order-info-title">
            <div id=" ">${name}</div>
            <div class="price">$${price.toFixed(2)}</div>
            <div class="quantity">Quantity: x${products.quantity}</div>
          </div>
          <div class="order-info-date">
            <div class="delivery">
              <span class="dot" style='background-color:${futureDate < today ? "#0f0" : "#FFFF00"}'></span>
              ${futureDate < today ? 'Delivered on ' + deliveryDate : 'Delivery Expected on ' + deliveryDate}
            </div>
            <div><span class="review-button">★ Rate & Review Product</span></div>
          </div>
        </div>
      `;

      orderList.appendChild(card);
    });
  });

  document.querySelectorAll(".order-card").forEach(product => {
    product.addEventListener("click", () => {
      const title = product.dataset.index;
      if (title) {
        window.location.href = `product.html?title=${encodeURIComponent(title)}`;
      }
    });
  });
}

window.onload = async () => {
  const loader = document.querySelector(".loader-background");
  loader.style.display = "flex";

  const orderData = await getField("orders", user.mail);
  orders = orderData.orders || [];

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
  renderOrderList();
};
