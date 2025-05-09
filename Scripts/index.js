
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

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

async function getField(fieldName, collection) {
    const jsonResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            collection: collection,
            operation: "getFieldValues",
            fieldName: fieldName
        })
    }).then(response => response.json());

    const parsedBody = typeof jsonResponse.body === "string"
        ? JSON.parse(jsonResponse.body)
        : jsonResponse.body;

    return parsedBody.map(item => Object.values(item)[0]);
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

async function userCheck(field, parameter) {
    const jsonResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            collection: "users",
            operation: "userCheck",
            field: field,
            parameter: parameter
        })
    }).then(response => response.json());

    const parsedBody = typeof jsonResponse.body === "string"
        ? JSON.parse(jsonResponse.body)
        : jsonResponse.body;

    return parsedBody.length > 0;
}

async function createUser(userDetails) {
    const jsonResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            collection: "users",
            operation: "createUser",
            user: userDetails
        })
    }).then(response => response.json());

    const body = typeof jsonResponse.body === "string"
        ? JSON.parse(jsonResponse.body)
        : jsonResponse.body;

    console.log(body);
    return body;
}

async function loginUser(mail, password) {
    const jsonResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            collection: "users",
            operation: "loginUser",
            mail: mail,
            password: password
        })
    }).then(response => response.json());

    const body = typeof jsonResponse.body === "string"
        ? JSON.parse(jsonResponse.body)
        : jsonResponse.body;
    return body;
}

async function loginUserCheck(mail, password) {
    const responseBody = await loginUser(mail, password);
    if (!Array.isArray(responseBody) || responseBody.length === 0) return false;

    const user = responseBody[0];
    document.cookie = `User=${encodeURIComponent(JSON.stringify(user))}; max-age=${60 * 60 * 24 * 3}; path=/`;
    document.cookie = `Login=true; max-age=${60 * 60 * 24 * 3}; path=/`;

    return true;
}

function searchProduct(value) {
    if (value) {
        window.location.href = `search-product.html?search=${encodeURIComponent(value)}`;
    }
}

window.onload = async function () {
    const slidesWrapper = document.querySelector('.slides-wrapper');
    const slides = document.querySelectorAll('.slide');
    let activeIndex = 0;
    const totalSlides = slides.length;

    function moveToNextSlide() {
        slides[activeIndex].classList.remove('active');
        activeIndex = (activeIndex + 1) % totalSlides;
        slides[activeIndex].classList.add('active');
        slidesWrapper.style.transform = `translateX(-${100 * activeIndex}%)`;
    }

    setInterval(moveToNextSlide, 3000);
    slides[activeIndex].classList.add('active');

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
        const loader = document.getElementsByClassName("loader-background")[0];
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

        const loader = document.getElementsByClassName("loader-background")[0];
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

        const user = new User(firstName, lastName, dob, gender, mail, phone, password);
        const result = await createUser(user);

        if (result) {
            alert("User created successfully");
            if (!await userCheck("mail", mail)) {
                loader.style.display = "none";
                alert("Invalid Mail Address");
                return;
            }
            if (!await loginUserCheck(mail, password)) {
                loader.style.display = "none";
                alert("Invalid Password");
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
        const loader = document.getElementsByClassName("loader-background")[0];
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
};
