document.addEventListener('DOMContentLoaded', function () {
    const button = document.getElementById('userDropdown');
    const menu = document.getElementById('dropdown-user');
    const Bandeja = document.getElementById('Bandeja');
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


  Bandeja.addEventListener('click', function () {
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


  