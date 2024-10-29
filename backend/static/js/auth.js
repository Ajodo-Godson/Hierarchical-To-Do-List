document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("login-form");
    const signupForm = document.getElementById("signup-form");
    const showSignupLink = document.getElementById("show-signup");
    const showLoginLink = document.getElementById("show-login");
    const loginSection = document.getElementById("login-section");
    const signupSection = document.getElementById("signup-section");
    const dashboard = document.getElementById("dashboard");

    function showElement(element) {
        element.style.display = "block";
    }

    function hideElement(element) {
        element.style.display = "none";
    }

    showSignupLink.addEventListener("click", function () {
        hideElement(loginSection);
        showElement(signupSection);
    });

    showLoginLink.addEventListener("click", function () {
        hideElement(signupSection);
        showElement(loginSection);
    });

    signupForm.addEventListener("submit", function (event) {
        event.preventDefault();
        const name = document.getElementById("signup-name").value;
        const email = document.getElementById("signup-email").value;
        const password = document.getElementById("signup-password").value;

        fetch("/signup", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ name, email, password })
        })
            .then(response => response.json())
            .then(data => {
                if (data.message === "Account created successfully") {
                    alert("Sign-up successful! Please login.");
                    showLoginLink.click();
                } else {
                    alert("Error: " + data.message);
                }
            })
            .catch(error => {
                console.error("Error:", error);
                alert("An error occurred. Please try again.");
            });
    });

    loginForm.addEventListener("submit", function (event) {
        event.preventDefault();
        const email = document.getElementById("login-email").value;
        const password = document.getElementById("login-password").value;

        fetch("/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log("Login successful!");
                    alert("Login successful!");
                    hideElement(loginSection);
                    hideElement(signupSection);
                    showElement(dashboard);
                } else {
                    alert("Error: " + data.message);
                }
            })
            .catch(error => {
                console.error("Error:", error);
                alert("An error occurred. Please try again.");
            });
    });

    // Initially hide dashboard and show login section
    hideElement(dashboard);
    showElement(loginSection);
});
