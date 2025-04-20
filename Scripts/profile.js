// API endpoint for E-Commerce backend
const apiUrl = 'https://qn3tesot21.execute-api.ap-south-1.amazonaws.com/E-Commerce';

// Helper to get cookie value
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}
if (!(getCookie("Login"))) {
    window.location.href = "index.html";
}
// Login user
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

    const body = typeof jsonResponse.body === "string" ? JSON.parse(jsonResponse.body) : jsonResponse.body;
    return body;
}

// Check if user exists
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

    const parsedBody = typeof jsonResponse.body === "string" ? JSON.parse(jsonResponse.body) : jsonResponse.body;
    return parsedBody.length > 0;
}

// Check login and set cookies
async function loginUserCheck(mail, password) {
    const responseBody = await loginUser(mail, password);
    if (!Array.isArray(responseBody) || responseBody.length === 0) return false;

    const user = responseBody[0];
    document.cookie = `User=${encodeURIComponent(JSON.stringify(user))}; max-age=${60 * 60 * 24 * 3}; path=/`;
    document.cookie = `Login=true; max-age=${60 * 60 * 24 * 3}; path=/`;
    return true;
}

// Update a user field
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

    const body = typeof jsonResponse.body === "string" ? JSON.parse(jsonResponse.body) : jsonResponse.body;
    return body.message === 'Field updated successfully.';
}

// Get field by mail
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
    }).then(response => response.json());

    const parsedBody = typeof jsonResponse.body === "string" ? JSON.parse(jsonResponse.body) : jsonResponse.body;
    return parsedBody;
}

// On page load
window.onload = async () => {
    const userCookie = getCookie("User");

    

    const user = JSON.parse(decodeURIComponent(userCookie));
    const { firstName, lastName, DOB: dob, gender, mail: email, phone, password } = user;
    let address = await getField("address", email);
    address = address.address;

    // Set profile picture based on gender
    document.getElementById("profile-pic-type").src = gender === 'Male' ?
        "Tool/profile-pic-male_4811a1.svg" : "Tool/profile-pic-female_0627fd.svg";

    document.getElementById("profile-fullName").innerHTML = `${firstName} ${lastName}`;

    // Personal info form setup
    function setDetails1() {
        document.getElementById("firstName").value = firstName;
        document.getElementById("lastName").value = lastName;
        document.getElementById("dob").value = dob;
        const genderRadio = document.querySelector(`input[name="gender"][value="${gender}"]`);
        if (genderRadio) genderRadio.checked = true;
        document.getElementById("form1-submit").style.display = "none";
    }

    setDetails1();
    const form1 = document.getElementById('form1');
    Array.from(form1.elements).forEach(el => el.disabled = true);
    const form1_span = document.getElementById('form1-span');
    form1_span.innerHTML = "Edit";

    form1_span.addEventListener('click', function () {
        document.getElementById("form1-submit").style.display = "block";
        if (form1_span.innerHTML === "Cancel") setDetails1();
        Array.from(form1.elements).forEach(el => el.disabled = !el.disabled);
        form1_span.innerHTML = form1_span.innerHTML === "Edit" ? "Cancel" : "Edit";
    });

    // Email form
    function setDetails2() {
        document.getElementById("email").value = email;
        document.getElementById("email").disabled = true;
        document.getElementById("form2-span").innerHTML = "Edit";
        document.getElementById("form2-submit").style.display = "none";
    }

    setDetails2();
    document.getElementById("form2-span").addEventListener('click', function () {
        document.getElementById("form2-submit").style.display = "block";
        if (this.innerHTML === "Cancel") return setDetails2();
        document.getElementById("email").disabled = false;
        this.innerHTML = this.innerHTML === "Edit" ? "Cancel" : "Edit";
    });

    // Phone form
    function setDetails3() {
        document.getElementById("phone").value = phone;
        document.getElementById("phone").disabled = true;
        document.getElementById("form3-span").innerHTML = "Edit";
        document.getElementById("form3-submit").style.display = "none";
    }

    setDetails3();
    document.getElementById("form3-span").addEventListener('click', function () {
        document.getElementById("form3-submit").style.display = "block";
        if (this.innerHTML === "Cancel") return setDetails3();
        document.getElementById("phone").disabled = false;
        this.innerHTML = this.innerHTML === "Edit" ? "Cancel" : "Edit";
    });

    // Form1 submit (profile)
    document.getElementById("form1-submit").addEventListener('click', async function (event) {
        event.preventDefault();
        const loader = document.getElementsByClassName("loader-background")[0];
        loader.style.display = "block";

        const updated = await Promise.all([
            updateField("firstName", document.getElementById("firstName").value, email),
            updateField("lastName", document.getElementById("lastName").value, email),
            updateField("DOB", document.getElementById("dob").value, email),
            updateField("gender", document.querySelector('input[name="gender"]:checked').value, email)
        ]);

        if (updated.includes(false) || !await userCheck("mail", email) || !await loginUserCheck(email, password)) {
            loader.style.display = "none";
            return alert("Update Failed");
        }
        location.reload();
    });

    // Form2 submit (email)
    document.getElementById("form2-submit").addEventListener('click', async function (event) {
        event.preventDefault();
        const newEmail = document.getElementById("email").value;
        const loader = document.getElementsByClassName("loader-background")[0];
        loader.style.display = "block";

        if (!await updateField("mail", newEmail, email) || !await userCheck("mail", newEmail) || !await loginUserCheck(newEmail, password)) {
            loader.style.display = "none";
            return alert("Update Failed");
        }
        location.reload();
    });

    // Form3 submit (phone)
    document.getElementById("form3-submit").addEventListener('click', async function (event) {
        event.preventDefault();
        const newPhone = document.getElementById("phone").value;
        const loader = document.getElementsByClassName("loader-background")[0];
        loader.style.display = "block";

        if (!await updateField("phone", newPhone, email) || !await userCheck("mail", email) || !await loginUserCheck(email, password)) {
            loader.style.display = "none";
            return alert("Update Failed");
        }
        location.reload();
    });

    // Address form toggle
    document.getElementById("add-address").addEventListener("click", () => {
        document.getElementById("add-address").style.display = 'none';
        document.getElementById("form-container").style.display = "flex";
    });

    document.getElementById("cancel").addEventListener("click", (event) => {
        event.preventDefault();
        document.getElementById("add-address").style.display = 'flex';
        document.getElementById("form-container").style.display = "none";
    });

    // Panel toggles
    document.getElementById("manage-address").addEventListener("click", () => {
        document.getElementById("profile-information-panel").style.display = 'none';
        document.getElementById("manage-address-panel").style.display = 'flex';
    });

    document.getElementById("profile-information").addEventListener("click", () => {
        document.getElementById("add-address").style.display = 'flex';
        document.getElementById("form-container").style.display = "none";
        document.getElementById("manage-address-panel").style.display = 'none';
        document.getElementById("profile-information-panel").style.display = 'flex';
    });

    // Render address list
    async function renderAddressList() {
        const addressContainer = document.getElementById("address-list");
        addressContainer.innerHTML = "";

        address.forEach((addr, i) => {
            if (typeof addr === "string") return;
            const div = document.createElement("div");
            div.classList.add("address");
            div.innerHTML = `
                <button class="delete-btn" data-index="${i}">Delete</button>
                <span class="address-type">${addr.addressType}</span>
                <span class="user-name-mobile"><span><b>${firstName} ${lastName}</b></span><span><b>${phone}</b></span></span>
                <span class="fullAdress1">${addr.flatNo}, ${addr.apartment}, ${addr.street}, ${addr.city}, ${addr.district},</span>
                <span class="fullAdress2">${addr.state}, ${addr.pincode}, LandMark: ${addr.landmark}</span>
            `;
            addressContainer.appendChild(div);
        });

        document.querySelectorAll(".delete-btn").forEach(button => {
            button.addEventListener("click", async (e) => {
                const index = e.target.getAttribute("data-index");
                address.splice(index, 1);
                if (!await updateField("address", address, email)) {
                    alert("Update Failed");
                    loader.style.display = "none";
                    return;
                }
                renderAddressList();
            });
        });
    }

    await renderAddressList();

    // Save new address
    document.getElementById("save").addEventListener("click", async (event) => {
        event.preventDefault();
        const loader = document.getElementsByClassName("loader-background")[0];
        loader.style.display = "block";

        const newAddress = {
            flatNo: document.getElementById("flat-no").value.trim(),
            apartment: document.getElementById("apartment").value.trim(),
            street: document.getElementById("street-name").value.trim(),
            city: document.getElementById("city").value.trim(),
            district: document.getElementById("district").value.trim(),
            state: document.getElementById("state").value.trim(),
            pincode: document.getElementById("pincode").value.trim(),
            landmark: document.querySelector('input[name="landmark"]').value.trim(),
            addressType: document.querySelector('input[name="address-type"]:checked').value
        };

        address.push(newAddress);
        if (!await updateField("address", address, email)) {
            alert("Update Failed");
            loader.style.display = "none";
            return;
        }
        location.reload();
    });

    // Sidebar navigation
    document.getElementById("my-orders-sidebar").addEventListener("click", () => {
        window.location.href = "orders.html";
    });

    document.getElementById("my-stuff-wishlist").addEventListener("click", () => {
        window.location.href = "wishlist.html";
    });

    document.getElementById("my-stuff-cart").addEventListener("click", () => {
        window.location.href = "cart.html";
    });

    // Logout
    document.getElementById("logout-panel").addEventListener("click", () => {
        const loader = document.getElementsByClassName("loader-background")[0];
        loader.style.display = "block";
        setTimeout(() => {
            document.cookie = "Login=; max-age=0; path=/";
            document.cookie = "User=; max-age=0; path=/";
            loader.style.display = "none";
            location.reload();
        }, 500);
    });
};
