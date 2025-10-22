// NOTA: PARA EL LENGUAJE INGLES SE PUEDEN MOSTRAR 10 CHISTESç
// PERO PARA EL LENGUAJE ESPAÑOL SOLO SE PUEDEN MOSTRAR HASTA 6

// =======================================================
// 🔧 CONFIGURACIÓN INICIAL Y VARIABLES GLOBALES
// =======================================================
const API_URL = 'https://v2.jokeapi.dev/joke';

const numberInput = document.getElementById('number-input');
const cardJoke = document.getElementById('card-joke');
const favoritesContainer = document.getElementById('favorites');
const dropdown = document.getElementById('dropdown');
const dropdownButton = document.getElementById('dropdownDefault');

let selectedCategory = 'Any';
let favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];
let chistesGuardados = JSON.parse(localStorage.getItem('chistes')) || [];


// =======================================================
// 🌐 FUNCIONES DE DATOS Y API
// =======================================================

// Obtiene y muestra los chistes
function jokesList() {
  const amount = parseInt(numberInput?.value) || 5;
  const languaje = 'en';
  // Si hay chistes guardados, los muestra sin volver a llamar a la API
  if (chistesGuardados && chistesGuardados.length > 0) {
    renderChistes(chistesGuardados);
    renderFavorites();
    return;
  }

  const url = `${API_URL}/${selectedCategory}?amount=${amount}&lang=${languaje}`;
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

// =======================================================
//  Crea una tarjeta de chiste (favorito o normal)
// =======================================================
function crearCard(joke, index, esFavorito = false) {
  const contenido = joke.type === 'single'
    ? (joke.joke || 'No hay ningún chiste disponible')
    : `${joke.setup || 'No hay ningún chiste disponible'}`;

  const card = document.createElement('div');
  card.className = `
    max-w-sm p-6 bg-white border border-gray-200 rounded-2xl shadow-lg 
    dark:bg-gray-800 dark:border-gray-700 transition transform hover:scale-105 relative
  `;
  card.dataset.jokeId = joke.id;

  card.innerHTML = `
    <h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
      Chiste #${index + 1}
    </h5>
    <p class="mb-3 font-normal text-gray-700 dark:text-gray-400">${contenido}</p>
    <div class="flex gap-2">
      <button class="btn-eliminar inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-red-600 rounded-lg hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300">
        Eliminar
      </button>
      ${!esFavorito
      ? `<button class="btn-guardar inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-green-600 rounded-lg hover:bg-green-700 focus:ring-4 focus:outline-none focus:ring-green-300">
            Guardar
          </button>`
      : ''}
    </div>
  `;

  // Función eliminar chiste
  card.querySelector('.btn-eliminar').addEventListener('click', () => {
    card.remove();

    if (esFavorito) {
      eliminarFavorito(joke);
      renderFavorites();
    } else {
      chistesGuardados = chistesGuardados.filter(c => c.id !== joke.id);
      localStorage.setItem('chistes', JSON.stringify(chistesGuardados));
    }
  });


  // Botón guardar (solo si no es favorito)
  const btnGuardar = card.querySelector('.btn-guardar');
  if (btnGuardar) {
    btnGuardar.addEventListener('click', () => {
      if (!favoritos.some(f => f.id === joke.id)) {
        guardarFavorito(joke);
      }

      // Quita del listado normal y actualiza almacenamiento
      card.remove();
      chistesGuardados = chistesGuardados.filter(c => c.id !== joke.id);
      localStorage.setItem('chistes', JSON.stringify(chistesGuardados));

      renderFavorites();
    });
  }
  return card;
}

// Renderiza los chistes normales
function renderChistes(jokes) {
  cardJoke.innerHTML = '';
  jokes.forEach((joke, i) => {
    const card = crearCard(joke, i, false);
    cardJoke.appendChild(card);
  });
}

// Renderiza la sección de favoritos
function renderFavorites() {
  favoritesContainer.innerHTML = '';

  if (favoritos.length === 0) return;

  const title = document.createElement('h3');
  title.textContent = 'Chistes guardados';
  title.className = 'col-span-full text-xl font-bold text-gray-800 dark:text mt-6';
  favoritesContainer.appendChild(title);

  favoritos.forEach((fav, i) => {
    const card = crearCard(fav, i, true);
    favoritesContainer.appendChild(card);
  });
}

// Guarda un chiste en favoritos si no existe
function guardarFavorito(joke) {
  if (!favoritos.some(f => f.id === joke.id)) {
    favoritos.push(joke);
    localStorage.setItem('favoritos', JSON.stringify(favoritos));
  }
}

// Elimina un chiste de favoritos
function eliminarFavorito(joke) {
  favoritos = favoritos.filter(fav => fav.id !== joke.id);
  localStorage.setItem('favoritos', JSON.stringify(favoritos));
}

// Carga las categorías en el dropdown
function cargarCategorias() {
  const categorias = ["Any", "Programming", "Misc", "Dark", "Pun", "Spooky", "Christmas"];

  dropdown.innerHTML = `
    <ul class="space-y-2">
      ${categorias.map(cat => `
        <li>
          <button 
            data-category="${cat}" 
            class="categoria w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 dark:text-white
              ${cat === selectedCategory ? 'bg-blue-600 text-white' : ''}">
            ${cat}
          </button>
        </li>
      `).join('')}
    </ul>
  `;

  dropdown.querySelectorAll('.categoria').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedCategory = btn.dataset.category;
      dropdownButton.textContent = `Categoria: ${selectedCategory}`;

      // Guardar selección
      localStorage.setItem('categoriaSeleccionada', selectedCategory);

      chistesGuardados = [];
      localStorage.removeItem('chistes');
      jokesList();
    });
  });
}


// =======================================================
// 🎛️ EVENT LISTENERS
// =======================================================
// Cambiar cantidad de chistes
numberInput.addEventListener('change', () => {
  const val = parseInt(numberInput.value);
  if (val >= 1 && val <= 10) {
    chistesGuardados = [];
    localStorage.removeItem('chistes');
    jokesList();
  }
});

// =======================================================
// 🚀 INICIALIZACIÓN
// =======================================================
window.addEventListener('DOMContentLoaded', () => {
  favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];
  chistesGuardados = JSON.parse(localStorage.getItem('chistes')) || [];

  const categoriaGuardada = localStorage.getItem('categoriaSeleccionada');
  if (categoriaGuardada) {
    selectedCategory = categoriaGuardada;
    dropdownButton.textContent = `Categoría: ${selectedCategory}`;
  }

  cargarCategorias();
  renderFavorites();
  jokesList();
});