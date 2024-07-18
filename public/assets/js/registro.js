//  Script para mostrar/ocultar contraseña --> {

    const togglePassword = document.getElementById('togglePassword');
    const password = document.getElementById('floating_password');

    togglePassword.addEventListener('click', function () {
        const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
        password.setAttribute('type', type);
        this.classList.toggle('bx-hide');
        this.classList.toggle('bx-show');
    });

    // Para la confirmación de contraseña
    const toggleRepeatPassword = document.getElementById('toggleRepeatPassword');
    const repeatPassword = document.getElementById('floating_repeat_password');

    toggleRepeatPassword.addEventListener('click', function () {
        const type = repeatPassword.getAttribute('type') === 'password' ? 'text' : 'password';
        repeatPassword.setAttribute('type', type);
        this.classList.toggle('bx-hide');
        this.classList.toggle('bx-show');
    }); 

//  Script para mostrar/ocultar contraseña --> }