//  Script para mostrar/ocultar contraseña --> {

        // Toggle mostrar/ocultar contraseña
        document.getElementById('togglePassword').addEventListener('click', function () {
            const passwordInput = document.getElementById('floating_password');
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.setAttribute('name', type === 'password' ? 'hide' : 'show');
        });

        // Toggle mostrar/ocultar contraseña repetida
        document.getElementById('toggleRepeatPassword').addEventListener('click', function () {
            const repeatPasswordInput = document.getElementById('floating_repeat_password');
            const type = repeatPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            repeatPasswordInput.setAttribute('type', type);
            this.setAttribute('name', type === 'password' ? 'hide' : 'show');
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


// Registrar usuario
document.getElementById('registroUsuariosForm').addEventListener('click', async (event) => {
    event.preventDefault(); // Prevenir el envío por defecto del formulario
    

    console.log('registrando usuario')
    const email = document.getElementById('floating_email').value;
    const password = document.getElementById('floating_password').value; 
    const password_repeat = document.getElementById('floating_repeat_password').value
    const first_name = document.getElementById('floating_first_name').value;
    const last_name = document.getElementById('floating_last_name').value;
    const phone = document.getElementById('floating_phone').value;
    const userName = document.getElementById('floating_company').value;
    const educational_level_id = document.getElementById('countries').value;
    const agreed_terms = document.getElementById('checkbox-1').checked ? 1 : 0;
    const promotional_offers = document.getElementById('checkbox-2').checked ? 1 : 0;

    // Obtener el dominio del correo electrónico
    const domain = email.substring(email.lastIndexOf('@'));

    // Verificar si el dominio está en la lista permitida
    if (domain === '@gmail.com' || domain === '@hotmail.com' || domain === '@yahoo.com') {
        // Continuar con el flujo normal, por ejemplo, enviar el formulario
        
        console.log('Correo electrónico válido. Enviar formulario o realizar la acción correspondiente.');
    } else {
        // Mostrar una notificación de error al usuario
        showNotification('Por favor, use un correo electrónico válido (gmail, hotmail, yahoo).');
        return
    }

    // Validar que todos los campos obligatorios estén llenos
    if (!email || !password || !password_repeat || !first_name || !last_name || !phone || !userName || !educational_level_id || !agreed_terms) {
        showNotification('Por favor, complete todos los campos obligatorios.');
        return;
    }

    if(password !== password_repeat){
        showNotification('Las contraseñas no coinciden.');
        document.getElementById('loader').classList.add('hidden');
        return;
    }


    
    document.getElementById('loader').classList.remove('hidden');

    try {
        const response = await fetch('/registro', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                password,
                first_name,
                last_name,
                phone,
                userName,
                educational_level_id,
                agreed_terms,
                promotional_offers
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message); // Capturar el mensaje de error del servidor
        }

        if (data.showModal) {
            // Mostrar modal de verificación
            document.getElementById('codigoVerificacionModal').style.display = 'flex';
        }
    } catch (error) {
        console.error('Error al registrar usuario:', error);
        // Mostrar mensaje de error usando la función showNotification
        showNotification(error.message);
    }finally {
    // Ocultar el spinner de carga al finalizar, tanto si hay éxito como si hay error
    document.getElementById('loader').classList.add('hidden');
}
});




// Verificar código de verificación
document.getElementById('submitVerificationCode').addEventListener('click', async (e) => {
    e.preventDefault(); // Prevenir el envío por defecto del formulario
    
    // Obtener los valores de los campos de entrada
    let verificationCode = document.getElementById('verification_code_modal').value;
    let verificacionEmail = document.getElementById('confirm_email_modal').value;

    // Validar que todos los campos obligatorios estén llenos
    if (!verificationCode || !verificacionEmail) {
        showNotification('Por favor, complete todos los campos obligatorios.');
        return;
    }

    try {
        const response = await fetch('/verificar-codigo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                verificationCode,
                verificacionEmail
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message); // Capturar el mensaje de error del servidor
        }

        // Manejar diferentes casos de respuesta del servidor
        if (data.type === 'correoErroneo') {
            // Mostrar mensaje de error específico para correo erróneo
            showNotification(data.message);
            // Mostrar el modal de verificación nuevamente si es necesario
            document.getElementById('codigoVerificacionModal').style.display = 'flex';

            // Actualizar el mensaje de advertencia
            const mensajeAdvertencia = document.getElementById('warningMessage');
            mensajeAdvertencia.textContent = ''
            mensajeAdvertencia.textContent = data.message;
        } else if (data.type === 'expiracionDeCodigo') {
            // Mostrar mensaje de advertencia por código expirado
            showNotification(data.message);
            // Actualizar el mensaje de advertencia
            const mensajeAdvertencia = document.getElementById('warningMessage');
            mensajeAdvertencia.textContent = '' 
            mensajeAdvertencia.textContent = data.message
        } else {
            // Mostrar mensaje de éxito o continuar con el flujo normal
            showNotification('Registro completado correctamente.');
            // Ocultar el modal de verificación si está visible
            document.getElementById('codigoVerificacionModal').style.display = 'none';

            // Limpiar los campos y restablecer el formulario
            document.getElementById('verification_code_modal').value = '';
            document.getElementById('confirm_email_modal').value = '';
            const form = document.getElementById('formularioRegistro');
            form.reset();
        }

    } catch (error) {
        console.error('Error al verificar código de verificación:', error);
        // Mostrar mensaje de error usando la función showNotification
        showNotification(error.message);
    }
});


        // Cerrar modal de verificación
        document.getElementById('closeModal').addEventListener('click', () => { 
        document.getElementById('codigoVerificacionModal').style.display = 'none';    
        let verificationCode = document.getElementById('verification_code_modal').value;
        let verificacionEmail = document.getElementById('confirm_email_modal').value; 
        verificacionEmail = '';
        verificationCode  = ''

        });
