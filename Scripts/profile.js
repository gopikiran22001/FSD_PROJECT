const apiUrl = 'https://qn3tesot21.execute-api.ap-south-1.amazonaws.com/E-Commerce';


function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
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
async function loginUserCheck(mail, password) {
    const responseBody = await loginUser(mail, password);
    if (!Array.isArray(responseBody) || responseBody.length === 0) return false;

    const user = responseBody[0];
    document.cookie = `User=${encodeURIComponent(JSON.stringify(user))}; max-age=${60 * 60 * 24 * 3}; path=/`;
    document.cookie = `Login=true; max-age=${60 * 60 * 24 * 3}; path=/`;

    return true;
}

async function updateField(fieldName,value,mail) {
    const jsonResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            collection: 'users',
            operation: "updateField",
            field: fieldName,
            value:value,
            mail:mail
        })
    }).then(response => response.json());
    const body = typeof jsonResponse.body === "string"
        ? JSON.parse(jsonResponse.body)
        : jsonResponse.body;
        // console.log(body);
    return body.message==='Field updated successfully.';
}

async function getField(fieldName,mail) {
    const jsonResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            collection: "users",
            operation: "getFieldValuesByMail",
            field: fieldName,
            mail:mail
        })
    }).then(response => response.json());

    const parsedBody = typeof jsonResponse.body === "string"
        ? JSON.parse(jsonResponse.body)
        : jsonResponse.body;

    // console.log(parsedBody);
    return parsedBody;
}

window.onload= async () => {
    const userCookie=getCookie("User");
    if(!(getCookie("Login") || userCookie)) {
        window.location.href = "index.html";
    }
    const user=JSON.parse(decodeURIComponent(userCookie));
    if(user.gender==='Male') {
        document.getElementById("profile-pic-type").src="Tool/profile-pic-male_4811a1.svg";
    } else {
        document.getElementById("profile-pic-type").src="Tool/profile-pic-female_0627fd.svg";
    }
    document.getElementById("profile-fullName").innerHTML=user.firstName+" "+user.lastName;

    let firstName=user.firstName;
    let lastName=user.lastName;
    let dob=user.DOB;
    let gender=user.gender;
    let email=user.mail;
    let phone=user.phone;
    let password=user.password;
    let address = await getField("address", email);

    address=address.address;

    // const gender = document.querySelector('input[name="gender"]:checked').value;

    // console.log(address);

    function setDetails1() {
        document.getElementById("firstName").value=firstName;
        document.getElementById("lastName").value=lastName;
        // const today = new Date(dob).toISOString().split('T')[0];
        document.getElementById("dob").value = dob;
        let genderRadio = document.querySelector('input[name="gender"][value="' + gender + '"]');
        if (genderRadio) {
            genderRadio.checked = true;
        }
        document.getElementById("form1-submit").style.display="none";
    }
    setDetails1();
    const form1= document.getElementById('form1');

    Array.from(form1.elements).forEach(el => el.disabled = true);

    const form1_span=document.getElementById('form1-span');
    form1_span.innerHTML="Edit";

    form1_span.addEventListener('click', function() {
        document.getElementById("form1-submit").style.display="block";
        if(form1_span.innerHTML==="Cancel") {
            setDetails1();
        }
        Array.from(form1.elements).forEach(el => el.disabled = !el.disabled);
        form1_span.innerHTML = form1_span.innerHTML === "Edit" ? "Cancel" : "Edit";
    });

    function setDetails2() {
        document.getElementById("email").value=email;
        document.getElementById("email").disabled=true;
        document.getElementById("form2-span").innerHTML="Edit";
        document.getElementById("form2-submit").style.display="none";

    }
    setDetails2();
    
    document.getElementById("form2-span").addEventListener('click', function() {
        document.getElementById("form2-submit").style.display="block";
        if(document.getElementById("form2-span").innerHTML==="Cancel") {
            setDetails2();
            return;
        }
        document.getElementById("email").disabled = false;
        document.getElementById("form2-span").innerHTML = document.getElementById("form2-span").innerHTML === "Edit" ? "Cancel" : "Edit";
    });

    function setDetails3() {
        document.getElementById("phone").value=phone;
        document.getElementById("phone").disabled=true;
        document.getElementById("form3-span").innerHTML="Edit";
        document.getElementById("form3-submit").style.display="none";

    }
    setDetails3();

    document.getElementById("form3-span").addEventListener('click', function() {
        document.getElementById("form3-submit").style.display="block";
        if(document.getElementById("form3-span").innerHTML==="Cancel") {
            setDetails3();
            return;
        }
        document.getElementById("phone").disabled = false;
        document.getElementById("form3-span").innerHTML = document.getElementById("form3-span").innerHTML === "Edit" ? "Cancel" : "Edit";
    });

    document.getElementById("form1-submit").addEventListener('click', async function(event) {
        event.preventDefault();
        firstName=document.getElementById("firstName").value;
        lastName=document.getElementById("lastName").value;
        dob=document.getElementById("dob").value;
        gender = document.querySelector('input[name="gender"]:checked').value;
        const loader = document.getElementsByClassName("loader-background")[0];
        loader.style.display = "block";
        if(!await updateField("firstName", firstName, email)) {
            loader.style.display = "none";
            alert("Update Failed");
            return;
        }
        if(!await updateField("lastName", lastName, email)) {
            loader.style.display = "none";
            alert("Update Failed");
            return;
        }
        if(!await updateField("DOB", dob, email)) {
            loader.style.display = "none";
            alert("Update Failed");
            return;
        }
        if(!await updateField("gender", gender, email)) {
            loader.style.display = "none";
            alert("Update Failed");
            return;
        }
        if (!await userCheck("mail", email)) {
            loader.style.display = "none";
            alert("Invalid Mail Address");
            return;
        }
        if (!await loginUserCheck(email, password)) {
            loader.style.display = "none";
            alert("Invalid Password");
            return;
        }
        location.reload();
    });

    document.getElementById("form2-submit").addEventListener('click', async function(event) {
        event.preventDefault();
        mail=document.getElementById("email").value;
        const loader = document.getElementsByClassName("loader-background")[0];
        loader.style.display = "block";
        if(!await updateField("mail", mail, email)) {
            loader.style.display = "none";
            alert("Update Failed");
            return;
        }
        email=mail;
        if (!await userCheck("mail", email)) {
            loader.style.display = "none";
            alert("Invalid Mail Address");
            return;
        }
        if (!await loginUserCheck(email, password)) {
            loader.style.display = "none";
            alert("Invalid Password");
            return;
        }
        location.reload();
    });


    document.getElementById("form3-submit").addEventListener('click', async function(event) {
        event.preventDefault();
        phone=document.getElementById("phone").value;
        const loader = document.getElementsByClassName("loader-background")[0];
        loader.style.display = "block";
        if(!await updateField("phone", phone, email)) {
            loader.style.display = "none";
            alert("Update Failed");
            return;
        }
        if (!await userCheck("mail", email)) {
            loader.style.display = "none";
            alert("Invalid Mail Address");
            return;
        }
        if (!await loginUserCheck(email, password)) {
            loader.style.display = "none";
            alert("Invalid Password");
            return;
        }
        location.reload();
    });

    document.getElementById("add-address").addEventListener("click", () => {
        document.getElementById("add-address").style.display='none';
        document.getElementById("form-container").style.display="flex";   
    })

    document.getElementById("cancel").addEventListener("click",(event)=>{
        event.preventDefault();
        document.getElementById("add-address").style.display='flex';
        document.getElementById("form-container").style.display="none";
    })

    document.getElementById("manage-address").addEventListener("click", () => {
        document.getElementById("profile-information-panel").style.display='none';
        document.getElementById("manage-address-panel").style.display='flex';
    });

    document.getElementById("profile-information").addEventListener("click", () => {
        document.getElementById("add-address").style.display='flex';
        document.getElementById("form-container").style.display="none";
        document.getElementById("manage-address-panel").style.display='none';
        document.getElementById("profile-information-panel").style.display='flex';
    });

    async function  renderAddressList() {
        const addressContainer = document.getElementById("address-list");
        addressContainer.innerHTML = "";
        for (let i = 0; i < address.length; i++) {
            if(typeof address[i]=== "string") {
                continue;
            }
            const addressDiv = document.createElement("div");
            addressDiv.classList.add("address");
            let curAddress=address[i];
            addressDiv.innerHTML = `
                <button class="delete-btn" data-index="${i}">Delete</button>
                <span class="address-type">${curAddress.addressType}</span>
                <span class="user-name-mobile"><span><b>${firstName+" "+lastName}</b></span><span><b>${phone}</b></span></span>
                <span class="fullAdress1">${curAddress.flatNo+", "+
                curAddress.apartment+", "+curAddress.street+", "+curAddress.city+", "+
                curAddress.district+","}</span>
                <span class="fullAdress2">${
                    curAddress.state+", "+
                    curAddress.pincode+", LandMark: "+
                    curAddress.landmark
                }</span>
                
            `;  
            addressContainer.appendChild(addressDiv);
            document.querySelectorAll(".delete-btn").forEach(button => {
                button.addEventListener("click", (e) => {
                    const index = e.target.getAttribute("data-index");
                    address.splice(index, 1); // Remove from array
                    renderAddressList(); // Re-render list
                });
            });
        }
    
        // Attach event listeners to delete buttons
        document.querySelectorAll(".delete-btn").forEach(button => {
            button.addEventListener("click", async (e) => {
                const index = e.target.getAttribute("data-index");
                address.splice(index, 1);
                if(!await updateField("address", address, email)) {
                    alert("Update Failed");
                    loader.style.display = "none";
                    return;
                }
                renderAddressList(); // Re-render list
            });
        });
    }
    
    renderAddressList();


    document.getElementById("save").addEventListener("click", async (event) => {
        event.preventDefault();
        const flatNo = document.getElementById("flat-no").value.trim();
        const apartment = document.getElementById("apartment").value.trim();
        const street = document.getElementById("street-name").value.trim();
        const city = document.getElementById("city").value.trim();
        const district = document.getElementById("district").value.trim();
        const state = document.getElementById("state").value.trim();
        const pincode = document.getElementById("pincode").value.trim();
        const landmark = document.querySelector('input[name="landmark"]').value.trim();
        const addressType = document.querySelector('input[name="address-type"]:checked').value;

        // Build address string
        const loader = document.getElementsByClassName("loader-background")[0];
        loader.style.display = "block";
        let newAddress = {
            flatNo: flatNo,
            apartment: apartment,
            street: street,
            city: city,
            district: district,
            state: state,
            pincode: pincode,
            landmark: landmark || "",  // Optional
            addressType: addressType
        };
        
        address.push(newAddress);
        if(!await updateField("address", address, email)) {
            alert("Update Failed");
            loader.style.display = "none";
            return;
        }
        location.reload();
    })

    document.getElementById("my-orders-sidebar").addEventListener("click", () => {
        window.location.href = "orders.html";
    });

    document.getElementById("my-stuff-wishlist").addEventListener("click", () => {
        window.location.href = "wishlist.html";
    });

    document.getElementById("my-stuff-cart").addEventListener("click", () => {
        window.location.href = "cart.html";
    });

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
}