Paleta de colores (usar exactamente estos valores)
Background — #f9f9ff (Fondo general de la app)

Surface White — #ffffff (Tarjetas principales / KPI 1)

Surface Blue Light — #f0f3ff (Tarjetas secundarias / KPI 2)

Surface Blue Dark — #d8e3fb (Tarjetas destacadas / KPI 3)

Text Main — #111c2d (Texto principal oscuro / Títulos)

Warning Orange — #ffddb8 (Fondo sección de alertas)

Warning Dark — #2a1700 (Textos y botones en sección alertas)

Accent Blue — #0053db (Métricas positivas y acentos)

Error Red — #ffdad6 (Fondo de badges de urgencia / "1 DÍA")

Error Dark — #93000a (Texto en badges de urgencia)

Outline — #76777d (Textos secundarios / Labels pequeños)

Fondo principal: Background

Textos principales: Text Main

Tarjetas / Contenedores: Surface White, Surface Blue Light, Surface Blue Dark

Alertas Urgentes: Warning Orange (fondo) y Warning Dark (elementos)

Objetivo del proyecto
Crear el panel administrativo (Command Center) del Sistema de Registro de Membresías llamado Kinetic Precision, usando NextJS (App Router) y Tailwind.

El proyecto ya está creado y con tailwind instalado, pero sin estilos ni funcionalidades. El objetivo es implementar el diseño y las funcionalidades de una interfaz administrativa ultramoderna, de alto contraste y tipografía estructurada, siguiendo exactamente los diseños presentados en las referencias que se encuentran en la carpeta de "Antigravity" dentro del proyecto.

Tipografía
Uso obligatorio de Inter (Google Fonts) configurada para soportar todos los pesos (100 a 900).

Uso obligatorio de la iconografía Material Symbols Outlined.

Uso estricto de utilidades de espaciado de letras en Tailwind (tracking-tighter para números grandes, tracking-[0.2em] o tracking-widest para etiquetas pequeñas).

Uso intensivo de uppercase para subtítulos y etiquetas descriptivas.

Prioridades
Trabaja pensando en reutilizar componentes y estilos.

Crea componentes para las tarjetas de métricas (KPIs), las filas de la tabla de alertas y el layout principal (Sidebar y Header).

Maneja carpetas y subcarpetas acorde a las páginas que estás trabajando (ej. /components/dashboard, /components/layout, /components/ui).

No hagas configuraciones ni instalaciones de librerías sin consultar primero (para el gráfico inicial "Weekly Income", usa un SVG estático tal como está en el diseño original).

Mantén los efectos visuales como backdrop-blur-md en el header y los bordes sutiles según la referencia.