PROMPT PARA COMPONENTE DE VISOR DE IMÁGENES CON ANOTACIONES
Necesito que crees un componente de React/Next.js con las siguientes características:
Funcionalidad Principal:

Visualización de imagen con zoom:

Permitir zoom in/zoom out (botones + y -, o scroll del mouse)
Pan/arrastrar la imagen cuando está con zoom
Botón de reset para volver al tamaño original
Zoom suave y fluido


Sistema de anotaciones mediante clicks:

Al hacer click en cualquier parte de la imagen, colocar un marcador/pin numerado
Cada marcador debe mostrar un número secuencial (1, 2, 3...)
Al hacer click en un marcador, abrir un modal/popup para agregar comentario


Gestión de comentarios:

Modal con textarea para escribir el comentario
Botones "Guardar" y "Cancelar"
Al guardar, el comentario debe asociarse al marcador
Mostrar indicador visual en marcadores que ya tienen comentario (ej: color diferente)
Al hover sobre un marcador con comentario, mostrar preview del texto


Visualización de comentarios existentes:

Lista lateral o panel inferior con todos los comentarios
Cada item debe mostrar: número del marcador, comentario, fecha/hora
Click en item de la lista debe resaltar el marcador correspondiente en la imagen



Requisitos Técnicos:

Usar TypeScript
Usar Tailwind CSS para estilos
Componente funcional con React Hooks
Estado local con useState para los comentarios (array de objetos)
Cada comentario debe tener: { id, x, y, text, timestamp }
Las coordenadas x, y deben ser relativas a la imagen (0-100% o píxeles)
Responsive (funcional en desktop, mobile puede ser básico)

Librerías recomendadas:

react-zoom-pan-pinch para el zoom
Lucide-react para iconos
No usar localStorage (estado en memoria es suficiente)

UI/UX:

Diseño moderno y limpio
Marcadores visibles con buen contraste
Modal centrado con overlay semi-transparente
Botones de zoom visibles y accesibles
Colores: usar palette de azules/grises profesional

Estructura esperada:
