const API_URL = 'https://v2.jokeapi.dev/joke';
const numberInput = document.getElementById('number-input');
const cardJoke = document.getElementById('card-joke');
const favoritesContainer = document.getElementById('favorites'); // nuevo contenedor
const dropdown = document.getElementById('dropdown');
const dropdownButton = document.getElementById('dropdownDefault');

let selectedCategory = 'Any';
let favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];
let chistesGuardados = JSON.parse(localStorage.getItem('chistes')) || [];

// crea card DOM; si esFavorito true no muestra botón "Guardar"
function crearCard(joke, index, esFavorito = false) {
  const contenido = joke.type === 'single' ? joke.joke : `${joke.setup} — ${joke.delivery}`;

  const card = document.createElement('div');
  card.className = 'max-w-sm p-6 bg-white border border-gray-200 rounded-2xl shadow-lg dark:bg-gray-800 dark:border-gray-700 transition transform hover:scale-105 relative';
  card.dataset.jokeId = joke.id; // identificar fácilmente

  card.innerHTML = `
    <h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
      ${esFavorito ? '⭐ ' : ''}Chiste #${index + 1}
    </h5>
    <p class="mb-3 font-normal text-gray-700 dark:text-gray-400">${contenido}</p>
    <div class="flex gap-2">
      <button class="btn-eliminar inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-red-600 rounded-lg hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300">
        Eliminar
      </button>
      ${!esFavorito ? `<button class="btn-guardar inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-green-600 rounded-lg hover:bg-green-700 focus:ring-4 focus:outline-none focus:ring-green-300">
        Guardar
      </button>` : ''}
    </div>
  `;

  // eliminar card (se elimina del DOM y, si es favorito, de favoritos en storage)
  const btnEliminar = card.querySelector('.btn-eliminar');
  btnEliminar.addEventListener('click', () => {
    card.remove();
    if (esFavorito) {
      eliminarFavorito(joke);
      renderFavorites(); // actualizar UI de favoritos
    } else {
      // quitar del array de chistes guardados y storage
      chistesGuardados = chistesGuardados.filter(c => c.id !== joke.id);
      localStorage.setItem('chistes', JSON.stringify(chistesGuardados));
    }
  });

  // guardar: mover la card a favoritos, guardar en storage y actualizar UI
  const btnGuardar = card.querySelector('.btn-guardar');
  if (btnGuardar) {
    btnGuardar.addEventListener('click', () => {
      // evitar duplicados
      if (!favoritos.some(f => f.id === joke.id)) {
        favoritos.push(joke);
        localStorage.setItem('favoritos', JSON.stringify(favoritos));
      }
      // eliminar card del listado normal (si está ahí)
      card.remove();
      chistesGuardados = chistesGuardados.filter(c => c.id !== joke.id);
      localStorage.setItem('chistes', JSON.stringify(chistesGuardados));

      // renderizar inmediatamente la sección de favoritos
      renderFavorites();
    });
  }

  return card;
}

// guardar favorito (solo storage) -- ya usado en listener pero la dejamos por si se usa elsewhere
function guardarFavorito(joke) {
  if (!favoritos.some(f => f.id === joke.id)) {
    favoritos.push(joke);
    localStorage.setItem('favoritos', JSON.stringify(favoritos));
  }
}

function eliminarFavorito(joke) {
  favoritos = favoritos.filter(fav => fav.id !== joke.id);
  localStorage.setItem('favoritos', JSON.stringify(favoritos));
}

// renderiza chistes normales (limpia contenedor)
function renderChistes(jokes) {
  cardJoke.innerHTML = '';
  jokes.forEach((joke, i) => {
    const card = crearCard(joke, i, false);
    cardJoke.appendChild(card);
  });
}

// renderiza la sección de favoritos (limpia antes de pintar)
function renderFavorites() {
  favoritesContainer.innerHTML = ''; // importante: limpiar para evitar duplicados

  if (favoritos.length === 0) return; // sin favoritos, no mostramos nada

  // título opcional
  const title = document.createElement('h3');
  title.textContent = '⭐ Chistes guardados';
  title.className = 'col-span-full text-xl font-bold text-gray-800 dark:text-white mt-6';
  favoritesContainer.appendChild(title);

  favoritos.forEach((fav, i) => {
    const card = crearCard(fav, i, true);
    favoritesContainer.appendChild(card);
  });
}

// obtiene chistes (solo consulta API si no hay chistes guardados en storage)
function jokesList() {
  const amount = parseInt(numberInput?.value) || 5;

  if (chistesGuardados && chistesGuardados.length > 0) {
    renderChistes(chistesGuardados);
    renderFavorites();
    return;
  }

  const url = `${API_URL}/${selectedCategory}?amount=${amount}`;
  fetch(url)
    .then(res => res.json())
    .then(datos => {
      if (!datos) return;

      const jokes = datos.jokes || [datos];
      chistesGuardados = jokes;
      localStorage.setItem('chistes', JSON.stringify(chistesGuardados));

      renderChistes(jokes);
      renderFavorites();
    })
    .catch(err => console.error('Error al obtener chistes:', err));
}

// carga categorías (igual que antes)
function cargarCategorias() {
  const categorias = ["Any", "Programming", "Misc", "Dark", "Pun", "Spooky", "Christmas"];
  dropdown.innerHTML = `
    <h6 class="mb-3 text-sm font-medium text-gray-900 dark:text-white">Categoría</h6>
    <ul class="space-y-2">
      ${categorias.map(cat => `
        <li><button data-category="${cat}" class="categoria w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 dark:text-white">${cat}</button></li>
      `).join('')}
    </ul>
  `;
  dropdown.querySelectorAll('.categoria').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedCategory = btn.dataset.category;
      dropdownButton.textContent = `Categoría: ${selectedCategory}`;
      chistesGuardados = [];
      localStorage.removeItem('chistes');
      jokesList();
    });
  });
}

// manejar cambio en cantidad
numberInput.addEventListener('change', () => {
  const val = parseInt(numberInput.value);
  if (val >= 1 && val <= 10) {
    chistesGuardados = [];
    localStorage.removeItem('chistes');
    jokesList();
  }
});

// inicialización: cargar arrays desde storage y pintar
window.addEventListener('DOMContentLoaded', () => {
  favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];
  chistesGuardados = JSON.parse(localStorage.getItem('chistes')) || [];
  cargarCategorias();
  renderFavorites();
  jokesList();
});
