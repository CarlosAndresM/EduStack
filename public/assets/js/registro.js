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


// Codigo para renderizar la lista de las categorias escolares = >>{



document.addEventListener('DOMContentLoaded', (e) => {
    const selectDeCategorias = document.getElementById('countries');

    selectDeCategorias.innerHTML = ''
    fetch('/listaEducativa', {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            console.log(data.message); // Muestra el mensaje del servidor en la consola
        }

        if (data.categories && data.categories.length > 0) {
            data.categories.forEach(element => {
                selectDeCategorias.innerHTML += `<option value="${element.id}">${element.nombre}</option>`;
            });
        }
    })
    .catch(error => console.error('Error al obtener las categorías educativas:', error));
});

// }


// CODIGO PARA EL REGISTRO DEL USUARIO

document.addEventListener('DOMContentLoaded', () => {
    const registroForm = document.getElementById('registroUsuariosForm');
    const formularioRegistro = document.getElementById('formularioRegistro');
    const codigoVerificacionModal = document.getElementById('codigoVerificacionModal');
    const closeBtn = document.getElementById('closeModal');
    const submitBtn = document.getElementById('submitVerificationCode');
    const verificationCodeInput = document.getElementById('verification_code_modal');
    const timerElement = document.getElementById('timer');
    const warningMessage = document.getElementById('warningMessage'); // Elemento para mostrar mensajes de advertencia

    let verificationCodeTimer; // Variable para almacenar el temporizador del código de verificación
    let verificationCodeExpiresAt; // Variable para almacenar el tiempo de expiración del código

    registroForm.addEventListener('click', (event) => {
        event.preventDefault(); // Evitar el envío automático del formulario

        const email = document.getElementById('floating_email').value;
        const password = document.getElementById('floating_password').value;
        const repeatPassword = document.getElementById('floating_repeat_password').value;
        const firstName = document.getElementById('floating_first_name').value;
        const lastName = document.getElementById('floating_last_name').value;
        const phone = document.getElementById('floating_phone').value;
        const userName = document.getElementById('floating_company').value;
        const agreedTerms = document.getElementById('checkbox-1').checked;
        const promotionalOffers = document.getElementById('checkbox-2').checked;
        const educational_level_id = document.getElementById('countries').value;

        if (!email || !password || !repeatPassword || !firstName || !lastName || !phone || !userName || !agreedTerms || !promotionalOffers || !educational_level_id) {
            showNotification('Por favor completa todos los campos y acepta los términos y condiciones.');
            return;
        }

        if (password !== repeatPassword) {
            showNotification('Las contraseñas no coinciden.');
            return;
        }

        const userData = {
            email: email,
            password: password,
            first_name: firstName,
            last_name: lastName,
            phone: phone,
            userName: userName,
            agreed_terms: agreedTerms,
            promotional_offers: promotionalOffers,
            educational_level_id: educational_level_id
        };

        fetch('/registro', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al registrar usuario.');
            }
            return response.json();
        })
        .then(data => {
            console.log('Respuesta del servidor:', data);
            formularioRegistro.reset();
        
            if (data.userExisten) {
                showNotification(data.mensaje);
            } else {
                codigoVerificacionModal.style.display = 'flex';
                startVerificationCodeTimer(data.expiresAt);

                if (data.mensaje) {
                    showNotification(data.mensaje);
                }
            }
        })
        .catch(err => {
            console.error('Error al procesar la solicitud:', err);
            showNotification('Error interno al procesar la solicitud.');
        });
    });

    closeBtn.addEventListener('click', () => {
        codigoVerificacionModal.style.display = 'none';
        clearInterval(verificationCodeTimer);
    });

    submitBtn.addEventListener('click', () => {
        const verificationCode = verificationCodeInput.value.trim();
        const emailConfirmado = document.getElementById('confirm_email_modal').value.trim();
    
        fetch('/confirmar-cuenta', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: emailConfirmado,
                verificationCode: verificationCode
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al confirmar cuenta.');
            }
            return response.json();

        })
        .then(data => {
            console.log(data)
            if (data.message) {
                warningMessage.textContent = ''
                warningMessage.classList.remove('hidden');
                warningMessage.textContent = data.message;
            } 
                console.log('Cuenta confirmada:', data.message);
                codigoVerificacionModal.style.display = 'none';
                clearInterval(verificationCodeTimer);
            
        })
        .catch(error => {
            console.error('Error al confirmar cuenta:', error);
            showNotification('Error al confirmar cuenta. Por favor intenta nuevamente.');
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

    function startVerificationCodeTimer(expiresAt) {
        verificationCodeExpiresAt = new Date(expiresAt).getTime(); // Asegurarse de que expiresAt sea una fecha válida (puede ser un timestamp en milisegundos)
        updateTimer();

        verificationCodeTimer = setInterval(() => {
            updateTimer();
        }, 1000);
    }

    function updateTimer() {
        const now = new Date().getTime();
        const distance = verificationCodeExpiresAt - now;
        
        if (distance < 0) {
            clearInterval(verificationCodeTimer);
            timerElement.textContent = 'Tiempo expirado';
            requestNewVerificationCode();
        } else {
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            let seconds = Math.floor((distance % (1000 * 60)) / 1000);

            seconds = seconds < 10 ? `0${seconds}` : seconds;

            timerElement.textContent = `${minutes}:${seconds}`;
        }
    }

    function requestNewVerificationCode() {
        fetch('/solicitar-nuevo-codigo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: document.getElementById('confirm_email_modal').value.trim()
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al solicitar nuevo código.');
            }
            return response.json();
        })
        .then(data => {
            console.log('Nuevo código generado:', data);
            startVerificationCodeTimer(data.expiresAt);
        })
        .catch(error => {
            console.error('Error al solicitar nuevo código:', error);
            showNotification('Error al solicitar nuevo código. Por favor intenta nuevamente.');
        });
    }
});

