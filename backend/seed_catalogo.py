"""Genera el SQL que amplía el catálogo de demostración (categorías, negocios y productos).

Uso: python backend/seed_catalogo.py > /tmp/seed.sql
Cada negocio queda con su propia cuenta de emprendedor (correo @impulsa.demo, contraseña aleatoria).
"""
import json

CATS = [  # nombre, slug, emoji, tipo, orden
    ("Comidas rápidas", "comidas-rapidas", "🍔", "producto", 15),
    ("Cervezas y licores", "cervezas-licores", "🍺", "producto", 16),
    ("Panadería", "panaderia", "🥖", "producto", 17),
    ("Frutas y mercado", "frutas-mercado", "🍎", "producto", 18),
    ("Heladería y postres", "heladeria", "🍦", "producto", 19),
    ("Comida típica", "comida-tipica", "🫔", "producto", 20),
    ("Deportes y gimnasio", "deportes", "🏋️", "servicio", 21),
    ("Papelería", "papeleria", "📚", "producto", 22),
    ("Fotografía y eventos", "eventos", "📸", "servicio", 23),
    ("Servicios del hogar", "servicios-hogar", "🔧", "servicio", 24),
    ("Salud y bienestar", "bienestar", "💆", "servicio", 25),
    ("Juguetes y niños", "juguetes", "🧩", "producto", 26),
    ("Calzado", "calzado", "👟", "producto", 27),
    ("Joyería y bisutería", "joyeria", "💍", "producto", 28),
    ("Lavandería", "lavanderia", "🧺", "servicio", 29),
    ("Veterinaria", "veterinaria", "🩺", "servicio", 30),
]

C, A, AM, M, P, N, H, G, PE, PO, RC = ("Cumpleaños", "Aniversario", "Amor y Amistad", "Día de la Madre", "Día del Padre",
                                       "Navidad", "Halloween", "Grados", "Para ella", "Para él", "Regalo corporativo")

# negocio: (nombre, slug, categoria_slug, dueño (nombre, apellido, correo), barrio, color, descripcion, subcategorias,
#           abre, cierra, domicilio, productos)
# producto: (nombre, tipo, precio, stock, por_encargo, ocasiones, etiquetas, descripcion)
NEG = [
    ("Empanadas La Ocañerita", "empanadas-la-ocanerita", "comidas-rapidas", ("Yeimy", "Carrascal", "yeimy"), "Santa Clara", "C8431B",
     "Empanadas de maíz crocantes, pasteles y fritos hechos cada mañana. Pedidos para reuniones y oficinas.",
     ["Empanadas", "Fritos", "Pasabocas"], "06:00", "20:00", 3000, [
        ("Empanada de carne", "producto", 2000, 120, False, [], ["empanada", "empanadas", "carne", "frito", "maiz", "desayuno", "comida"], "Empanada de maíz rellena de carne desmechada y papa, con ají casero."),
        ("Empanada de pollo", "producto", 2000, 100, False, [], ["empanada", "empanadas", "pollo", "frito", "comida"], "Masa de maíz amarillo, relleno de pollo guisado y arroz."),
        ("Combo 20 empanadas para reunión", "producto", 36000, 20, False, [C, RC, G], ["empanadas", "combo", "reunion", "fiesta", "pasabocas", "oficina"], "Veinte empanadas surtidas con dos ajíes y limón. Ideal para reuniones y oficinas."),
        ("Pastel de pollo hojaldrado", "producto", 3500, 40, False, [], ["pastel", "pollo", "hojaldre", "horneado", "merienda"], "Pastel de hojaldre relleno de pollo y verduras."),
        ("Papa rellena", "producto", 3500, 50, False, [], ["papa rellena", "frito", "carne", "huevo"], "Papa criolla rellena de carne, arroz y huevo."),
        ("Bandeja de pasabocas fritos (50 und)", "producto", 55000, 8, True, [C, G, RC], ["pasabocas", "deditos", "empanaditas", "fiesta", "picada"], "Cincuenta mini fritos: deditos de queso, empanaditas y bolitas de yuca."),
        ("Avena casera fría", "producto", 3000, 30, False, [], ["avena", "bebida", "desayuno"], "Avena en leche con canela, servida bien fría."),
    ]),
    ("Burger Point Ocaña", "burger-point-ocana", "comidas-rapidas", ("Andrés", "Ropero", "andres"), "La Primavera", "16120F",
     "Hamburguesas al carbón, perros, salchipapas y pizza. Domicilios hasta las 11 de la noche.",
     ["Hamburguesas", "Pizza", "Perros calientes"], "16:00", "23:00", 3000, [
        ("Hamburguesa clásica al carbón", "producto", 18000, 60, False, [], ["hamburguesa", "carne", "comida rapida", "papas"], "Carne de res de 150 g al carbón, queso, tocineta y papas a la francesa."),
        ("Hamburguesa doble carne", "producto", 26000, 40, False, [], ["hamburguesa", "doble", "carne", "comida rapida"], "Dos carnes, doble queso cheddar, cebolla caramelizada y salsa de la casa."),
        ("Perro caliente especial", "producto", 12000, 60, False, [], ["perro caliente", "salchicha", "comida rapida"], "Salchicha americana, ripio de papa, queso gratinado y salsas."),
        ("Salchipapa familiar", "producto", 28000, 30, False, [], ["salchipapa", "papas", "salchicha", "compartir"], "Para tres personas, con salchicha, queso, huevos de codorniz y salsas."),
        ("Pizza familiar hawaiana", "producto", 42000, 25, False, [C], ["pizza", "hawaiana", "familiar", "jamon", "piña"], "Pizza de 8 porciones con jamón, piña y doble queso mozzarella."),
        ("Pizza personal de pepperoni", "producto", 15000, 40, False, [], ["pizza", "pepperoni", "personal"], "Pizza de 4 porciones con pepperoni y mozzarella."),
        ("Alitas BBQ x 12", "producto", 32000, 30, False, [], ["alitas", "pollo", "bbq", "picante", "compartir"], "Doce alitas bañadas en BBQ o picante, con papas y aderezo."),
    ]),
    ("Asadero El Carbón", "asadero-el-carbon", "comidas-rapidas", ("Diego", "Pacheco", "diego"), "El Llano", "8A3B12",
     "Pollo asado, carnes a la parrilla y picadas para compartir en familia.",
     ["Pollo asado", "Parrilla", "Picadas"], "11:00", "22:00", 4000, [
        ("Pollo asado entero", "producto", 38000, 30, False, [], ["pollo asado", "pollo", "almuerzo", "familia"], "Pollo entero asado al carbón con papa salada, arepa y ensalada."),
        ("Medio pollo asado", "producto", 21000, 40, False, [], ["pollo asado", "pollo", "almuerzo"], "Medio pollo al carbón con papa, arepa y guacamole."),
        ("Picada para 4 personas", "producto", 65000, 15, False, [C, P, A], ["picada", "carne", "chorizo", "chicharron", "compartir", "parrilla"], "Carne de res, cerdo, chorizo, chicharrón, morcilla, papa criolla y arepa."),
        ("Costillas de cerdo BBQ", "producto", 32000, 20, False, [P], ["costillas", "cerdo", "bbq", "parrilla"], "Media libra de costilla ahumada con salsa BBQ y papas."),
        ("Churrasco 350 g", "producto", 36000, 20, False, [P, A], ["churrasco", "carne", "res", "parrilla", "almuerzo"], "Corte de res a la parrilla con chimichurri, papa y ensalada."),
        ("Almuerzo ejecutivo", "producto", 15000, 50, False, [], ["almuerzo", "corrientazo", "sopa", "seco", "comida casera"], "Sopa del día, seco con proteína a elección, jugo natural y postre."),
    ]),
    ("Cervecería Artesanal Hacaritama", "cerveceria-hacaritama", "cervezas-licores", ("Camilo", "Quintero", "camilo"), "Centro", "B7791F",
     "Cerveza artesanal hecha en Ocaña con malta y lúpulo importados. Solo para mayores de 18 años.",
     ["Cerveza artesanal", "Degustaciones"], "15:00", "23:00", 5000, [
        ("Cerveza artesanal rubia 330 ml", "producto", 9000, 80, False, [P], ["cerveza", "artesanal", "rubia", "ale", "licor"], "Golden ale suave y refrescante, 4,8 % de alcohol."),
        ("Cerveza artesanal roja 330 ml", "producto", 9500, 70, False, [P], ["cerveza", "artesanal", "roja", "licor"], "Red ale con notas de caramelo, 5,5 % de alcohol."),
        ("Cerveza artesanal negra 330 ml", "producto", 10000, 50, False, [P], ["cerveza", "artesanal", "negra", "stout", "licor"], "Stout con aroma a café y chocolate, 6 % de alcohol."),
        ("Six pack artesanal surtido", "producto", 52000, 25, False, [P, C, AM, N, PO], ["cerveza", "six pack", "regalo", "artesanal", "licor"], "Seis botellas de nuestras tres variedades en caja de regalo."),
        ("Kit degustación + vaso grabado", "producto", 68000, 12, False, [P, C, A, PO], ["cerveza", "kit", "vaso", "regalo", "personalizado"], "Cuatro cervezas, vaso con nombre grabado y tabla de maridaje."),
        ("Growler de 1 litro (recarga)", "producto", 22000, 40, False, [], ["cerveza", "growler", "barril", "artesanal"], "Recarga de cerveza fresca de barril en botella de un litro."),
    ]),
    ("Licores El Brindis", "licores-el-brindis", "cervezas-licores", ("Natalia", "Ascanio", "natalia"), "Cristo Rey", "6B1F3A",
     "Licorera con domicilio: cerveza fría, aguardiente, ron, vinos y anchetas. Venta solo a mayores de edad.",
     ["Cerveza", "Aguardiente", "Vinos", "Anchetas"], "10:00", "02:00", 3000, [
        ("Six pack de cerveza nacional fría", "producto", 21000, 100, False, [], ["cerveza", "six pack", "poker", "aguila", "fria", "licor"], "Seis latas de cerveza nacional bien frías, con domicilio."),
        ("Canasta de cerveza (30 und)", "producto", 85000, 30, False, [C, N], ["cerveza", "canasta", "fiesta", "licor"], "Treinta botellas de cerveza nacional, envase retornable."),
        ("Aguardiente Antioqueño 750 ml", "producto", 48000, 60, False, [C, N, G], ["aguardiente", "guaro", "licor", "fiesta"], "Botella de aguardiente tradicional o sin azúcar."),
        ("Ron Medellín 3 años 750 ml", "producto", 52000, 40, False, [N, P, PO], ["ron", "licor", "fiesta"], "Ron añejo colombiano de tres años."),
        ("Vino tinto chileno", "producto", 45000, 35, False, [A, M, AM, PE, RC], ["vino", "tinto", "cena", "regalo", "licor"], "Cabernet sauvignon chileno de 750 ml."),
        ("Ancheta de vinos y quesos", "producto", 135000, 10, True, [N, A, RC, M], ["ancheta", "vino", "quesos", "regalo", "navidad"], "Dos vinos, quesos madurados, uvas pasas, galletas y chocolates en caja de madera."),
        ("Bolsa de hielo 5 kg", "producto", 6000, 80, False, [], ["hielo", "fiesta"], "Hielo en cubos para tu reunión."),
    ]),
    ("Panadería La Espiga", "panaderia-la-espiga", "panaderia", ("Laura", "Sanjuán", "lauras"), "San Agustín", "C79A3B",
     "Pan horneado tres veces al día. Almojábanas, pan de queso, roscones y tortas por encargo.",
     ["Pan", "Almojábanas", "Galletería"], "05:30", "21:00", 2000, [
        ("Almojábana", "producto", 2000, 120, False, [], ["almojabana", "pan", "queso", "desayuno", "panaderia"], "Almojábana de cuajada recién horneada."),
        ("Pan de queso x 6", "producto", 6000, 80, False, [], ["pan de queso", "pan", "queso", "desayuno"], "Seis panes de queso esponjosos."),
        ("Pan tajado integral", "producto", 7500, 40, False, [], ["pan tajado", "integral", "pan", "sandwich"], "Pan de molde integral sin conservantes, 500 g."),
        ("Roscón de arequipe", "producto", 4500, 50, False, [], ["roscon", "arequipe", "pan dulce", "merienda"], "Roscón relleno de arequipe con azúcar por encima."),
        ("Croissant de jamón y queso", "producto", 5500, 40, False, [], ["croissant", "jamon", "queso", "desayuno"], "Croissant de mantequilla relleno de jamón y queso."),
        ("Desayuno sorpresa con pan artesanal", "producto", 65000, 10, True, [C, M, AM, PE, PO, A], ["desayuno sorpresa", "regalo", "pan", "cumpleaños"], "Bandeja con pan artesanal, frutas, jugo, café, huevos y un globo."),
        ("Galletas de mantequilla (caja x 24)", "producto", 18000, 30, False, [N, RC], ["galletas", "mantequilla", "caja", "regalo"], "Galletas danesas caseras en caja metálica."),
    ]),
    ("Frutas y Mercado Doña Carmen", "frutas-dona-carmen", "frutas-mercado", ("Carmen", "Pérez", "carmen"), "Mercado Público", "3E7B5E",
     "Frutas, verduras y productos campesinos de la provincia de Ocaña, con domicilio.",
     ["Frutas", "Verduras", "Productos campesinos"], "05:00", "18:00", 2000, [
        ("Canasta de frutas para regalo", "producto", 60000, 12, True, [C, M, AM, PE, N], ["canasta", "frutas", "regalo", "saludable", "ancheta"], "Fresas, uvas, manzanas, kiwi y piña en canasta de mimbre con moño."),
        ("Vaso de frutas picadas", "producto", 6000, 40, False, [], ["frutas picadas", "salpicon", "fruta", "saludable"], "Papaya, mango, piña, banano y fresa con miel o leche condensada."),
        ("Jugo natural 16 oz", "producto", 5000, 60, False, [], ["jugo", "natural", "fruta", "bebida"], "Mora, lulo, maracuyá, guanábana o mango, en agua o en leche."),
        ("Mercado semanal de verduras", "producto", 45000, 20, False, [], ["mercado", "verduras", "hortalizas", "cebolla ocañera", "comida"], "Papa, tomate, cebolla ocañera, zanahoria, plátano, yuca y aguacate para una semana."),
        ("Huevos campesinos x 30", "producto", 18000, 30, False, [], ["huevos", "campesinos", "mercado"], "Bandeja de treinta huevos de gallina criolla."),
        ("Queso costeño 1 libra", "producto", 12000, 25, False, [], ["queso", "costeño", "lacteos", "mercado"], "Queso salado fresco de finca."),
        ("Arepas de maíz pelado x 10", "producto", 8000, 40, False, [], ["arepas", "maiz", "desayuno"], "Arepas de maíz pelado hechas a mano."),
    ]),
    ("Heladería Polo Norte", "heladeria-polo-norte", "heladeria", ("Valentina", "Lobo", "valentina"), "Centro", "3B7EA1",
     "Helados artesanales, malteadas, ensaladas de frutas y obleas en el parque principal.",
     ["Helados", "Malteadas", "Obleas"], "10:00", "21:30", 3000, [
        ("Helado artesanal 2 bolas", "producto", 7000, 80, False, [], ["helado", "postre", "artesanal", "cono"], "Dos bolas en cono o vaso: arequipe, mora, chocolate, coco o vainilla."),
        ("Malteada de Oreo", "producto", 12000, 50, False, [], ["malteada", "oreo", "helado", "bebida"], "Malteada de 16 oz con galleta Oreo y crema chantilly."),
        ("Ensalada de frutas con helado", "producto", 13000, 40, False, [], ["ensalada de frutas", "helado", "queso", "postre", "fruta"], "Frutas de temporada con helado, crema, queso rallado y galleta."),
        ("Oblea completa", "producto", 6000, 60, False, [], ["oblea", "arequipe", "postre", "dulce"], "Oblea con arequipe, mora, crema y queso."),
        ("Litro de helado para llevar", "producto", 24000, 30, False, [C, N], ["helado", "litro", "postre", "familia"], "Un litro de helado artesanal, hasta tres sabores."),
        ("Brownie con helado", "producto", 10000, 35, False, [AM, A], ["brownie", "helado", "chocolate", "postre"], "Brownie tibio de chocolate con helado de vainilla."),
    ]),
    ("Fritos y Tamales Ocañeros", "tamales-ocaneros", "comida-tipica", ("Rosa", "Ovallos", "rosa"), "Buenos Aires", "7A4A1C",
     "Cocina típica ocañera: tamales, mute, bollos y hallacas de temporada.",
     ["Tamales", "Mute", "Comida típica"], "06:00", "15:00", 3000, [
        ("Tamal ocañero", "producto", 9000, 60, False, [N], ["tamal", "tipico", "desayuno", "cerdo", "pollo", "comida tipica"], "Tamal envuelto en hoja de bijao con cerdo, pollo, garbanzo y huevo."),
        ("Mute santandereano", "producto", 16000, 30, False, [], ["mute", "sopa", "tipico", "almuerzo", "comida tipica"], "Sopa espesa de maíz, callo, costilla y verduras. Solo sábados y domingos."),
        ("Bollo de mazorca x 5", "producto", 7000, 40, False, [], ["bollo", "mazorca", "maiz", "tipico"], "Bollos de maíz tierno envueltos en capacho."),
        ("Hallacas navideñas x 6", "producto", 48000, 30, True, [N], ["hallaca", "navidad", "tipico", "cena navideña"], "Hallacas de maíz con guiso de tres carnes, aceitunas y pasas."),
        ("Natilla y buñuelos para 10", "producto", 45000, 25, True, [N], ["natilla", "buñuelos", "navidad", "postre", "novena"], "Natilla de panela con coco y 20 buñuelos de queso para la novena."),
        ("Cabro guisado ocañero", "producto", 22000, 15, False, [P], ["cabro", "chivo", "tipico", "almuerzo", "comida tipica"], "Cabro guisado con pepitoria, yuca y arepa."),
    ]),
    ("Wok & Sushi Ocaña", "wok-sushi-ocana", "comidas-rapidas", ("Kevin", "Pino", "kevin"), "Los Álamos", "1E4D45",
     "Sushi, arroz chino y comida oriental preparada al momento.",
     ["Sushi", "Comida china", "Wok"], "12:00", "22:00", 4000, [
        ("Roll California x 10", "producto", 26000, 30, False, [A, AM], ["sushi", "roll", "california", "cangrejo", "comida japonesa"], "Diez piezas con cangrejo, aguacate y pepino."),
        ("Combo sushi para dos", "producto", 58000, 15, False, [A, AM], ["sushi", "pareja", "cena", "combo"], "Treinta piezas surtidas, salsa de soya, jengibre y wasabi."),
        ("Arroz chino especial", "producto", 22000, 40, False, [], ["arroz chino", "arroz", "comida china", "cerdo", "pollo"], "Arroz frito con pollo, cerdo, camarón y lumpias."),
        ("Pollo agridulce", "producto", 24000, 30, False, [], ["pollo", "agridulce", "comida china"], "Pollo apanado en salsa agridulce con arroz blanco."),
        ("Ramen de pollo", "producto", 25000, 20, False, [], ["ramen", "sopa", "fideos", "comida japonesa"], "Caldo de pollo con fideos, huevo marinado y verduras."),
    ]),
    ("Fit Ocaña Gym", "fit-ocana-gym", "deportes", ("Sergio", "Navarro", "sergio"), "La Piñuela", "2C2C2C",
     "Gimnasio con máquinas, clases grupales, entrenamiento personalizado y tienda deportiva.",
     ["Gimnasio", "Clases grupales", "Suplementos"], "05:00", "22:00", None, [
        ("Mensualidad de gimnasio", "servicio", 70000, 50, False, [], ["gimnasio", "gym", "mensualidad", "pesas", "ejercicio"], "Acceso libre de lunes a sábado, valoración física incluida."),
        ("Clase de rumba aeróbica", "servicio", 6000, 30, False, [], ["rumba", "baile", "clase", "ejercicio", "zumba"], "Clase grupal de una hora, lunes, miércoles y viernes a las 7 p. m."),
        ("Entrenador personal (10 sesiones)", "servicio", 250000, 8, False, [C, A], ["entrenador personal", "gimnasio", "plan", "rutina"], "Diez sesiones uno a uno con plan de alimentación básico."),
        ("Proteína whey 2 libras", "producto", 140000, 15, False, [PO], ["proteina", "suplemento", "gimnasio", "whey"], "Proteína de suero sabor chocolate o vainilla."),
        ("Balón de fútbol N.° 5", "producto", 65000, 20, False, [C, PO, N], ["balon", "futbol", "deporte", "niños"], "Balón cosido a mano para cancha sintética."),
        ("Camiseta deportiva dry-fit", "producto", 38000, 30, False, [PO, PE], ["camiseta", "deportiva", "ropa", "gimnasio"], "Camiseta transpirable para hombre o mujer."),
    ]),
    ("Papelería El Estudiante", "papeleria-el-estudiante", "papeleria", ("Marta", "Quintero", "marta"), "Centro", "234B8F",
     "Útiles escolares, impresiones, anillados, libros y detalles personalizados.",
     ["Útiles", "Impresiones", "Libros"], "07:00", "19:00", 2000, [
        ("Kit escolar completo", "producto", 85000, 25, False, [], ["kit escolar", "utiles", "colegio", "cuadernos", "niños"], "Seis cuadernos, colores, lápices, borrador, regla, tijeras y pegante."),
        ("Impresión a color por hoja", "servicio", 1000, 999, False, [], ["impresion", "fotocopia", "color", "trabajos"], "Impresión láser a color tamaño carta."),
        ("Anillado y empastado", "servicio", 6000, 100, False, [G], ["anillado", "empastado", "tesis", "trabajos"], "Anillado o empaste de trabajos, tesis y proyectos de grado."),
        ("Agenda personalizada 2027", "producto", 42000, 20, True, [C, N, RC, G], ["agenda", "personalizada", "regalo", "planeador"], "Agenda de tapa dura con nombre y diseño a elección."),
        ("Libro de cuentos infantiles", "producto", 28000, 15, False, [C, N], ["libro", "cuentos", "niños", "lectura"], "Colección de cuentos ilustrados para niños de 4 a 8 años."),
        ("Tarjetas de invitación (25 und)", "producto", 35000, 20, True, [C, G], ["invitaciones", "tarjetas", "fiesta", "cumpleaños"], "Veinticinco tarjetas impresas con tu diseño."),
    ]),
    ("Foto Momentos Eventos", "foto-momentos", "eventos", ("Daniela", "Arévalo", "daniela"), "Torcoroma", "8B4F9E",
     "Fotografía, decoración con globos y organización de fiestas en Ocaña.",
     ["Fotografía", "Decoración", "Fiestas"], "08:00", "19:00", None, [
        ("Sesión de fotos profesional", "servicio", 150000, 10, False, [C, A, G, PE], ["fotografia", "sesion de fotos", "fotos", "book"], "Una hora de sesión en exteriores, 20 fotos editadas en alta calidad."),
        ("Fotografía de grado", "servicio", 120000, 15, False, [G], ["fotografia", "grado", "graduacion", "fotos"], "Cobertura de la ceremonia y 30 fotos editadas."),
        ("Decoración con globos para cumpleaños", "servicio", 180000, 8, False, [C, H], ["decoracion", "globos", "fiesta", "cumpleaños"], "Arco orgánico de globos, letrero y fondo para la torta."),
        ("Mesa dulce para 30 invitados", "servicio", 320000, 5, False, [C, G], ["mesa dulce", "fiesta", "postres", "evento"], "Cupcakes, gomitas, galletas decoradas y montaje temático."),
        ("Alquiler de sonido y DJ (5 horas)", "servicio", 400000, 4, False, [C, G, N], ["dj", "sonido", "fiesta", "musica", "evento"], "Equipo de sonido, luces y DJ por cinco horas."),
        ("Serenata con mariachi", "servicio", 350000, 6, False, [C, M, A, AM], ["serenata", "mariachi", "musica", "sorpresa"], "Seis canciones con mariachi a domicilio en Ocaña."),
    ]),
    ("Servicios Don José", "servicios-don-jose", "servicios-hogar", ("José", "Bayona", "jose"), "Bermejal", "5A6B2E",
     "Plomería, electricidad, pintura y reparaciones del hogar con garantía.",
     ["Plomería", "Electricidad", "Pintura"], "07:00", "18:00", None, [
        ("Visita de plomería", "servicio", 40000, 20, False, [], ["plomero", "plomeria", "fuga", "tuberia", "baño"], "Revisión y arreglo de fugas, llaves y sanitarios. Materiales aparte."),
        ("Servicio de electricista", "servicio", 45000, 20, False, [], ["electricista", "luz", "toma", "cableado", "instalacion"], "Instalación de tomas, lámparas, breakers y revisión de corto."),
        ("Pintura de habitación", "servicio", 220000, 10, False, [], ["pintura", "pintor", "pared", "casa"], "Mano de obra y pintura para una habitación de hasta 12 m²."),
        ("Mantenimiento de aire acondicionado", "servicio", 90000, 15, False, [], ["aire acondicionado", "mantenimiento", "limpieza", "minisplit"], "Limpieza completa y revisión de gas de un equipo minisplit."),
        ("Cerrajería a domicilio", "servicio", 50000, 15, False, [], ["cerrajero", "chapa", "llaves", "puerta"], "Apertura de puertas, cambio de guardas y copia de llaves."),
        ("Lavado de muebles y colchones", "servicio", 80000, 12, False, [N], ["lavado", "muebles", "sofa", "colchon", "limpieza"], "Lavado en seco de sala de tres puestos o un colchón doble."),
    ]),
    ("Spa Armonía", "spa-armonia", "bienestar", ("Paola", "Rincón", "paola"), "Villa Paraíso", "B05C7A",
     "Masajes, faciales y días de spa para consentirte o regalar.",
     ["Masajes", "Faciales", "Spa"], "09:00", "19:00", None, [
        ("Masaje relajante 60 min", "servicio", 80000, 20, False, [M, C, PE, A], ["masaje", "relajante", "spa", "bienestar"], "Masaje de cuerpo completo con aceites esenciales."),
        ("Limpieza facial profunda", "servicio", 70000, 20, False, [PE, M, G], ["limpieza facial", "facial", "piel", "spa"], "Exfoliación, extracción, mascarilla e hidratación."),
        ("Día de spa en pareja", "servicio", 240000, 6, False, [A, AM], ["spa", "pareja", "masaje", "regalo", "aniversario"], "Masaje para dos, jacuzzi, frutas y copa de vino."),
        ("Bono de regalo spa", "producto", 100000, 30, False, [M, C, PE, N, RC], ["bono", "regalo", "spa", "tarjeta"], "Tarjeta de regalo canjeable por cualquier servicio del spa."),
        ("Depilación con cera (piernas)", "servicio", 45000, 20, False, [], ["depilacion", "cera", "belleza"], "Depilación de piernas completas con cera tibia."),
    ]),
    ("Juguetería Pequeños Genios", "jugueteria-pequenos-genios", "juguetes", ("Diana", "Contreras", "diana"), "Centro", "E0A100",
     "Juguetes didácticos, juegos de mesa y regalos para niños de todas las edades.",
     ["Didácticos", "Juegos de mesa", "Muñecas"], "09:00", "20:00", 3000, [
        ("Carro a control remoto", "producto", 89000, 15, False, [C, N], ["carro", "control remoto", "juguete", "niño"], "Carro todoterreno recargable, alcance de 30 metros."),
        ("Muñeca con accesorios", "producto", 65000, 20, False, [C, N], ["muñeca", "juguete", "niña"], "Muñeca articulada con ropa y accesorios intercambiables."),
        ("Bloques de construcción 500 piezas", "producto", 75000, 18, False, [C, N], ["bloques", "armable", "lego", "didactico", "niños"], "Bloques compatibles con las marcas más conocidas."),
        ("Rompecabezas 1000 piezas", "producto", 48000, 15, False, [C, N, A], ["rompecabezas", "puzzle", "juego", "familia"], "Paisajes colombianos, para jugar en familia."),
        ("Juego de mesa familiar", "producto", 72000, 12, False, [N, C, AM], ["juego de mesa", "familia", "monopolio", "juego"], "Juego de estrategia para 2 a 6 jugadores."),
        ("Kit de pintura para niños", "producto", 35000, 25, False, [C], ["pintura", "arte", "niños", "didactico", "colores"], "Acuarelas, crayones, pinceles y libro para colorear."),
    ]),
    ("Calzado Santander", "calzado-santander", "calzado", ("Fabián", "Sánchez", "fabian"), "Centro", "5B3A29",
     "Calzado en cuero hecho en Santander, tenis y sandalias para toda la familia.",
     ["Tenis", "Zapatos de cuero", "Sandalias"], "09:00", "19:30", 4000, [
        ("Tenis urbanos unisex", "producto", 120000, 30, False, [C, G, PE, PO], ["tenis", "zapatillas", "zapatos", "urbano"], "Tenis blancos con suela de caucho, tallas 35 a 44."),
        ("Zapatos de cuero para hombre", "producto", 160000, 20, False, [P, G, PO], ["zapatos", "cuero", "formal", "hombre"], "Zapato formal en cuero genuino, hecho en Bucaramanga."),
        ("Sandalias de mujer", "producto", 65000, 25, False, [M, PE], ["sandalias", "mujer", "verano"], "Sandalias planas en cuero con plantilla acolchada."),
        ("Botas de cuero", "producto", 180000, 15, False, [PO, PE], ["botas", "cuero", "calzado"], "Botas de caña media en cuero engrasado."),
        ("Zapatos colegiales", "producto", 85000, 30, False, [], ["zapatos", "colegio", "escolar", "niños"], "Zapato negro de cuero para uniforme, tallas 27 a 40."),
    ]),
    ("Bisutería Luna", "bisuteria-luna", "joyeria", ("Sofía", "Guerrero", "sofia"), "La Primavera", "9C6ADE",
     "Joyas en plata y bisutería hecha a mano, con grabado de nombres.",
     ["Plata", "Aretes", "Collares"], "09:00", "19:00", 3000, [
        ("Collar con nombre en plata", "producto", 85000, 20, True, [A, AM, M, C, PE], ["collar", "nombre", "plata", "personalizado", "joya"], "Collar en plata 925 con el nombre que quieras."),
        ("Aretes de plata con circón", "producto", 55000, 25, False, [M, C, PE, AM], ["aretes", "plata", "joya", "mujer"], "Aretes pequeños con piedra de circón."),
        ("Pulsera de parejas", "producto", 60000, 20, False, [A, AM], ["pulsera", "pareja", "novios", "joya"], "Dos pulseras con imán que se unen."),
        ("Anillo de compromiso en plata", "producto", 140000, 10, True, [A, AM], ["anillo", "compromiso", "plata", "joya"], "Anillo en plata 925 con piedra central."),
        ("Reloj de pulso para hombre", "producto", 120000, 12, False, [P, C, G, PO], ["reloj", "hombre", "accesorio"], "Reloj análogo con correa de cuero."),
    ]),
    ("Lava Express Ocaña", "lava-express", "lavanderia", ("Óscar", "Duarte", "oscar"), "Cristo Rey", "2A8BB8",
     "Lavandería por kilo con recogida y entrega a domicilio.",
     ["Lavado", "Planchado", "Tintorería"], "07:00", "19:00", 3000, [
        ("Lavado y secado por kilo", "servicio", 5000, 200, False, [], ["lavanderia", "lavado", "ropa", "secado"], "Lavado con detergente y suavizante, entrega en 24 horas."),
        ("Planchado por prenda", "servicio", 2500, 200, False, [], ["planchado", "ropa", "camisas"], "Camisas, pantalones y vestidos planchados a vapor."),
        ("Lavado de cobijas y edredones", "servicio", 18000, 50, False, [], ["cobija", "edredon", "lavado", "lavanderia"], "Lavado profundo de edredón doble o cobija."),
        ("Tintorería de traje", "servicio", 25000, 30, False, [G], ["tintoreria", "traje", "lavado en seco"], "Lavado en seco de traje de dos piezas."),
    ]),
    ("Veterinaria San Francisco", "veterinaria-san-francisco", "veterinaria", ("Juliana", "Mora", "juliana"), "San Francisco", "3E8E7E",
     "Consulta veterinaria, vacunas, peluquería canina y urgencias.",
     ["Consulta", "Vacunas", "Peluquería canina"], "08:00", "20:00", None, [
        ("Consulta veterinaria", "servicio", 40000, 30, False, [], ["veterinario", "consulta", "perro", "gato", "mascota"], "Revisión general, peso y plan de vacunas."),
        ("Vacuna antirrábica", "servicio", 30000, 40, False, [], ["vacuna", "rabia", "perro", "gato", "mascota"], "Vacuna con certificado y carné."),
        ("Baño y peluquería canina", "servicio", 45000, 25, False, [], ["peluqueria canina", "baño", "perro", "mascota", "grooming"], "Baño, corte, uñas y limpieza de oídos."),
        ("Desparasitación", "servicio", 25000, 40, False, [], ["desparasitar", "perro", "gato", "mascota"], "Desparasitación interna según el peso."),
        ("Esterilización de gata", "servicio", 180000, 6, False, [], ["esterilizacion", "gata", "cirugia", "mascota"], "Cirugía con anestesia, medicamentos y control."),
    ]),
    ("Mundo Cel Ocaña", "mundo-cel-ocana", "tecnologia", ("Brayan", "Torrado", "brayan"), "Centro", "1F1F2E",
     "Celulares, accesorios y reparación de equipos con garantía.",
     ["Celulares", "Accesorios", "Reparación"], "09:00", "20:00", 3000, [
        ("Audífonos inalámbricos", "producto", 75000, 25, False, [C, AM, N, G], ["audifonos", "bluetooth", "inalambricos", "tecnologia"], "Audífonos in-ear con estuche de carga, 20 horas de batería."),
        ("Cargador rápido 20 W", "producto", 35000, 40, False, [], ["cargador", "celular", "usb c", "tecnologia"], "Cargador con cable USB-C."),
        ("Forro antichoque", "producto", 20000, 60, False, [], ["forro", "estuche", "celular", "protector"], "Forro transparente para iPhone, Samsung y Xiaomi."),
        ("Vidrio templado instalado", "servicio", 15000, 80, False, [], ["vidrio templado", "protector", "pantalla", "celular"], "Protector de pantalla instalado al momento."),
        ("Cambio de pantalla de celular", "servicio", 180000, 15, False, [], ["pantalla", "reparacion", "celular", "display"], "Repuesto original y garantía de tres meses."),
        ("Parlante bluetooth", "producto", 95000, 15, False, [C, P, N], ["parlante", "bluetooth", "musica", "tecnologia"], "Parlante resistente al agua con 12 horas de batería."),
    ]),
]


def q(s):
    return "'" + str(s).replace("'", "''") + "'" if s is not None else "null"


def arr(xs):
    return "array[" + ",".join(q(x) for x in xs) + "]::text[]" if xs else "'{}'::text[]"


def sql():
    out = ["begin;"]
    for nombre, slug, emoji, tipo, orden in CATS:
        out.append(f"insert into public.categorias (nombre, slug, emoji, tipo, orden) values ({q(nombre)},{q(slug)},{q(emoji)},{q(tipo)},{orden}) on conflict (slug) do nothing;")
    for i, (nom, slug, cat, (dn, da, dc), barrio, color, desc, subs, abre, cierra, domicilio, prods) in enumerate(NEG):
        correo = f"{dc}.{slug.split('-')[0]}@impulsa.demo"
        wa = f"5730055502{i:02d}"
        entrega = ["Domicilio en Ocaña", "Recoger en el local"] if domicilio else ["Atención en el local", "Servicio a domicilio"]
        out.append(f"""do $$ declare u uuid; e uuid; begin
  if exists (select 1 from public.emprendimientos where slug = {q(slug)}) then return; end if;
  select id into u from auth.users where email = {q(correo)};
  if u is null then u := public.registrar_usuario({q(correo)}, encode(extensions.gen_random_bytes(18), 'base64'), 'emprendedor', {q(dn)}, {q(da)}, null, '{{}}'::jsonb); end if;
  insert into public.emprendimientos (propietario_id, nombre, slug, descripcion, categoria_id, subcategorias, color, tiene_local, direccion, barrio, ciudad,
    dias_atencion, abre, cierra, whatsapp, mensaje_whatsapp, medios_pago, formas_entrega, costo_domicilio, tiempo_entrega, verificado, desde_anio, activo)
  values (u, {q(nom)}, {q(slug)}, {q(desc)}, (select id from public.categorias where slug = {q(cat)}), {arr(subs)}, {q(color)}, true, null, {q(barrio)}, 'Ocaña',
    array['L','M','X','J','V','S'], {q(abre)}, {q(cierra)}, {q(wa)}, '¡Hola! Te vi en Impulsa y me interesa {{producto}}. ¿Está disponible?',
    array['Nequi','Daviplata','Efectivo'], {arr(entrega)}, {domicilio if domicilio else 'null'}, {q('30 a 60 minutos' if domicilio else 'Agenda tu cita')}, {str(i % 3 == 0).lower()}, {2016 + i % 9}, true)
  returning id into e;""")
        for (pn, pt, precio, stock, enc, ocs, ets, pd) in prods:
            out.append(f"""  insert into public.productos (emprendimiento_id, categoria_id, tipo, nombre, descripcion, precio, stock, stock_minimo, por_encargo, ocasiones, etiquetas, imagenes, activo, destacado)
  values (e, (select id from public.categorias where slug = {q(cat)}), {q(pt)}, {q(pn)}, {q(pd)}, {precio}, {stock}, 3, {str(enc).lower()}, {arr(ocs)}, {arr(ets)}, '{{}}'::text[], true, false);""")
        out.append("end $$;")
    out.append("commit;")
    return "\n".join(out)


if __name__ == "__main__":
    print(sql())
