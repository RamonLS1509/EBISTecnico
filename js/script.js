//NOTA: SI ESTA EN INGLES LA API PUEDE MOSTRAR HASTA 10 CHISTES
//PERO SI ESTA EN ESPAÑOL SOLO PUEDE MOSTRAR 7

//VARIABLES GLOBALES

const API_URL = 'https://v2.jokeapi.dev/joke';

const numberInput = document.getElementById('number-input');
const cardJoke = document.getElementById('card-joke');
const favoritesContainer = document.getElementById('favorites');
const dropdown = document.getElementById('dropdown');
const categoriesButton = document.getElementById('categoriesButton');

let selectedCategory = 'Any';
let favoritos = JSON.parse(localStorage.getItem('favoritos'));
let chistesGuardados = JSON.parse(localStorage.getItem('chistes'));


//FUNCIONES DE DATOS Y API
 
// Obtiene y muestra los chistes
function jokesList() {
  const amount = parseInt(numberInput.value);
  const languaje = 'en';

  // Si hay chistes guardados, los muestra sin volver a llamar a la API
  if (chistesGuardados) {
    renderChistes(chistesGuardados);
    renderFavorites();
    return;
  }

  const url = `${API_URL}/${selectedCategory}?amount=${amount}&lang=${languaje}`;
  fetch(url)
    .then(res => res.json())
    .then(datos => {
      if (!datos) return;

      let jokes = datos.jokes;

      // Eliminar chistes duplicados basados en su ID
      jokes = filtrarDuplicados(jokes, chistesGuardados);

      chistesGuardados = jokes;
      localStorage.setItem('chistes', JSON.stringify(chistesGuardados));

      renderChistes(jokes);
      renderFavorites();
    })
    .catch(err => console.error('Error al obtener chistes:', err));
}

// Obtiene chistes adicionales cuando cambia la cantidad
async function obtenerMasChistes(cantidad) {
  const languaje = 'en';
  const url = `${API_URL}/${selectedCategory}?amount=${cantidad}&lang=${languaje}`;
  const res = await fetch(url);
  const data = await res.json();

  let nuevos = data.jokes ? data.jokes : [data];

  // Filtra duplicados respecto a los ya guardados
  nuevos = filtrarDuplicados(nuevos, chistesGuardados);

  // Si sigue habiendo menos chistes de los necesarios, volver a intentar
  while (nuevos.length < cantidad) {
    const faltan = cantidad - nuevos.length;
    const extra = await obtenerMasChistes(faltan);
    nuevos = filtrarDuplicados(nuevos.concat(extra), chistesGuardados);
  }

  return nuevos;
}

// 🆕 Función para eliminar duplicados por ID o texto
function filtrarDuplicados(nuevos, existentes) {
  const filtrados = [];

  for (let i = 0; i < nuevos.length; i++) {
    const chisteNuevo = nuevos[i];
    let repetido = false;

    for (let j = 0; j < existentes.length; j++) {
      const chisteExistente = existentes[j];

      // Compara por ID si existe
      if (chisteNuevo.id === chisteExistente.id) {
        repetido = true;
        break;
      }

      // Compara por texto del chiste
      const textoNuevo = chisteNuevo.type === 'single'
        ? chisteNuevo.joke
        : chisteNuevo.setup;

      const textoExistente = chisteExistente.type === 'single'
        ? chisteExistente.joke
        : chisteExistente.setup;

      if (textoNuevo === textoExistente) {
        repetido = true;
        break;
      }
    }

    // Si no está repetido, lo agregamos
    if (!repetido) {
      filtrados.push(chisteNuevo);
    }
  }

  return filtrados;
}

// =======================================================
// 💾 FUNCIONES DE ALMACENAMIENTO Y FAVORITOS
// =======================================================
function guardarFavorito(joke) {
  let existe = false;

  for (let i = 0; i < favoritos.length; i++) {
    const fav = favoritos[i];

    if (fav.id === joke.id) {
      existe = true;
      break; 
    }
  }
  if (!existe) {
    favoritos.push(joke);
    localStorage.setItem('favoritos', JSON.stringify(favoritos));
  }
}

function eliminarFavorito(joke) {
  favoritos = favoritos.filter(fav => fav.id !== joke.id);
  localStorage.setItem('favoritos', JSON.stringify(favoritos));
}

// =======================================================
// 🎨 RENDERIZADO DE ELEMENTOS EN PANTALLA
// =======================================================
function crearCard(joke, index, esFavorito = false) {
  const contenido =
    joke.type === 'single'
      ? joke.joke || 'No hay ningún chiste disponible'
      : joke.setup || 'No hay ningún chiste disponible';

  const card = document.createElement('div');
  card.className = `
    max-w-sm p-6 bg-white border border-gray-200 rounded-2xl shadow-lg 
    dark:bg-gray-800 dark:border-gray-700 transition transform hover:scale-105 relative
  `;
  card.dataset.jokeId = joke.id;

  card.innerHTML = `
    <h3 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
      Chiste #${index + 1}
    </h3>
    <p class="mb-3 font-normal text-gray-700 dark:text-gray-400">${contenido}</p>
    <div class="flex gap-2">

    `
    if(!esFavorito)
      card.innerHTML += `<button class="btn-guardar inline-flex items-center mr-2 px-3 py-2 text-sm font-medium text-center text-white bg-green-600 rounded-lg hover:bg-green-700 focus:ring-4 focus:outline-none focus:ring-green-300">
            Guardar
          </button>`
    
      card.innerHTML +=`<button class="btn-eliminar inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-red-600 rounded-lg hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300">
        Eliminar
      </button>
      
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

  const btnGuardar = card.querySelector('.btn-guardar');
  if (btnGuardar) {
  btnGuardar.addEventListener('click', () => {
    // Comprobar si el chiste ya está en favoritos
    let existe = false;

    // Si no existe, se guarda en favoritos
    if (!existe) {
      guardarFavorito(joke);
    }

    // Quita la tarjeta del listado de chistes normales
    card.remove();

    // Elimina el chiste del array de chistes guardados
    let nuevosChistes = [];
    for (let i = 0; i < chistesGuardados.length; i++) {
      if (chistesGuardados[i].id !== joke.id) {
        nuevosChistes.push(chistesGuardados[i]);
      }
    }
    chistesGuardados = nuevosChistes;

    // Guarda los cambios en localStorage
    localStorage.setItem('chistes', JSON.stringify(chistesGuardados));

    // Vuelve a mostrar los favoritos actualizados
    renderFavorites();
  });
}

  return card;
}

//Funcion para mostrar las bromas por pantalla en cards
function renderChistes(jokes) {
  cardJoke.innerHTML = '';
  jokes.forEach((joke, i) => {
    const card = crearCard(joke, i, false);
    cardJoke.appendChild(card);
  });
}

//Funcion para mostrar las bromas favoritas por pantalla en cards
function renderFavorites() {
  favoritesContainer.innerHTML = '';

  if (favoritos.length === 0) return;

  const title = document.createElement('h3');
  title.textContent = 'Chistes guardados';
  title.className = 'col-span-full text-3xl font-bold text-gray-800 dark:text mt-6';
  favoritesContainer.appendChild(title);

  favoritos.forEach((fav, i) => {
    const card = crearCard(fav, i, true);
    favoritesContainer.appendChild(card);
  });
}

// =======================================================
// 🗂️ CATEGORÍAS
// =======================================================
function cargarCategorias() {
  const categorias = ['Any', 'Programming', 'Misc', 'Dark', 'Pun', 'Spooky', 'Christmas'];

  dropdown.innerHTML = `
    <ul class="space-y-2">
      ${categorias
      .map(
        cat => `
        <li>
          <button 
            data-category="${cat}" 
            class="categoria w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 dark:text-white
              ${cat === selectedCategory ? 'bg-blue-600 text-white' : ''}">
            ${cat}
          </button>
        </li>
      `
      )
      .join('')}
    </ul>
  `;

  dropdown.querySelectorAll('.categoria').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedCategory = btn.dataset.category;
      categoriesButton.textContent = `Categoría: ${selectedCategory}`;

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
numberInput.addEventListener('change', async () => {
  const val = parseInt(numberInput.value);

  if (val >= 1 && val <= 10) {
    const cantidadActual = chistesGuardados.length;

    if (val > cantidadActual) {
      const cantidadExtra = val - cantidadActual;
      const nuevosChistes = await obtenerMasChistes(cantidadExtra);
      chistesGuardados = chistesGuardados.concat(nuevosChistes);

      localStorage.setItem('chistes', JSON.stringify(chistesGuardados));
      renderChistes(chistesGuardados);
    }

    if (val < cantidadActual) {
      chistesGuardados.splice(val);
      localStorage.setItem('chistes', JSON.stringify(chistesGuardados));
      renderChistes(chistesGuardados);
    }
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
    categoriesButton.textContent = `Categoría: ${selectedCategory}`;
  }

  cargarCategorias();
  renderFavorites();
  jokesList();
});
