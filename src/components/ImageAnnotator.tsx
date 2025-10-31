'use client';

import React, { useState, useRef, useCallback, useMemo } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Plus, Minus, RotateCcw, X, Save, PenTool, Menu } from 'lucide-react';

interface Annotation {
  id: number;
  x: number;
  y: number;
  text: string;
  timestamp: Date;
}

interface ImageAnnotatorProps {
  imageUrl: string;
  imageAlt?: string;
}

// Función auxiliar para formatear fechas
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

// Componente de botón de zoom reutilizable
const ZoomButton = React.memo(({ 
  onClick, 
  disabled, 
  ariaLabel, 
  className, 
  Icon 
}: { 
  onClick: () => void; 
  disabled?: boolean; 
  ariaLabel: string; 
  className: string; 
  Icon: React.ComponentType<{ size: number; className?: string }> 
}) => (
  <button
    onClick={onClick}
    className={className}
    aria-label={ariaLabel}
    disabled={disabled}
  >
    <Icon size={18} className="sm:w-5 sm:h-5" />
  </button>
));

ZoomButton.displayName = 'ZoomButton';

export default function ImageAnnotator({ imageUrl, imageAlt = 'Annotated image' }: ImageAnnotatorProps) {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedAnnotation, setSelectedAnnotation] = useState<Annotation | null>(null);
  const [commentText, setCommentText] = useState('');
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const [annotationMode, setAnnotationMode] = useState(true);
  const [isCommentsPanelOpen, setIsCommentsPanelOpen] = useState(false);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);
  
  const zoomFunctionsRef = useRef<{
    zoomIn: () => void;
    zoomOut: () => void;
    resetTransform: () => void;
  } | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef<{ x: number; y: number } | null>(null);

  // Calcular comentarios con texto una sola vez
  const commentsWithText = useMemo(() => annotations.filter(a => a.text), [annotations]);
  const commentsCount = commentsWithText.length;

  // Función para cerrar popup
  const closePopup = useCallback(() => {
    setPopupPosition(null);
    setSelectedAnnotation(null);
    setCommentText('');
  }, []);

  const handleMarkerClick = useCallback((annotation: Annotation, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedAnnotation(annotation);
    setCommentText(annotation.text);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPopupPosition({ x: rect.left, y: rect.top });
  }, []);

  const handleSaveComment = useCallback(() => {
    if (!selectedAnnotation) return;

    setAnnotations(prev => prev.map(ann =>
      ann.id === selectedAnnotation.id
        ? { ...ann, text: commentText, timestamp: ann.text ? ann.timestamp : new Date() }
        : ann
    ));

    closePopup();
  }, [selectedAnnotation, commentText, closePopup]);

  const handleCancel = useCallback(() => {
    if (!selectedAnnotation) return;

    // Si no hay texto, eliminar la anotación
    if (!selectedAnnotation.text && !commentText) {
      setAnnotations(prev => prev.filter(ann => ann.id !== selectedAnnotation.id));
    }

    closePopup();
  }, [selectedAnnotation, commentText, closePopup]);

  const handleListClick = useCallback((annotation: Annotation) => {
    setHighlightedId(annotation.id);
    setTimeout(() => setHighlightedId(null), 2000);
  }, []);

  const handleImageClick = useCallback((e: React.MouseEvent) => {
    if (!annotationMode || !imageRef.current || isDraggingRef.current) {
      isDraggingRef.current = false;
      return;
    }
    
    e.stopPropagation();
    e.preventDefault();
    
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    const newAnnotation: Annotation = {
      id: annotations.length + 1,
      x,
      y,
      text: '',
      timestamp: new Date(),
    };
    
    setAnnotations(prev => [...prev, newAnnotation]);
    setSelectedAnnotation(newAnnotation);
    setCommentText('');
    setPopupPosition({ x: e.clientX, y: e.clientY });
  }, [annotationMode, annotations.length]);
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!imageRef.current) return;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    isDraggingRef.current = false;
  }, []);
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (lastMousePosRef.current && imageRef.current) {
      const dx = Math.abs(e.clientX - lastMousePosRef.current.x);
      const dy = Math.abs(e.clientY - lastMousePosRef.current.y);
      if (dx > 5 || dy > 5) {
        isDraggingRef.current = true;
      }
    }
  }, []);
  
  const handleMouseUp = useCallback(() => {
    lastMousePosRef.current = null;
  }, []);

  const handleZoomIn = useCallback(() => zoomFunctionsRef.current?.zoomIn(), []);
  const handleZoomOut = useCallback(() => zoomFunctionsRef.current?.zoomOut(), []);
  const handleResetTransform = useCallback(() => zoomFunctionsRef.current?.resetTransform(), []);

  // Estilos comunes para botones de zoom
  const zoomButtonClass = "p-2 sm:p-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="w-full h-screen flex flex-col bg-gradient-to-br from-blue-50 to-gray-100">
      {/* Header con controles de zoom */}
      <div className="bg-white shadow-md p-2 sm:p-4 flex items-center justify-between gap-2">
        <h2 className="text-sm sm:text-lg md:text-xl font-semibold text-gray-800 truncate">
          Visor de Anotaciones
        </h2>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <button
            onClick={() => setAnnotationMode(!annotationMode)}
            className={`p-2 sm:p-2.5 rounded-lg transition-colors ${
              annotationMode
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
            }`}
            aria-label="Toggle annotation mode"
            title={annotationMode ? 'Modo anotación activo - Click en imagen para anotar' : 'Click para activar modo anotación'}
          >
            <PenTool size={18} className="sm:w-5 sm:h-5" />
          </button>
          <ZoomButton
            onClick={handleZoomIn}
            disabled={!zoomFunctionsRef.current}
            ariaLabel="Zoom in"
            className={zoomButtonClass}
            Icon={Plus}
          />
          <ZoomButton
            onClick={handleZoomOut}
            disabled={!zoomFunctionsRef.current}
            ariaLabel="Zoom out"
            className={zoomButtonClass}
            Icon={Minus}
          />
          <ZoomButton
            onClick={handleResetTransform}
            disabled={!zoomFunctionsRef.current}
            ariaLabel="Reset zoom"
            className="p-2 sm:p-2.5 rounded-lg bg-gray-600 hover:bg-gray-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            Icon={RotateCcw}
          />
        </div>
      </div>

      {/* Contenedor principal */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Área de imagen */}
        <div ref={containerRef} className="flex-1 relative overflow-hidden bg-gray-400">
          {/* Botón para abrir panel de comentarios en móvil */}
          <button
            onClick={() => setIsCommentsPanelOpen(true)}
            className="md:hidden absolute top-4 left-4 z-20 p-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-colors"
            aria-label="Ver comentarios"
          >
            <Menu size={20} />
            {commentsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {commentsCount}
              </span>
            )}
          </button>
          <TransformWrapper
            initialScale={1}
            minScale={0.5}
            maxScale={5}
            wheel={{ step: 0.1 }}
            doubleClick={{ disabled: true }}
            panning={{ 
              disabled: false,
              lockAxisX: false, 
              lockAxisY: false,
              velocityDisabled: false
            }}
            limitToBounds={false}
          >
            {({ zoomIn, zoomOut, resetTransform }) => {
              zoomFunctionsRef.current = { zoomIn, zoomOut, resetTransform };
              return (
              <>
                <TransformComponent wrapperClass="w-full h-full">
                  <div 
                    className="relative w-full h-full flex items-center justify-center bg-white"
                    onClick={handleImageClick}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    style={{ cursor: annotationMode ? 'crosshair' : 'default' }}
                  >
                    <img
                      ref={imageRef}
                      src={imageUrl}
                      alt={imageAlt}
                      className={`max-w-full max-h-full object-contain select-none ${
                        annotationMode ? 'cursor-crosshair' : 'cursor-grab'
                      }`}
                      draggable={false}
                    />
                    
                    {/* Renderizar marcadores */}
                    {annotations.map((annotation) => (
                      <div
                        key={annotation.id}
                        onClick={(e) => handleMarkerClick(annotation, e)}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                        style={{
                          left: `${annotation.x}%`,
                          top: `${annotation.y}%`,
                        }}
                      >
                        <div
                          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm sm:text-base shadow-lg transition-all touch-manipulation ${
                            annotation.text
                              ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                              : 'bg-gray-500 hover:bg-gray-600 active:bg-gray-700'
                          } ${
                            highlightedId === annotation.id
                              ? 'ring-4 ring-yellow-400 scale-125'
                              : ''
                          }`}
                        >
                          {annotation.id}
                        </div>
                        
                        {/* Tooltip con preview del comentario - Solo en desktop */}
                        {annotation.text && (
                          <div className="hidden sm:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                            <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 max-w-xs shadow-xl whitespace-normal">
                              <div className="font-semibold mb-1">Marcador {annotation.id}</div>
                              <div className="text-gray-300">{annotation.text}</div>
                            </div>
                            <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 mx-auto"></div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </TransformComponent>
                
                {/* Botones de zoom integrados */}
                <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
                  <button
                    onClick={() => zoomIn()}
                    className="p-3 sm:p-4 rounded-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-lg transition-colors touch-manipulation"
                    aria-label="Zoom in"
                  >
                    <Plus size={20} className="sm:w-6 sm:h-6" />
                  </button>
                  <button
                    onClick={() => zoomOut()}
                    className="p-3 sm:p-4 rounded-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-lg transition-colors touch-manipulation"
                    aria-label="Zoom out"
                  >
                    <Minus size={20} className="sm:w-6 sm:h-6" />
                  </button>
                  <button
                    onClick={() => resetTransform()}
                    className="p-3 sm:p-4 rounded-full bg-gray-600 hover:bg-gray-700 active:bg-gray-800 text-white shadow-lg transition-colors touch-manipulation"
                    aria-label="Reset zoom"
                  >
                    <RotateCcw size={20} className="sm:w-6 sm:h-6" />
                  </button>
                </div>
              </>
            );
            }}
          </TransformWrapper>
        </div>

        {/* Panel lateral de comentarios - Desktop siempre visible, móvil como drawer */}
        <div className={`
          w-full md:w-[20vw] md:max-w-[280px] md:min-w-[220px] md:relative fixed inset-y-0 right-0 z-30
          bg-white shadow-lg overflow-y-auto
          border-l border-gray-200
          transform transition-transform duration-300 ease-in-out
          ${isCommentsPanelOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
        `}>
          <div className="p-3 sm:p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800">
              Comentarios ({commentsCount})
            </h3>
            <button
              onClick={() => setIsCommentsPanelOpen(false)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-200 text-gray-600 transition-colors"
              aria-label="Cerrar panel"
            >
              <X size={20} />
            </button>
          </div>
          <div className="p-3 sm:p-4 space-y-3">
            {commentsWithText.map((annotation) => (
              <div
                key={annotation.id}
                onClick={() => {
                  handleListClick(annotation);
                  setIsCommentsPanelOpen(false);
                }}
                className="p-3 sm:p-4 rounded-lg border border-gray-200 hover:bg-blue-50 active:bg-blue-100 cursor-pointer transition-colors touch-manipulation"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-blue-600 text-white text-xs sm:text-sm font-semibold flex items-center justify-center flex-shrink-0">
                    {annotation.id}
                  </span>
                  <span className="text-xs sm:text-sm text-gray-500">
                    {formatDate(annotation.timestamp)}
                  </span>
                </div>
                <p className="text-sm sm:text-base text-gray-700">
                  {annotation.text}
                </p>
              </div>
            ))}
            {commentsCount === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm sm:text-base">No hay comentarios aún.</p>
                <p className="text-xs sm:text-sm mt-2">Haz click en la imagen para crear anotaciones.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Popup pequeño para agregar/editar comentario */}
      {popupPosition && selectedAnnotation && (
        <div 
          className="fixed z-50 transition-all duration-200"
          style={{
            left: `${popupPosition.x}px`,
            top: `${popupPosition.y + 40}px`,
            transform: 'translateX(-50%)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white rounded-lg shadow-2xl border border-gray-200 w-80 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-800 pr-2">
                Marcador {selectedAnnotation.id}
              </h3>
              <button
                onClick={handleCancel}
                className="p-1 rounded-lg hover:bg-gray-200 text-gray-600 transition-colors flex-shrink-0"
                aria-label="Cerrar"
              >
                <X size={16} />
              </button>
            </div>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Escribe tu comentario aquí..."
              className="w-full h-24 p-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
              autoFocus
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleSaveComment}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm"
              >
                <Save size={14} />
                Guardar
              </button>
              <button
                onClick={handleCancel}
                className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors font-medium text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
