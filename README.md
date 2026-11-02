# 🎧 MusicStats — Tu Spotify Wrapped en Cualquier Momento (RGPD)

**MusicStats** es una aplicación web interactiva que analiza tu historial completo de reproducciones de Spotify (exportación oficial de Privacidad / RGPD) para calcular las mismas métricas exactas del **Spotify Wrapped** anual y de toda tu historia musical, **100% en tu navegador y sin enviar tus datos a ningún servidor**.

---

## ✨ Características Principales

- 🔒 **Privacidad 100% Local**: Todo el procesamiento de tus archivos `.zip` o `.json` ocurre en el cliente y se guarda en `IndexedDB` dentro de tu propio navegador.
- 📦 **Soporte Universal de Archivos Spotify**:
  - Acepta directamente el archivo comprimido `my_spotify_data.zip` sin descomprimir.
  - Compatible con el **Historial Extendido** (`Streaming_History_Audio_*.json` / `endsong_*.json`) y el **Historial de Cuenta Básico** (`StreamingHistory_music_*.json`).
- 🎨 **Portadas de Álbumes y Previews de Audio en Vivo**:
  - Obtiene automáticamente las carátulas oficiales en alta resolución (`600x600`) y fragmentos de audio de 30 segundos reproducibles con un clic.
- 📊 **Métricas Exactas tipo Wrapped**:
  - Minutos, horas y días totales escuchados.
  - Ranking **Top 100 Artistas**, **Top 100 Canciones** y **Galería de Álbumes**.
  - Cálculo de tasa de salto (*Skip Rate*), uso de *Shuffle*, día récord y **racha más larga de días consecutivos** escuchando música.
  - Detección automática de tu **Personalidad Musical** según tus hábitos y horarios.
- 🕒 **Gráficos de Actividad**:
  - Distribución horaria (`00h–23h`), actividad por día de la semana y línea temporal mes a mes.
  - Filtro instantáneo por año o búsqueda en tiempo real por canción, artista o álbum.
- 📱 **Presentación Stories + Generador de Tarjetas PNG (`1080x1920`)**:
  - Modo historia interactivo de 5 diapositivas animadas.
  - Exportador de tarjetas en alta definición con 4 temas visuales listo para compartir en Instagram Stories, TikTok o WhatsApp.
- 🧪 **Modo Demo Integrado**: Prueba todas las funciones al instante con un dataset realista sin necesidad de subir archivos.

---

## 🚀 Cómo Empezar en Local

### 1. Clonar el repositorio

```bash
git clone https://github.com/chrisantropo/MusicStats.git
cd MusicStats
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Iniciar el servidor de desarrollo

```bash
npm run dev
```

Abre `http://localhost:3000` en tu navegador.

---

## 📥 ¿Cómo conseguir tus datos de Spotify?

1. Entra en tu página de [Privacidad de Spotify](https://www.spotify.com/account/privacy/).
2. Baja hasta la sección **"Descargar tus datos"**.
3. Solicita los **Datos de la cuenta** (historial del último año) o el **Historial de reproducción ampliado** (todos tus años en Spotify).
4. Cuando recibas el archivo `.zip` de Spotify por correo, arrástralo directamente a **MusicStats**.

---

## 🛠️ Stack Tecnológico

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router) + React 18 + TypeScript
- **Estilos**: [Tailwind CSS](https://tailwindcss.com/) + Lucide Icons
- **Procesamiento Local**: `JSZip` (descompresión en memoria) + `idb-keyval` (`IndexedDB`)
- **Generación Gráfica**: HTML5 Canvas API (`1080x1920` Stories HD)
