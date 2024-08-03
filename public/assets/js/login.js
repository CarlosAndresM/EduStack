const linkRegistro = document.getElementById('linkRegistro')

linkRegistro.addEventListener('click', (e) => {
    e.preventDefault(); // Prevent the default action (i.e., following the link)

    fetch('/register', {
        method: 'GET',
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error al obtener la página de registro');
        }
        // Redirect to the registration page
        window.location.href = '/register';
    })
    .catch(error => {
        console.error('Fetch error:', error);
        // Handle errors (e.g., show an error message to the user)
    });
});



function showNotification(message) {
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notificationMessage');
    notificationMessage.textContent = message;
    notification.classList.add('show');
    setTimeout(() => {
        hideNotification();
    }, 6000);
}

function hideNotification() {
    const notification = document.getElementById('notification');
    notification.classList.remove('show');
}

 
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');

    // Toggle password visibility
    togglePassword.addEventListener('click', () => {
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;  
        togglePassword.setAttribute('name', type === 'password' ? 'hide' : 'show');
    });

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const userName = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        fetch("/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                userName: userName,
                password: password,
            }),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error("Login failed");
            }
            return response.json();
        })
        .then(data => {
            if (data.message === 'Inicio de sesión exitoso') {
                window.location.href = "/home";
            } else {
                alert("Login failed: " + data.message);

            }
        })
        .catch(error => {
            console.error("Error during login:", error);
            
            alert('Usuario o contraseña incorrecta, intente de nuevo.')
        });
    });
});
