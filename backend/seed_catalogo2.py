"""Segunda ampliación del catálogo de demostración: rubros que la gente busca y no había (computadores,
motos, mariscos, comida saludable, clases, navidad…). Uso: python backend/seed_catalogo2.py > /tmp/seed2.json
y luego select public._cargar_catalogo('<json>'::jsonb) en Supabase."""
import json

CATS = [
    ("Computadores y oficina", "computadores", "💻", "producto", 31),
    ("Motos y bicicletas", "motos-bicis", "🏍️", "producto", 32),
    ("Mariscos y pescados", "mariscos", "🐟", "producto", 33),
    ("Comida saludable", "saludable", "🥗", "producto", 34),
    ("Comida mexicana", "mexicana", "🌮", "producto", 35),
    ("Perfumería", "perfumeria", "🧴", "producto", 36),
    ("Bebés y maternidad", "bebes", "🍼", "producto", 37),
    ("Clases y cursos", "clases", "🎓", "servicio", 38),
    ("Navidad y decoración", "navidad", "🎄", "producto", 39),
    ("Óptica", "optica", "👓", "servicio", 40),
    ("Ferretería", "ferreteria", "🔨", "producto", 41),
    ("Muebles", "muebles", "🛋️", "producto", 42),
    ("Turismo", "turismo", "🏞️", "servicio", 43),
    ("Diseño y marketing", "diseno", "🎨", "servicio", 44),
    ("Lavado de carros", "lavadero", "🚗", "servicio", 45),
]
C, A, AM, M, P, N, G, PE, PO, RC = ("Cumpleaños", "Aniversario", "Amor y Amistad", "Día de la Madre", "Día del Padre",
                                    "Navidad", "Grados", "Para ella", "Para él", "Regalo corporativo")
# nombre, slug, categoria, (nombre, apellido, usuario), barrio, color, descripcion, subcategorias, abre, cierra, domicilio, productos
# producto: nombre, p|s, precio, stock, por_encargo, ocasiones, etiquetas, descripcion
NEG = [
    ("TecnoPC Ocaña", "tecnopc-ocana", "computadores", ("Julián", "Pérez", "julian"), "Centro", "1F3A5F",
     "Venta de computadores portátiles y de escritorio, accesorios y servicio técnico con garantía.", ["Portátiles", "Accesorios", "Servicio técnico"], "08:00", "19:00", 5000, [
        ("Computador portátil 15\" Core i5, 16 GB", "p", 2450000, 6, False, [G, N, PO, PE], ["computador", "portatil", "laptop", "pc", "estudio", "trabajo"], "Portátil de 15,6\" con Intel Core i5, 16 GB de RAM y SSD de 512 GB. Ideal para universidad y oficina."),
        ("Portátil básico 14\" para estudiantes", "p", 1390000, 8, False, [G, N], ["computador", "portatil", "laptop", "pc", "estudiante", "colegio"], "Portátil de 14\" con 8 GB de RAM y 256 GB de SSD. Liviano y con batería para todo el día."),
        ("Computador de escritorio completo", "p", 1890000, 4, False, [RC], ["computador", "escritorio", "pc", "monitor", "oficina"], "Torre Core i3 con monitor de 22\", teclado y mouse. Listo para trabajar."),
        ("Mantenimiento y formateo de PC", "s", 70000, 30, False, [], ["mantenimiento", "formateo", "computador", "portatil", "virus", "lento"], "Limpieza interna, cambio de crema térmica, formateo e instalación de programas."),
        ("Mouse y teclado inalámbricos", "p", 85000, 25, False, [], ["mouse", "teclado", "inalambrico", "computador"], "Combo inalámbrico silencioso con receptor USB."),
        ("Monitor 24\" Full HD", "p", 520000, 7, False, [RC, PO], ["monitor", "pantalla", "computador", "oficina"], "Monitor IPS de 24\" con HDMI, ideal para trabajo y estudio."),
        ("Impresora multifuncional de tinta continua", "p", 780000, 5, False, [RC], ["impresora", "escaner", "tinta", "oficina"], "Imprime, copia y escanea. Sistema de tinta continua de fábrica."),
    ]),
    ("Taller de Motos El Rayo", "taller-motos-el-rayo", "motos-bicis", ("Wilmer", "Ortega", "wilmer"), "El Llano", "2B2B2B",
     "Mecánica de motos, repuestos, lubricantes y accesorios. Atención rápida.", ["Mecánica", "Repuestos", "Accesorios"], "07:00", "18:00", None, [
        ("Cambio de aceite de moto", "s", 38000, 50, False, [], ["moto", "aceite", "mantenimiento", "taller"], "Aceite 4T, revisión de filtros y graduación de cadena."),
        ("Mantenimiento general de moto", "s", 120000, 20, False, [], ["moto", "mantenimiento", "mecanico", "taller", "frenos"], "Revisión de frenos, carburación, eléctrico y ajuste general."),
        ("Casco certificado", "p", 210000, 15, False, [PO, C], ["casco", "moto", "seguridad"], "Casco integral con certificación DOT y visor antiempañante."),
        ("Kit de arrastre para moto", "p", 145000, 12, False, [], ["kit de arrastre", "cadena", "piñon", "moto", "repuesto"], "Cadena, piñón y corona para las referencias más comunes."),
        ("Lavado y polichado de moto", "s", 20000, 40, False, [], ["lavado", "moto", "polichado"], "Lavado completo con desengrasante y polichado."),
    ]),
    ("Bici Ocaña", "bici-ocana", "motos-bicis", ("Mateo", "Rincón", "mateob"), "La Primavera", "3E7B5E",
     "Bicicletas, repuestos y taller para ciclistas de ruta, montaña y ciudad.", ["Bicicletas", "Taller", "Accesorios"], "08:00", "19:00", 4000, [
        ("Bicicleta todoterreno rin 29", "p", 1350000, 5, False, [C, N, PO], ["bicicleta", "mtb", "montaña", "cicla", "deporte"], "Marco de aluminio, frenos de disco hidráulicos y 21 cambios."),
        ("Bicicleta para niño rin 16", "p", 420000, 8, False, [C, N], ["bicicleta", "niño", "cicla", "regalo"], "Con rueditas de apoyo y canasta. Para niños de 4 a 7 años."),
        ("Arreglo y mantenimiento de bicicleta", "s", 40000, 30, False, [], ["arreglo", "bicicleta", "mantenimiento", "taller", "cicla"], "Ajuste de cambios y frenos, lubricación y revisión general."),
        ("Casco y luces para ciclista", "p", 95000, 20, False, [C, PO], ["casco", "luces", "bicicleta", "seguridad"], "Casco ventilado con luz trasera recargable."),
    ]),
    ("Taquería La Catrina", "taqueria-la-catrina", "mexicana", ("Paula", "Jaime", "paulaj"), "Los Álamos", "B83227",
     "Comida mexicana hecha en Ocaña: tacos, burritos, nachos y quesadillas con salsas de la casa.", ["Tacos", "Burritos", "Nachos"], "12:00", "22:00", 4000, [
        ("Tacos al pastor x3", "p", 22000, 50, False, [], ["tacos", "mexicanos", "pastor", "comida mexicana"], "Tres tacos de cerdo al pastor con piña, cebolla, cilantro y salsa verde."),
        ("Burrito de carne asada", "p", 26000, 40, False, [], ["burrito", "mexicano", "carne", "comida mexicana"], "Tortilla de harina con carne asada, fríjol, arroz, guacamole y queso."),
        ("Nachos con todo para compartir", "p", 32000, 30, False, [C, AM], ["nachos", "compartir", "mexicano", "queso"], "Nachos con queso fundido, carne, pico de gallo, jalapeños y guacamole."),
        ("Quesadillas de pollo", "p", 21000, 40, False, [], ["quesadilla", "pollo", "mexicana"], "Dos quesadillas de pollo con queso derretido y crema agria."),
        ("Combo taquero para 4", "p", 75000, 15, False, [C, AM, A], ["tacos", "combo", "familia", "mexicano", "compartir"], "Doce tacos surtidos, nachos y cuatro bebidas."),
    ]),
    ("Mariscos El Puerto", "mariscos-el-puerto", "mariscos", ("Ramiro", "Vega", "ramiro"), "Santa Clara", "1E5F7A",
     "Pescados y mariscos frescos traídos de la costa. Almuerzos y platos a la carta.", ["Pescado", "Mariscos", "Ceviche"], "11:00", "21:00", 4000, [
        ("Mojarra frita con patacón", "p", 32000, 30, False, [], ["pescado", "pescado frito", "mojarra", "almuerzo", "patacon"], "Mojarra roja frita con arroz con coco, patacón y ensalada."),
        ("Cazuela de mariscos", "p", 45000, 20, False, [A, P], ["mariscos", "cazuela", "camaron", "sopa"], "Camarón, calamar, mejillón y pescado en crema de coco."),
        ("Ceviche de camarón", "p", 24000, 25, False, [], ["ceviche", "camaron", "mariscos", "entrada"], "Camarón en limón con salsa rosada, cebolla morada y galletas."),
        ("Arroz marinero para dos", "p", 62000, 15, False, [A, AM], ["arroz marinero", "mariscos", "pareja"], "Arroz con mariscos, patacón y limonada de coco."),
        ("Filete de salmón a la plancha", "p", 48000, 15, False, [], ["salmon", "pescado", "saludable"], "Con vegetales salteados y puré de papa."),
    ]),
    ("Verde Bocado", "verde-bocado", "saludable", ("Daniela", "Toro", "danielat"), "Torcoroma", "5A8F3A",
     "Comida vegana, saludable y postres sin azúcar. Planes de almuerzo semanal.", ["Vegano", "Saludable", "Sin azúcar"], "08:00", "18:00", 3000, [
        ("Hamburguesa vegana de garbanzo", "p", 24000, 30, False, [], ["vegana", "vegano", "hamburguesa", "saludable", "vegetariana"], "Medallón de garbanzo y quinua, pan integral y papas al horno."),
        ("Bowl saludable de quinua", "p", 22000, 30, False, [], ["bowl", "quinua", "saludable", "vegano", "ensalada"], "Quinua, aguacate, garbanzos, vegetales asados y aderezo de tahini."),
        ("Torta keto sin azúcar", "p", 68000, 6, True, [C, M], ["keto", "sin azucar", "torta", "diabetico", "saludable"], "Torta de almendras endulzada con eritritol. Para 10 porciones."),
        ("Plan semanal de almuerzos saludables", "s", 110000, 15, False, [], ["almuerzo", "saludable", "plan", "dieta", "vegano"], "Cinco almuerzos balanceados entregados de lunes a viernes."),
        ("Jugo verde detox", "p", 9000, 40, False, [], ["jugo verde", "detox", "saludable", "bebida"], "Espinaca, piña, pepino, manzana verde y jengibre."),
    ]),
    ("Perfumería Esencia", "perfumeria-esencia", "perfumeria", ("Karen", "Lázaro", "karen"), "Centro", "7A3E8E",
     "Perfumes originales de diseñador y fragancias inspiradas a buen precio.", ["Perfumes", "Splash", "Kits"], "09:00", "20:00", 3000, [
        ("Perfume original para mujer 100 ml", "p", 320000, 10, False, [M, AM, C, PE, A], ["perfume", "original", "mujer", "fragancia", "regalo"], "Fragancia floral de diseñador, sellada y con factura."),
        ("Perfume original para hombre 100 ml", "p", 340000, 10, False, [P, C, PO, A], ["perfume", "original", "hombre", "colonia", "regalo"], "Fragancia amaderada de diseñador, sellada y con factura."),
        ("Fragancia inspirada 50 ml", "p", 45000, 40, False, [AM, C], ["perfume", "inspirado", "fragancia", "economico"], "Inspirada en las fragancias más vendidas, con alta fijación."),
        ("Kit de regalo perfume + crema", "p", 120000, 15, False, [M, N, PE], ["kit", "perfume", "crema", "regalo"], "Perfume de 50 ml y crema corporal de la misma línea en caja de regalo."),
    ]),
    ("Bebé Mimos", "bebe-mimos", "bebes", ("Lorena", "Sanguino", "lorena"), "Villa Paraíso", "E39BB5",
     "Ropa para bebé, accesorios y regalos para baby shower.", ["Ropa de bebé", "Baby shower", "Accesorios"], "09:00", "19:00", 3000, [
        ("Set de ropa para bebé recién nacido", "p", 85000, 20, False, [C], ["ropa para bebe", "bebe", "recien nacido", "baby shower", "ajuar"], "Cinco piezas en algodón: bodies, pantalón, gorro y medias."),
        ("Pañalera con cambiador", "p", 135000, 10, False, [C], ["pañalera", "bebe", "baby shower", "maleta"], "Pañalera tipo morral con bolsillo térmico y cambiador."),
        ("Cobija de bebé personalizada", "p", 70000, 15, True, [C, N], ["cobija", "bebe", "personalizada", "nombre", "baby shower"], "Cobija suave con el nombre del bebé bordado."),
        ("Canasta de regalo para baby shower", "p", 160000, 8, True, [C], ["baby shower", "regalo", "bebe", "canasta"], "Ropa, juguete de apego, cremas y pañales en canasta decorada."),
    ]),
    ("Academia de Idiomas Hablemos", "academia-hablemos", "clases", ("Sandra", "Pacheco", "sandra"), "San Agustín", "234B8F",
     "Clases de inglés y francés para niños, jóvenes y adultos. Grupos pequeños y clases personalizadas.", ["Inglés", "Francés", "Preparación de exámenes"], "07:00", "21:00", None, [
        ("Curso de inglés mensual (grupal)", "s", 180000, 30, False, [], ["clases de ingles", "ingles", "curso", "idiomas"], "Ocho clases al mes en grupos de máximo ocho personas."),
        ("Clase de inglés personalizada", "s", 45000, 40, False, [], ["clases de ingles", "ingles", "tutor", "particular"], "Una hora uno a uno, presencial o virtual."),
        ("Curso de francés básico", "s", 200000, 15, False, [], ["frances", "curso", "idiomas"], "Ocho clases al mes para empezar desde cero."),
        ("Preparación para examen de inglés", "s", 350000, 10, False, [G], ["ingles", "examen", "preparacion", "universidad"], "Simulacros y estrategias para pruebas internacionales y de grado."),
    ]),
    ("Escuela de Música Do Re Mi", "musica-do-re-mi", "clases", ("Tomás", "Navarro", "tomas"), "Centro", "8B4F9E",
     "Clases de guitarra, piano, canto y batería para todas las edades.", ["Guitarra", "Piano", "Canto"], "09:00", "20:00", None, [
        ("Clases de guitarra (mes)", "s", 160000, 20, False, [C, N], ["clases de guitarra", "guitarra", "musica", "curso"], "Ocho clases al mes. Guitarra disponible para practicar en la escuela."),
        ("Clases de piano (mes)", "s", 180000, 15, False, [C, N], ["piano", "musica", "clases"], "Ocho clases al mes con método para principiantes."),
        ("Clases de canto (mes)", "s", 150000, 15, False, [], ["canto", "voz", "musica", "clases"], "Técnica vocal y repertorio, ocho clases al mes."),
        ("Bono de regalo: 4 clases de música", "p", 90000, 30, False, [C, N, AM], ["bono", "regalo", "musica", "clases"], "Para regalar: cuatro clases del instrumento que elija."),
    ]),
    ("Navidad Mágica Ocaña", "navidad-magica", "navidad", ("Gloria", "Amaya", "gloriaa"), "Centro", "A12A2A",
     "Decoración navideña para la casa y el negocio: árboles, luces, pesebres y coronas.", ["Árboles", "Luces", "Pesebres"], "09:00", "21:00", 5000, [
        ("Árbol de Navidad de 1,80 m", "p", 260000, 12, False, [N], ["arbol de navidad", "navidad", "decoracion navideña", "casa"], "Árbol frondoso con base metálica, fácil de armar."),
        ("Instalación de decoración navideña", "s", 250000, 10, False, [N], ["decoracion navideña", "instalacion", "casa", "negocio", "navidad"], "Decoramos tu casa o negocio con luces y adornos. Incluye montaje y desmonte."),
        ("Pesebre artesanal completo", "p", 180000, 10, False, [N], ["pesebre", "navidad", "artesanal", "decoracion navideña"], "Figuras en cerámica pintadas a mano, 15 piezas."),
        ("Corona navideña para puerta", "p", 65000, 20, False, [N], ["corona", "navidad", "puerta", "decoracion navideña"], "Corona de 40 cm con piñas, bayas y moño rojo."),
        ("Luces LED cálidas 10 m", "p", 35000, 40, False, [N], ["luces", "navidad", "led", "decoracion navideña"], "Instalación interior y exterior, ocho modos de luz."),
    ]),
    ("Óptica Visión Clara", "optica-vision-clara", "optica", ("Andrea", "Villamizar", "andrea"), "Centro", "2A8BB8",
     "Examen visual, gafas formuladas, gafas de sol y lentes de contacto.", ["Examen visual", "Monturas", "Lentes de contacto"], "08:00", "18:30", None, [
        ("Examen visual completo", "s", 30000, 40, False, [], ["examen visual", "optometria", "vista", "ojos"], "Valoración por optómetra con fórmula."),
        ("Gafas formuladas con antirreflejo", "p", 280000, 20, False, [], ["gafas", "lentes", "formula", "antirreflejo"], "Montura y lentes con antirreflejo y filtro de luz azul."),
        ("Gafas de sol polarizadas", "p", 150000, 20, False, [PO, PE, C], ["gafas de sol", "polarizadas", "lentes"], "Protección UV400, varios estilos."),
        ("Lentes de contacto (caja mensual)", "p", 95000, 30, False, [], ["lentes de contacto", "contacto", "ojos"], "Caja de seis lentes de uso mensual."),
    ]),
    ("Ferretería El Constructor", "ferreteria-el-constructor", "ferreteria", ("Hernán", "Quintero", "hernan"), "Bermejal", "C79A3B",
     "Herramientas, pinturas, plomería, electricidad y materiales de construcción.", ["Herramientas", "Pinturas", "Materiales"], "07:00", "18:00", 5000, [
        ("Taladro percutor inalámbrico", "p", 320000, 10, False, [P, PO], ["taladro", "herramienta", "inalambrico"], "Taladro de 20 V con dos baterías y maletín."),
        ("Galón de pintura para interiores", "p", 78000, 40, False, [], ["pintura", "galon", "pared", "interiores"], "Pintura lavable tipo 1, más de 30 colores."),
        ("Juego de herramientas 100 piezas", "p", 185000, 12, False, [P, PO, N], ["herramientas", "kit", "destornillador", "llaves"], "Llaves, destornilladores, alicates y puntas en maletín."),
        ("Bulto de cemento 50 kg", "p", 34000, 80, False, [], ["cemento", "construccion", "obra"], "Cemento gris de uso general, con domicilio en Ocaña."),
    ]),
    ("Muebles Roble y Pino", "muebles-roble-pino", "muebles", ("Óscar", "Pineda", "oscarp"), "El Carmen", "6B4A2B",
     "Muebles en madera hechos a la medida: salas, comedores, camas y closets.", ["Salas", "Comedores", "A la medida"], "08:00", "18:00", None, [
        ("Juego de sala tres puestos", "p", 1850000, 4, True, [], ["sala", "sofa", "muebles", "mueble"], "Sala en madera y tela antifluidos, fabricada en dos semanas."),
        ("Comedor de 4 puestos", "p", 1200000, 5, True, [], ["comedor", "mesa", "sillas", "muebles"], "Mesa y cuatro sillas en madera maciza."),
        ("Escritorio para estudio", "p", 380000, 8, False, [G], ["escritorio", "estudio", "mueble", "oficina"], "Escritorio con cajón y repisa, ideal para el computador."),
        ("Closet a la medida (metro)", "s", 650000, 10, True, [], ["closet", "a la medida", "muebles", "carpinteria"], "Precio por metro lineal, incluye instalación."),
    ]),
    ("Tours Ocaña Aventura", "tours-ocana-aventura", "turismo", ("Felipe", "Arévalo", "felipe"), "Centro", "3E8E7E",
     "Planes turísticos por la provincia de Ocaña: historia, naturaleza y gastronomía.", ["Tours", "Caminatas", "Planes"], "07:00", "19:00", None, [
        ("Tour histórico por Ocaña", "s", 45000, 25, False, [], ["tour", "turismo", "historia", "ocaña", "plan"], "Recorrido guiado de tres horas por el centro histórico y la Columna de Ricaurte."),
        ("Paseo a Playa de Belén", "s", 120000, 20, False, [A, AM], ["paseo", "playa de belen", "turismo", "plan", "estoraques"], "Día completo con transporte, guía y almuerzo típico."),
        ("Caminata ecológica", "s", 60000, 20, False, [], ["caminata", "senderismo", "naturaleza", "plan"], "Ruta de cinco horas con hidratación y guía certificado."),
        ("Plan romántico de fin de semana", "s", 480000, 6, False, [A, AM], ["plan", "pareja", "romantico", "turismo", "aniversario"], "Hospedaje campestre, cena y paseo para dos."),
    ]),
    ("Estudio Creativo Pixel", "estudio-pixel", "diseno", ("Natalia", "Bayona", "nataliab"), "La Piñuela", "E0A100",
     "Diseño de logos, páginas web, redes sociales e impresos para emprendedores.", ["Logos", "Páginas web", "Redes sociales"], "08:00", "18:00", None, [
        ("Diseño de logo profesional", "s", 250000, 10, False, [], ["logo", "diseño", "marca", "identidad"], "Tres propuestas, ajustes y entrega en todos los formatos."),
        ("Página web para negocio", "s", 900000, 5, False, [], ["pagina web", "sitio web", "diseño", "internet"], "Sitio de cinco secciones con dominio y hosting por un año."),
        ("Manejo de redes sociales (mes)", "s", 450000, 8, False, [], ["redes sociales", "community manager", "instagram", "publicidad"], "Doce publicaciones al mes con diseño y textos."),
        ("Tarjetas de presentación x 1000", "p", 120000, 20, False, [RC], ["tarjetas", "presentacion", "impresion", "diseño"], "Diseño e impresión a color en papel grueso."),
    ]),
    ("Lavadero Brillo Total", "lavadero-brillo-total", "lavadero", ("Edwin", "Coronel", "edwin"), "Cristo Rey", "1F1F2E",
     "Lavado de carros y motos, polichado y limpieza de cojinería.", ["Lavado", "Polichado", "Cojinería"], "07:00", "19:00", None, [
        ("Lavado completo de carro", "s", 35000, 40, False, [], ["lavado", "carro", "lavadero", "auto"], "Exterior, interior, aspirada y llantas."),
        ("Polichado y encerado", "s", 90000, 15, False, [], ["polichado", "encerado", "carro", "brillo"], "Corrige rayones leves y protege la pintura."),
        ("Lavado de cojinería", "s", 120000, 10, False, [], ["cojineria", "tapiceria", "carro", "limpieza"], "Lavado profundo de sillas y techo."),
    ]),
]


def datos():
    neg = []
    for i, (nom, slug, cat, (dn, da, dc), barrio, color, desc, subs, abre, cierra, dom, prods) in enumerate(NEG):
        neg.append([nom, slug, cat, dn, da, f"{dc}.{slug.split('-')[0]}@impulsa.demo", barrio, color, desc, subs, abre, cierra, dom,
                    f"5730055503{i:02d}", i % 3 == 0, 2015 + i % 10,
                    [[p[0], p[1], p[2], p[3], p[4], p[5], p[6], p[7]] for p in prods]])
    return {"cats": CATS, "neg": neg}


if __name__ == "__main__":
    print(json.dumps(datos(), ensure_ascii=False, separators=(",", ":")))
