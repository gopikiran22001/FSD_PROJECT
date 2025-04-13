const apiUrl = 'https://qn3tesot21.execute-api.ap-south-1.amazonaws.com/E-Commerce';


function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

window.onload= async () => {
    if(!(getCookie("Login") || getCookie("User"))) {
        window.location.href = "index.html";
    }

}