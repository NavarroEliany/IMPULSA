"""Configuración. Todo tiene valor por defecto para que el despliegue no requiera pasos manuales."""
import os

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://jiwzobnrcztxthtiydin.supabase.co").rstrip("/")
# Clave pública (publishable) de Supabase: está pensada para usarse en clientes; la seguridad la dan las políticas RLS.
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "sb_publishable_Pb-op7O6WMzHbi43NT1W9g_ITqjhFkN")

# Opcional: si se define, la búsqueda usa Gemini para interpretar lo que escribe el cliente.
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-flash-latest")

# Render la define sola; con ella el backend se registra para que Supabase lo mantenga despierto.
URL_PUBLICA = os.getenv("RENDER_EXTERNAL_URL", "").rstrip("/")
BUCKET = "impulsa"
