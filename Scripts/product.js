const apiUrl = 'https://qn3tesot21.execute-api.ap-south-1.amazonaws.com/E-Commerce';

const params = new URLSearchParams(window.location.search);
const searchValue = params.get("title");

// Cookie reader
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

// Update field in user document
async function updateField(fieldName, value, mail) {
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            collection: 'users',
            operation: "updateField",
            field: fieldName,
            value: value,
            mail: mail
        })
    });
    const json = await response.json();
    const body = typeof json.body === "string" ? JSON.parse(json.body) : json.body;
    return body.message === 'Field updated successfully.';
}

// Get specific field value from user
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

// Get product by title
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

// Fetch and render product data
async function fetchProductData() {
    try {
        const decodedTitle = decodeURIComponent(searchValue);
        document.title = decodedTitle;
        const data = await getProduct(decodedTitle);
        const loader = document.querySelector(".loader-background");
        loader.style.display = "none";

        if (!data || data.length === 0) {
            document.getElementById("product-not-found").style.display = 'block';
            return;
        }

        const product = data[0];
        const container = document.querySelector(".container");
        container.style.display = "block";

        // Basic info
        document.querySelector('.product-title').textContent = product?.title || '';
        document.querySelector('.product-price').textContent = product?.price ? `₹${product.price}` : '';
        document.querySelector('.product-description').textContent = product?.description || '';

        // Main image
        const mainImage = document.getElementById('mainImage');
        mainImage.src = product?.thumbnail || product?.images?.[0] || product?.image || '';
        mainImage.alt = product?.title || '';

        // Thumbnails
        const thumbnailContainer = document.querySelector('.thumbnail-container');
        thumbnailContainer.innerHTML = '';
        if (Array.isArray(product?.images)) {
            product.images.forEach(imgUrl => {
                const thumbnail = document.createElement('img');
                thumbnail.src = imgUrl;
                thumbnail.alt = product?.title || '';
                thumbnail.className = 'thumbnail';
                thumbnail.onclick = () => changeImage(imgUrl);
                thumbnailContainer.appendChild(thumbnail);
            });
        }

        // Wishlist & Cart
        if (getCookie('Login')) {
            const userCookie = getCookie("User");
            const user = JSON.parse(decodeURIComponent(userCookie));

            const wishlistData = await getFieldValuesByMail("wishlist", user.mail);
            const cartData = await getFieldValuesByMail("cart", user.mail);
            const wishlist = wishlistData?.wishlist || [];
            const cart = cartData?.cart || [];

            // Show wishlist icon if already in wishlist
            if (wishlist.some(item => item.title === product.title)) {
                document.getElementById("wishlist-icon").style.display = "flex";
            }

            // Add to wishlist
            document.getElementById("add-to-wishlist").addEventListener("click", async () => {
                if (!wishlist.some(item => item.title === product.title)) {
                    wishlist.push(product);
                    const success = await updateField("wishlist", wishlist, user.mail);
                    if (!success) return alert("Can't add to Wishlist");
                    location.reload();
                }
            });

            // Add to cart
            document.getElementById("add-to-cart").addEventListener("click", async () => {
                if (!cart.some(item => item.product.title === product.title)) {
                    const cartItem = {
                        quantity: parseInt(document.getElementById('quantity').value),
                        product: product
                    };
                    cart.push(cartItem);
                    const success = await updateField("cart", cart, user.mail);
                    if (!success) return alert("Can't add to Cart");
                    alert("Added to Cart");
                }
            });
        } else {
            document.getElementById("add-to-wishlist").addEventListener("click", async () => {
                alert("Not Logged in");
                return;
            });

            // Add to cart
            document.getElementById("add-to-cart").addEventListener("click", async () => {
                alert("Not Logged in");
                return;
            });
        }

        // Meta info
        let rating = product?.rating ?? 4;
        let reviewCount = product?.reviews?.length ?? 0;
        if (typeof rating === 'object') {
            rating = rating.rate;
            reviewCount = rating.count;
        }

        document.querySelector('.meta-item:nth-child(1) span').textContent = `${rating} (${reviewCount} reviews)`;
        document.querySelector('.meta-item:nth-child(2) span').textContent = product?.stock > 0 ? 'In Stock' : 'Out of Stock';

        // Specs
        const specsTable = document.querySelector('.specs-table');
        specsTable.innerHTML = `
            <tr><td>Brand</td><td>${product?.brand || ''}</td></tr>
            <tr><td>SKU</td><td>${product?.sku || ''}</td></tr>
            <tr><td>Weight</td><td>${product?.weight ? product.weight + 'g' : ''}</td></tr>
            <tr><td>Dimensions</td><td>${product?.dimensions?.width || ''} x ${product?.dimensions?.height || ''} x ${product?.dimensions?.depth || ''}</td></tr>
            <tr><td>Warranty</td><td>${product?.warrantyInformation || ''}</td></tr>
            <tr><td>Shipping</td><td>${product?.shippingInformation || ''}</td></tr>
            <tr><td>Return Policy</td><td>${product?.returnPolicy || ''}</td></tr>
        `;

        // Reviews
        const reviewsContainer = document.querySelector('.reviews-section');
        const reviewsHtml = product?.reviews?.map(review => `
            <div class="review-card">
                <div class="review-header">
                    <span>${review?.reviewerName || 'Anonymous'}</span>
                    <span class="rating">${'★'.repeat(review?.rating || 0)}${'☆'.repeat(5 - (review?.rating || 0))}</span>
                </div>
                <p>${review?.comment || ''}</p>
            </div>
        `).join('') || '<p>No reviews available.</p>';
        reviewsContainer.innerHTML = `<h2>Customer Reviews</h2>${reviewsHtml}`;

    } catch (error) {
        console.error('Error fetching product data:', error);
    }
}

// Image swap handler
function changeImage(src) {
    document.getElementById('mainImage').src = src;
}

// Quantity adjustment
function updateQuantity(change) {
    const quantityInput = document.getElementById('quantity');
    let newValue = parseInt(quantityInput.value) + change;
    if (newValue >= 1) quantityInput.value = newValue;
}

// Load on DOM ready
document.addEventListener('DOMContentLoaded', fetchProductData);
