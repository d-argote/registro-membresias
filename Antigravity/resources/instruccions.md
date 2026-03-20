1. Estructura de Carpetas (Next.js App Router)
Organiza el proyecto utilizando el patrón de App Router de Next.js. Crea las siguientes rutas y carpetas para mantener el código modular:

app/(dashboard)/layout.tsx: Contendrá el Sidebar y el TopNavBar. Todo el contenido de las páginas se renderizará en el <main> con el padding y márgenes correspondientes.

app/(dashboard)/page.tsx: Será la página principal del Command Center.

components/layout/:

Sidebar.tsx

TopNavBar.tsx

components/dashboard/:

KpiCard.tsx (Componente reutilizable para las 3 métricas superiores)

AlertSection.tsx (Contenedor de la tabla naranja)

AlertTableRow.tsx (Fila individual de la tabla)

WeeklyIncomeChart.tsx (Contenedor del gráfico SVG)

ProjectionWidget.tsx (Tarjeta de proyección y botón de auditoría)

2. Implementación del Layout Base (layout.tsx)
Recrea la estructura base exactamente con estas clases para asegurar la responsividad y el efecto Glassmorphism:

Sidebar (<aside>): Debe ser fijo a la izquierda fixed left-0 top-0 h-screen w-64. Usa bg-slate-50 dark:bg-slate-950/80 backdrop-blur-xl z-50.

TopNavBar (<header>): Debe ser fijo arriba, respetando el ancho del sidebar: fixed top-0 right-0 w-[calc(100%-16rem)] h-20 z-40 bg-white/80 backdrop-blur-md.

Main Container (<main>): Debe tener los márgenes exactos para no quedar oculto por el layout fijo: ml-64 mt-20 p-12 space-y-12.

3. Reglas Estrictas de Estilo (Extraídas del HTML)
Aplica estas combinaciones de clases de Tailwind de forma sistemática para mantener la identidad visual del "Performance Atelier":

Tipografía de Subtítulos (Labels pequeñas):
Siempre que haya un label descriptivo pequeño (ej. "Ingresos del día", "Projection"), usa la combinación: text-[10px] font-black tracking-[0.2em] uppercase o tracking-widest.

Tipografía de Números Grandes (Métricas):
Para valores monetarios o cantidades grandes, usa: text-4xl font-black tracking-tighter.

Efectos de Interacción (Botones y Enlaces):
Todo elemento clickeable debe tener esta transición para simular el "toque" físico: transition-all duration-200 ease-in-out active:scale-95.

Tarjetas de Alerta (Filas de la tabla):
Usa el efecto Glassmorphism sobre el fondo naranja: bg-white/40 backdrop-blur-sm rounded-lg. Al hacer hover: hover:bg-white/60.

4. Desglose de Componentes Clave
A. KpiCard (Reutilizable):
Crea un componente que acepte props: title, value, subtext, bgColor, textColor.

Nota de diseño: La primera tarjeta (Ingresos) invierte sus colores al hacer hover (hover:bg-primary group-hover:text-on-primary). Asegúrate de usar el modificador group en el contenedor principal de la tarjeta.

Nota de diseño: La segunda tarjeta (Accesos) incluye una barra de progreso. Haz que el porcentaje sea una prop (progressValue).

B. AlertSection & AlertTableRow:

Contenedor principal: bg-tertiary-fixed p-8 rounded-xl.

Badge de "Urgente": bg-on-tertiary-fixed text-tertiary-fixed text-[10px] font-black rounded-full uppercase px-3 py-1.

Filas: Componentiza el Avatar (círculo con iniciales), la etiqueta roja de "Días Restantes" (bg-error-container text-on-error-container), y el botón de acción oscuro.

C. Gráfico SVG Estático (Weekly Income):

No instales librerías de gráficos aún. Copia el bloque <svg> exacto proporcionado en el archivo code.html dentro de un componente WeeklyIncomeChart.tsx. Mantén el viewBox="0 0 800 200" y los <linearGradient> para preservar la estética original.

5. Pasos de Ejecución
Configuración: Actualiza tailwind.config.ts con la paleta de colores y la fuente Inter.

Esqueleto: Construye el layout.tsx con el Sidebar estático y el TopNavBar.

Tarjetas Base: Desarrolla el componente KpiCard y renderiza las tres variaciones de la parte superior.

Sección de Alerta: Construye la tabla naranja con sus filas translúcidas.

Gráficos y Widgets Inferiores: Pega el SVG del gráfico y construye las tarjetas de "Projection" y "Full Audit PDF".