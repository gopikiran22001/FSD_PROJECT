const apiUrl = 'https://qn3tesot21.execute-api.ap-south-1.amazonaws.com/E-Commerce';

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function updateField(fieldName, value, mail) {
    const jsonResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            collection: 'users',
            operation: "updateField",
            field: fieldName,
            value: value,
            mail: mail
        })
    }).then(response => response.json());

    const body = typeof jsonResponse.body === "string"
        ? JSON.parse(jsonResponse.body)
        : jsonResponse.body;

    return body.message === 'Field updated successfully.';
}

async function getField(fieldName, mail) {
    const jsonResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            collection: "users",
            operation: "getFieldValuesByMail",
            field: fieldName,
            mail: mail
        })
    }).then(res => res.json());

    const parsed = typeof jsonResponse.body === "string"
        ? JSON.parse(jsonResponse.body)
        : jsonResponse.body;

    return parsed;
}

async function search_menu_mongo() {
    const jsonResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collection: "search_menu", operation: "search_menu" })
    }).then(response => response.json());

    const parsedBody = typeof jsonResponse.body === "string"
        ? JSON.parse(jsonResponse.body)
        : jsonResponse.body;

    return parsedBody[0]?.menu || [];
}

function searchProduct(value) {
    if (value) {
        window.location.href = `search-product.html?search=${encodeURIComponent(value)}`;
    }
}

async function renderWishlist() {
    const loader = document.querySelector(".loader-background");
    loader.style.display = "flex";

    const userCookie = getCookie("User");
    if (!userCookie) {
        loader.style.display = "none";
        window.location.href = "index.html";
        return;
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
        if (query.length === 0) {
            dropdown.innerHTML = "";
            dropdown.style.display = "none";
            return;
        }

        const suggestions = search_menu.filter(item =>
            item.toLowerCase().includes(query)
        ).slice(0, 20);

        if (suggestions.length > 0) {
            dropdown.innerHTML = suggestions.map(item => `<div class="dropdown-item">${item}</div>`).join("");
            dropdown.style.display = "block";

            document.querySelectorAll(".dropdown-item").forEach(item => {
                item.addEventListener("click", function () {
                    searchInput.value = this.textContent;
                    dropdown.innerHTML = "";
                    dropdown.style.display = "none";
                    searchProduct(this.textContent);
                });
            });
        } else {
            dropdown.innerHTML = "";
            dropdown.style.display = "none";
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

    dropdown.addEventListener("mousedown", (event) => event.preventDefault());
    searchInput.addEventListener("blur", () => dropdown.style.display = "none");

    document.getElementById("logout").addEventListener("click", () => {
        loader.style.display = "block";
        setTimeout(() => {
            document.cookie = "Login=; max-age=0; path=/";
            document.cookie = "User=; max-age=0; path=/";
            loader.style.display = "none";
            location.reload();
        }, 500);
    });

    document.getElementById("profile-check").addEventListener("click", () => {
        window.location.href = "profile.html";
    });
    document.getElementById("orders").addEventListener("click", () => {
        window.location.href = "orders.html";
    });
    document.getElementById("wishlist").addEventListener("click", () => {
        window.location.href = "wishlist.html";
    });
    document.getElementById("cart").addEventListener("click", (event) => {
        event.preventDefault();
        window.location.href = "cart.html";
    });

    const user = JSON.parse(decodeURIComponent(userCookie));
    const list1 = await getField("wishlist", user.mail);
    const wishlist = list1.wishlist;

    loader.style.display = "none";

    const list = document.getElementById("wishlist-list");
    const count = document.getElementById("wishlist-count");

    list.innerHTML = "";
    count.textContent = wishlist.length;

    wishlist.forEach((item, index) => {
        const el = document.createElement("div");
        el.className = "wishlist-item";

        const stock = !(item.availabilityStatus && item.availabilityStatus === 'Out of Stock');
        const random = getRandomNumber(1, 30);

        el.innerHTML = `
            <img class="product-image" src="${item.images ? item.images[0] : item.image}" alt="${item.title}">
            <div class="product-details">
                <div class="product-title">${item.title}
                    ${item.availabilityStatus ? '<span class="assured-icon">✔️ Assured</span>' : ""}
                </div>
                <div class="price-info">
                    ${stock
                        ? `₹${item.price}<span class="original-price">₹${(((random / 100) * item.price) + item.price).toFixed(2)}</span><span class="discount">${random}% off</span>`
                        : '<div class="unavailable">Currently unavailable<br>Price: Not Available</div>'
                    }
                </div>
            </div>
            <div class="delete-icon" data-index="${index}">🗑️</div>
        `;
        list.appendChild(el);
    });

    document.querySelectorAll(".delete-icon").forEach(icon => {
        icon.addEventListener("click", async (event) => {
            event.stopPropagation();
            const index = parseInt(icon.getAttribute("data-index"));
            wishlist.splice(index, 1);
            const success = await updateField("wishlist", wishlist, user.mail);
            if (!success) {
                alert("Can't update wishlist.");
                return;
            }
            renderWishlist();
        });
    });

    document.getElementById("logo").addEventListener("click", () => {
        window.location.href = 'index.html';
    });
}

window.onload = renderWishlist;
