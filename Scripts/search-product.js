// Cookie Helper
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

// Random Number Generator
function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// User Class
class User {
    constructor(firstName, lastName, DOB, gender, mail, phone, password) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.DOB = DOB;
        this.gender = gender;
        this.address = [];
        this.mail = mail;
        this.phone = phone;
        this.password = password;
        this.cart = [];
        this.orders = [];
        this.wishlist = [];
    }
}

// API Calls
async function getFieldValuesByMail(fieldName, mail) {
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            collection: "users",
            operation: "getFieldValuesByMail",
            field: fieldName,
            mail: mail
        })
    });
    const json = await response.json();
    return typeof json.body === "string" ? JSON.parse(json.body) : json.body;
}

async function getProduct(value) {
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            collection: "products",
            operation: "getProduct",
            title: value
        })
    });
    const json = await response.json();
    return typeof json.body === "string" ? JSON.parse(json.body) : json.body;
}

async function getField(fieldName, collection) {
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            collection,
            operation: "getFieldValues",
            fieldName
        })
    });
    const json = await response.json();
    const parsed = typeof json.body === "string" ? JSON.parse(json.body) : json.body;
    return parsed.map(item => Object.values(item)[0]);
}

async function search_menu_mongo() {
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collection: "search_menu", operation: "search_menu" })
    });
    const json = await response.json();
    const parsed = typeof json.body === "string" ? JSON.parse(json.body) : json.body;
    return parsed[0]?.menu || [];
}

async function userCheck(field, parameter) {
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            collection: "users",
            operation: "userCheck",
            field,
            parameter
        })
    });
    const json = await response.json();
    const parsed = typeof json.body === "string" ? JSON.parse(json.body) : json.body;
    return parsed.length > 0;
}

async function createUser(userDetails) {
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            collection: "users",
            operation: "createUser",
            user: userDetails
        })
    });
    const json = await response.json();
    const body = typeof json.body === "string" ? JSON.parse(json.body) : json.body;
    console.log(body);
    return body;
}

async function loginUser(mail, password) {
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            collection: "users",
            operation: "loginUser",
            mail,
            password
        })
    });
    const json = await response.json();
    return typeof json.body === "string" ? JSON.parse(json.body) : json.body;
}

async function loginUserCheck(mail, password) {
    const response = await loginUser(mail, password);
    if (!Array.isArray(response) || response.length === 0) return false;

    const user = response[0];
    document.cookie = `User=${encodeURIComponent(JSON.stringify(user))}; max-age=${60 * 60 * 24 * 3}; path=/`;
    document.cookie = `Login=true; max-age=${60 * 60 * 24 * 3}; path=/`;
    return true;
}

// Search Product Redirection
function searchProduct(value) {
    if (value) {
        window.location.href = `search-product.html?search=${encodeURIComponent(value)}`;
    }
}

// On Load
window.onload = async function () {
    const searchValue = new URLSearchParams(window.location.search).get('search');
    document.title = searchValue;
    const userCookie = getCookie("User");
    let user;
    let wishList = [];

    if (getCookie('Login')) {
        user = JSON.parse(decodeURIComponent(userCookie));
        const list = await getFieldValuesByMail("wishlist", user.mail);
        wishList = list.wishlist;
    }

    function updateUI() {
        const userCookie = getCookie("User");
        if (getCookie("Login") && userCookie) {
            document.getElementById("profile-name").innerHTML = JSON.parse(decodeURIComponent(userCookie)).firstName;
            document.querySelector(".login-profile").style.display = "none";
            document.querySelector(".profile").style.display = "flex";
            document.getElementById("three-dots").addEventListener("mouseover", threeDots);
        } else {
            document.querySelector(".profile").style.display = "none";
            document.querySelector(".login-profile").style.display = "flex";
            document.getElementById("three-dots").removeEventListener("mouseover", threeDots);
        }
    }

    document.getElementById("togglePassword1").addEventListener("click", function () {
        const passwordInput = document.getElementById("login-password");
        const type = passwordInput.type === "password" ? "text" : "password";
        passwordInput.type = type;
        this.classList.toggle("fa-eye-slash");
    });

    document.getElementById("signInForm").addEventListener("submit", async function (event) {
        event.preventDefault();
        const mail = document.getElementById("login-email").value;
        const pass = document.getElementById("login-password").value;
        const loader = document.querySelector(".loader-background");
        loader.style.display = "block";

        if (!await userCheck("mail", mail)) {
            loader.style.display = "none";
            alert("Invalid Mail Address");
            return;
        }
        if (!await loginUserCheck(mail, pass)) {
            loader.style.display = "none";
            alert("Invalid Password");
            return;
        }
        location.reload();
    });

    document.getElementById("signupForm").addEventListener("submit", async function (event) {
        event.preventDefault();
        const firstName = document.getElementById("firstName").value;
        const lastName = document.getElementById("lastName").value;
        const dob = document.getElementById("dob").value;
        const gender = document.querySelector('input[name="gender"]:checked').value;
        const mail = document.getElementById("email").value;
        const phone = document.getElementById("mobile").value;
        const password = document.getElementById("password").value;
        const loader = document.querySelector(".loader-background");
        loader.style.display = "block";

        if (await userCheck("mail", mail)) {
            loader.style.display = "none";
            alert("Email already exists");
            return;
        }
        if (await userCheck("phone", phone)) {
            loader.style.display = "none";
            alert("Phone number already exists");
            return;
        }

        const newUser = new User(firstName, lastName, dob, gender, mail, phone, password);
        const result = await createUser(newUser);

        if (result) {
            alert("User created successfully");
            if (!await userCheck("mail", mail) || !await loginUserCheck(mail, password)) {
                loader.style.display = "none";
                alert("Auto-login failed after signup");
                return;
            }
            setTimeout(() => loader.style.display = "none", 500);
            location.reload();
        } else {
            loader.style.display = "none";
            alert("User creation failed");
        }
    });

    updateUI();

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

    searchInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            if (searchInput.value) {
                searchProduct(searchInput.value);
            }
        }
    });

    searchInput.addEventListener("input", () => {
        const query = searchInput.value.trim().toLowerCase();
        dropdown.style.display = query ? "block" : "none";
        dropdown.innerHTML = "";

        const suggestions = search_menu.filter(item => item.toLowerCase().includes(query)).slice(0, 20);
        if (suggestions.length) {
            dropdown.innerHTML = suggestions.map(item => `<div class="dropdown-item">${item}</div>`).join("");
            document.querySelectorAll(".dropdown-item").forEach(item => {
                item.addEventListener("click", function () {
                    searchInput.value = this.textContent;
                    dropdown.innerHTML = "";
                    dropdown.style.display = "none";
                    searchProduct(this.textContent);
                });
            });
        }
    });

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

    dropdown.addEventListener("mousedown", e => e.preventDefault());
    searchInput.addEventListener("blur", () => dropdown.style.display = "none");

    document.getElementById("login-profile").addEventListener("click", () => {
        document.getElementById("log-pad").style.display = "block";
    });

    document.getElementById("exit-btn1").addEventListener("click", () => {
        document.getElementById("log-pad").style.display = "none";
    });

    document.getElementById("exit-btn2").addEventListener("click", () => {
        document.getElementById("log-pad").style.display = "none";
        document.getElementById("sign-Up").style.display = "none";
        document.getElementById("sign-In").style.display = "flex";
    });

    document.getElementById("signUp-btn").addEventListener("click", () => {
        document.getElementById("sign-In").style.display = "none";
        document.getElementById("sign-Up").style.display = "flex";
    });

    document.getElementById("signIn-btn").addEventListener("click", () => {
        document.getElementById("sign-Up").style.display = "none";
        document.getElementById("sign-In").style.display = "flex";
    });

    document.getElementById("logout").addEventListener("click", () => {
        const loader = document.querySelector(".loader-background");
        loader.style.display = "block";
        setTimeout(() => {
            document.cookie = "Login=; max-age=0; path=/";
            document.cookie = "User=; max-age=0; path=/";
            loader.style.display = "none";
            location.reload();
        }, 500);
    });

    document.getElementById("profile-check").addEventListener("click", () => window.location.href = "profile.html");
    document.getElementById("orders").addEventListener("click", () => window.location.href = "orders.html");
    document.getElementById("wishlist").addEventListener("click", () => window.location.href = "wishlist.html");
    document.getElementById("cart").addEventListener("click", (e) => {
        e.preventDefault();
        window.location.href = "cart.html";
    });

    const loader = document.querySelector(".loader-background");
    const products = await getProduct(searchValue);

    if (products.length === 0) {
        loader.style.display = "none";
        document.getElementById("product-container").style.display = "none";
        document.getElementById("product-not-found").style.display = "flex";
    } else {
        loader.style.display = "none";
        document.getElementById("product-not-found").style.display = "none";
        const productContainer = document.getElementById("product-container");
        productContainer.style.display = "flex";
        productContainer.innerHTML = "";

        products.forEach(product => {
            const random = getRandomNumber(1, 30);
            const wishlist_svg = wishList.some(w => w.title === product.title)
                ? 'Tool/svgviewer-output.svg'
                : 'Tool/sishlist.svg';

            const productDiv = document.createElement("div");
            productDiv.classList.add("product-card");
            productDiv.innerHTML = `
                <img src="${wishlist_svg}" alt="" class="wish_button">
                <img src="${product.images ? product.images[0] : product.image}" alt="Product Image" class="product-image">
                <div class="product-info">
                    <h3>${product.title}</h3>
                    <p><label>$${(((random / 100) * product.price) + product.price).toFixed(2)}</label>
                    $${product.price} <span class="discount">${random}% off</span></p>
                </div>
            `;
            productContainer.appendChild(productDiv);
        });

        document.querySelectorAll(".product-card").forEach(product => {
            product.addEventListener("click", () => {
                const title = product.querySelector("h3")?.innerText;
                if (title) {
                    window.location.href = `product.html?title=${encodeURIComponent(title)}`;
                }
            });
        });

        document.getElementById("logo").addEventListener("click", () => {
            window.location.href = 'index.html';
        });
    }
};
