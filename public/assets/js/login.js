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


//  Script para mostrar/ocultar contraseña --> {

const togglePassword = document.getElementById('togglePassword');
const password = document.getElementById('floating_password');

togglePassword.addEventListener('click', function () {
    const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
    password.setAttribute('type', type);
    this.classList.toggle('bx-hide');
    this.classList.toggle('bx-show');
});
 

//  Script para mostrar/ocultar contraseña --> }
 