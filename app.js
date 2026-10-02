// ===== Datos de demostración =====
const EMPRENDIMIENTOS = [
  {
    id: 1,
    nombre: "Dulce Tentación",
    categoria: "Repostería",
    zona: "Centro",
    emoji: "🧁",
    descripcion: "Pasteles, cupcakes y postres personalizados. Entregas a domicilio en Ocaña.",
    rating: 4.8,
    opiniones: 32,
    tags: ["pastel", "cumpleaños", "postre", "repostería", "dulce", "torta", "entrega"],
  },
  {
    id: 2,
    nombre: "Floristería El Jardín",
    categoria: "Floristería",
    zona: "Centro",
    emoji: "💐",
    descripcion: "Arreglos florales para toda ocasión. Ramos, coronas y decoración de eventos.",
    rating: 4.6,
    opiniones: 18,
    tags: ["flor", "arreglo", "ramo", "regalo", "mamá", "floral", "entrega"],
  },
  {
    id: 3,
    nombre: "TecnoFix Ocaña",
    categoria: "Tecnología",
    zona: "Centro",
    emoji: "📱",
    descripcion: "Reparación de celulares, tablets y laptops. Repuestos originales y servicio rápido.",
    rating: 4.7,
    opiniones: 45,
    tags: ["celular", "reparación", "teléfono", "pantalla", "técnico", "móvil"],
  },
  {
    id: 4,
    nombre: "Manos Creativas",
    categoria: "Artesanías",
    zona: "Barrio El Algodonal",
    emoji: "🎨",
    descripcion: "Regalos personalizados, manualidades y detalles hechos a mano para toda ocasión.",
    rating: 4.9,
    opiniones: 21,
    tags: ["regalo", "personalizado", "artesanía", "mamá", "detalle", "hecho a mano"],
  },
  {
    id: 5,
    nombre: "Panadería La Esperanza",
    categoria: "Panadería",
    zona: "Barrio Cristo Rey",
    emoji: "🥖",
    descripcion: "Pan fresco diario, pasteles y productos de panadería tradicional.",
    rating: 4.5,
    opiniones: 67,
    tags: ["pan", "pastel", "panadería", "cumpleaños", "fresco"],
  },
  {
    id: 6,
    nombre: "ServiHogar Express",
    categoria: "Servicios",
    zona: "Varios sectores",
    emoji: "🔧",
    descripcion: "Plomería, electricidad y reparaciones del hogar. Atención el mismo día.",
    rating: 4.4,
    opiniones: 29,
    tags: ["reparación", "plomería", "electricidad", "hogar", "servicio", "urgente"],
  },
  {
    id: 7,
    nombre: "Boutique Luna",
    categoria: "Moda",
    zona: "Centro",
    emoji: "👗",
    descripcion: "Ropa femenina, accesorios y regalos. Moda local a precios accesibles.",
    rating: 4.6,
    opiniones: 38,
    tags: ["ropa", "regalo", "moda", "mujer", "accesorio", "mamá"],
  },
  {
    id: 8,
    nombre: "Café Raíces",
    categoria: "Cafetería",
    zona: "Centro",
    emoji: "☕",
    descripcion: "Café de origen local, pastelería artesanal y espacio para reuniones.",
    rating: 4.8,
    opiniones: 54,
    tags: ["café", "postre", "reunión", "desayuno", "local"],
  },
];

// ===== Elementos del DOM =====
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const resultsSection = document.getElementById("results");
const resultsGrid = document.getElementById("resultsGrid");
const resultsQuery = document.getElementById("resultsQuery");
const menuToggle = document.getElementById("menuToggle");
const nav = document.getElementById("nav");
const btnEmprendedor = document.getElementById("btnEmprendedor");
const modal = document.getElementById("modalEmprendedor");
const modalBackdrop = document.getElementById("modalBackdrop");
const modalClose = document.getElementById("modalClose");
const modalOk = document.getElementById("modalOk");

// ===== Búsqueda simulada =====
function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function buscar(query) {
  const q = normalizar(query);
  if (!q.trim()) return [];

  const palabras = q.split(/\s+/).filter((p) => p.length > 2);

  const puntuados = EMPRENDIMIENTOS.map((emp) => {
    let score = 0;
    const texto = normalizar(
      `${emp.nombre} ${emp.categoria} ${emp.descripcion} ${emp.tags.join(" ")}`
    );

    palabras.forEach((p) => {
      if (texto.includes(p)) score += 2;
      emp.tags.forEach((tag) => {
        if (normalizar(tag).includes(p) || p.includes(normalizar(tag))) score += 3;
      });
    });

    // Bonus por coincidencia en nombre o categoría
    if (normalizar(emp.nombre).includes(q.slice(0, 6))) score += 5;
    if (normalizar(emp.categoria).includes(q.slice(0, 6))) score += 4;

    return { ...emp, score };
  });

  return puntuados
    .filter((e) => e.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
}

function renderResultados(items, query) {
  resultsQuery.textContent = `«${query}»`;
  resultsSection.hidden = false;

  if (items.length === 0) {
    resultsGrid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:2rem;color:var(--gray)">
        <p style="font-size:1.1rem;margin-bottom:0.5rem">No encontramos coincidencias exactas</p>
        <p style="font-size:0.9rem">Intenta con otras palabras o revisa los ejemplos de búsqueda.</p>
      </div>
    `;
    return;
  }

  resultsGrid.innerHTML = items
    .map(
      (emp) => `
    <article class="result-card">
      <div class="emoji">${emp.emoji}</div>
      <h3>${emp.nombre}</h3>
      <p class="cat">${emp.categoria} · ${emp.zona}</p>
      <p class="desc">${emp.descripcion}</p>
      <p class="rating">★★★★★ <span>${emp.rating} (${emp.opiniones} opiniones)</span></p>
      <a href="#" class="contact-btn" onclick="alert('En la versión completa se abriría WhatsApp o el medio de contacto del emprendedor.'); return false;">
        Contactar
      </a>
    </article>
  `
    )
    .join("");
}

function ejecutarBusqueda() {
  const query = searchInput.value.trim();
  if (!query) {
    searchInput.focus();
    return;
  }
  const resultados = buscar(query);
  renderResultados(resultados, query);
  resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ===== Eventos =====
searchBtn.addEventListener("click", ejecutarBusqueda);

searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") ejecutarBusqueda();
});

// Chips de ejemplo
document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    searchInput.value = chip.dataset.query;
    ejecutarBusqueda();
  });
});

// Menú móvil
menuToggle.addEventListener("click", () => {
  nav.classList.toggle("open");
});

// Cerrar menú al hacer clic en un enlace
nav.querySelectorAll("a").forEach((a) => {
  a.addEventListener("click", () => nav.classList.remove("open"));
});

// Modal emprendedor
function abrirModal() {
  modal.hidden = false;
  document.body.style.overflow = "hidden";
}
function cerrarModal() {
  modal.hidden = true;
  document.body.style.overflow = "";
}

btnEmprendedor.addEventListener("click", abrirModal);
modalClose.addEventListener("click", cerrarModal);
modalOk.addEventListener("click", cerrarModal);
modalBackdrop.addEventListener("click", cerrarModal);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !modal.hidden) cerrarModal();
});
