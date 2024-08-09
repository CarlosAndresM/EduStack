
// EndPoint para dirigir al perfil del usuario:
const profileUserLink = document.getElementById('profileUserLink');

profileUserLink.addEventListener('click', (e) => {
    e.preventDefault(); // Prevenir el evento de navegación por defecto

    const username = document.getElementById('usernameprofile').innerText.trim(); // Obtén el nombre de usuario
    window.location.href = `/${username}`; // Redirige a la ruta dinámica basada en el nombre de usuario
});


document.addEventListener('DOMContentLoaded', function () {
    const button = document.getElementById('userDropdown');
    const menu = document.getElementById('dropdown-user');
    
    button.addEventListener('click', function () {
      const isExpanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', !isExpanded);
      menu.classList.toggle('hidden');
    });
  
    document.addEventListener('click', function (event) {
      if (!button.contains(event.target) && !menu.contains(event.target)) {
        menu.classList.add('hidden');
        button.setAttribute('aria-expanded', 'false');
      }
    });
  });

  document.addEventListener('DOMContentLoaded', function () {
    const Bandeja = document.getElementById('Bandeja');
    const chats = document.getElementById('chats');
    
    Bandeja.addEventListener('click', function () {
      const isExpanded = Bandeja.getAttribute('aria-expanded') === 'true';
      Bandeja.setAttribute('aria-expanded', !isExpanded);
      chats.classList.toggle('hidden');
    });
  
    document.addEventListener('click', function (event) {
      if (!Bandeja.contains(event.target) && !chats.contains(event.target)) {
        chats.classList.add('hidden');
        Bandeja.setAttribute('aria-expanded', 'false');
      }
    });
  });

  document.addEventListener('DOMContentLoaded', function () {
    const Notificaciones = document.getElementById('Notificaciones');
    const BandejaDeNotificaciones = document.getElementById('BandejaDeNotificaiones');
    
    Notificaciones.addEventListener('click', function () {
      const isExpanded =Notificaciones.getAttribute('aria-expanded') === 'true';
      Notificaciones.setAttribute('aria-expanded', !isExpanded);
      BandejaDeNotificaciones.classList.toggle('hidden');
    });
  
    document.addEventListener('click', function (event) {
      if (!Notificaciones.contains(event.target) && !BandejaDeNotificaciones.contains(event.target)) {
        BandejaDeNotificaciones.classList.add('hidden');
        Notificaciones.setAttribute('aria-expanded', 'false');
      }
    });
  });

  document.addEventListener('DOMContentLoaded', function() {
   
    const spans = document.querySelectorAll('span');

    function checkWindowSize() {
        if (window.innerWidth < 660) {
            spans.forEach(span => span.classList.add('hidden'));
        } else {
            spans.forEach(span => span.classList.remove('hidden'));
        }
    }

    
    checkWindowSize();

    window.addEventListener('resize', checkWindowSize);
});



document.addEventListener('DOMContentLoaded', () => {
  const signOutButton = document.getElementById('signOut');

  if (signOutButton) {
      signOutButton.addEventListener('click', () => {
          fetch('/logout', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
          })
          .then(response => {
              if (!response.ok) {
                  throw new Error('Error al cerrar sesión');
              }
              return response.json();
          })
          .then(data => {
              if (data.message === 'Cierre de sesión exitoso') {
                  window.location.href = '/'; // Redirigir a la página de inicio o login
              } else {
                  alert('Error al cerrar sesión: ' + data.message);
              }
          })
          .catch(error => {
              console.error('Error durante el cierre de sesión:', error);
              alert('Ocurrió un error al cerrar sesión. Inténtelo de nuevo.');
          });
      });
  }
});
