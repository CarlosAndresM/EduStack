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


// Registrar Usuario una vez validado los datos:

document.addEventListener('DOMContentLoaded', (e) => {
    const registroForm = document.getElementById('registroUsuariosForm');
    const formularioRegistro = document.getElementById('formularioRegistro');

    registroForm.addEventListener('click', function(event) {
        event.preventDefault(); // Evitar el envío automático del formulario

        // Obtener valores de los campos
        const email = document.getElementById('floating_email').value;
        const password = document.getElementById('floating_password').value;
        const repeatPassword = document.getElementById('floating_repeat_password').value;
        const firstName = document.getElementById('floating_first_name').value;
        const lastName = document.getElementById('floating_last_name').value;
        const phone = document.getElementById('floating_phone').value;
        const company = document.getElementById('floating_company').value;
        const agreedTerms = document.getElementById('checkbox-1').checked;
        const promotionalOffers = document.getElementById('checkbox-2').checked;

        console.log('Valores de entrada:');
        console.log('Email:', email);
        console.log('Password:', password);
        console.log('Repeat Password:', repeatPassword);
        console.log('First Name:', firstName);
        console.log('Last Name:', lastName);
        console.log('Phone:', phone);
        console.log('Company:', company);
        console.log('Agreed Terms:', agreedTerms);
        console.log('Promotional Offers:', promotionalOffers);

        // Validación básica del email y password
        if (!email || !password || !repeatPassword || !firstName || !lastName || !phone || !company || !agreedTerms) {
            showNotification('Por favor completa todos los campos y acepta los términos y condiciones.');
            return;
        }

        if (password !== repeatPassword) {
            showNotification('Las contraseñas no coinciden.');
            return;
        }

        // Crear objeto con los datos a enviar en formato JSON
        const userData = {
            email: email,
            password: password,
            first_name: firstName,
            last_name: lastName,
            phone: phone,
            company: company,
            agreed_terms: agreedTerms,
            promotional_offers: promotionalOffers
        };

        // Enviar datos al servidor usando fetch y JSON
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
            return response.text();
        })
        .then(data => {
            console.log('Registro exitoso:', data);
            showNotification('Registro exitoso');
            formularioRegistro.reset();
            
            // Aquí podrías redirigir a otra página o realizar otra acción después del registro exitoso
        })
        .catch(error => {
            console.error('Error en el registro:', error);
            showNotification('Error en el registro. Por favor intenta nuevamente.');
        });
    });
});

  // Función para mostrar la notificación con mensaje específico
  function showNotification(message) {
    var notification = document.getElementById('notification');
    var notificationMessage = document.getElementById('notificationMessage');

    // Mostrar el mensaje en la notificación
    notificationMessage.textContent = message;

    // Añadir la clase 'show' para mostrar la notificación con animación
    notification.classList.add('show');

    // Ocultar la notificación después de 3 segundos (3000 milisegundos)
    setTimeout(function() {
        hideNotification();
    }, 3000);
}

// Función para ocultar la notificación
function hideNotification() {
    var notification = document.getElementById('notification');

    // Remover la clase 'show' para ocultar la notificación con animación
    notification.classList.remove('show');
}
 