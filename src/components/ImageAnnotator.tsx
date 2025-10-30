'use client';

import React, { useState, useRef, useCallback } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Plus, Minus, RotateCcw, X, Save, PenTool } from 'lucide-react';

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

export default function ImageAnnotator({ imageUrl, imageAlt = 'Annotated image' }: ImageAnnotatorProps) {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedAnnotation, setSelectedAnnotation] = useState<Annotation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const [annotationMode, setAnnotationMode] = useState(true); // Modo anotación activado por defecto
  const zoomFunctionsRef = useRef<{
    zoomIn: () => void;
    zoomOut: () => void;
    resetTransform: () => void;
  } | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null);

  const handleImageClick = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
    // Si fue un drag, no crear anotación
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      return;
    }

    if (!imageRef.current) return;

    e.stopPropagation();
    e.preventDefault();

    const rect = imageRef.current.getBoundingClientRect();
    
    // Calcular posición relativa a la imagen
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Crear nueva anotación
    const newAnnotation: Annotation = {
      id: annotations.length + 1,
      x,
      y,
      text: '',
      timestamp: new Date(),
    };

    setAnnotations([...annotations, newAnnotation]);
    setSelectedAnnotation(newAnnotation);
    setCommentText('');
    setIsModalOpen(true);
  }, [annotations]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
    mouseDownPosRef.current = { x: e.clientX, y: e.clientY };
    isDraggingRef.current = false;
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
    if (mouseDownPosRef.current) {
      const dx = Math.abs(e.clientX - mouseDownPosRef.current.x);
      const dy = Math.abs(e.clientY - mouseDownPosRef.current.y);
      // Si se movió más de 5px, es un drag
      if (dx > 5 || dy > 5) {
        isDraggingRef.current = true;
      }
    }
  }, []);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
    mouseDownPosRef.current = null;
  }, []);

  const handleMarkerClick = useCallback((annotation: Annotation, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedAnnotation(annotation);
    setCommentText(annotation.text);
    setIsModalOpen(true);
  }, []);

  const handleSaveComment = useCallback(() => {
    if (!selectedAnnotation) return;

    const updatedAnnotations = annotations.map(ann =>
      ann.id === selectedAnnotation.id
        ? { ...ann, text: commentText, timestamp: ann.text ? ann.timestamp : new Date() }
        : ann
    );

    setAnnotations(updatedAnnotations);
    setIsModalOpen(false);
    setSelectedAnnotation(null);
    setCommentText('');
  }, [selectedAnnotation, commentText, annotations]);

  const handleCancel = useCallback(() => {
    if (!selectedAnnotation) return;

    // Si no hay texto, eliminar la anotación
    if (!selectedAnnotation.text && !commentText) {
      setAnnotations(annotations.filter(ann => ann.id !== selectedAnnotation.id));
    }

    setIsModalOpen(false);
    setSelectedAnnotation(null);
    setCommentText('');
  }, [selectedAnnotation, commentText, annotations]);

  const handleListClick = useCallback((annotation: Annotation) => {
    setHighlightedId(annotation.id);
    setTimeout(() => setHighlightedId(null), 2000);
  }, []);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="w-full h-screen flex flex-col bg-gradient-to-br from-blue-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header con controles de zoom */}
      <div className="bg-white dark:bg-gray-800 shadow-md p-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
          Visor de Imágenes con Anotaciones
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAnnotationMode(!annotationMode)}
            className={`p-2 rounded-lg transition-colors ${
              annotationMode
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-300 hover:bg-gray-400 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200'
            }`}
            aria-label="Toggle annotation mode"
            title={annotationMode ? 'Modo anotación activo - Click en imagen para anotar' : 'Click para activar modo anotación'}
          >
            <PenTool size={20} />
          </button>
          <button
            onClick={() => zoomFunctionsRef.current?.zoomIn()}
            className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Zoom in"
            disabled={!zoomFunctionsRef.current}
          >
            <Plus size={20} />
          </button>
          <button
            onClick={() => zoomFunctionsRef.current?.zoomOut()}
            className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Zoom out"
            disabled={!zoomFunctionsRef.current}
          >
            <Minus size={20} />
          </button>
          <button
            onClick={() => zoomFunctionsRef.current?.resetTransform()}
            className="p-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Reset zoom"
            disabled={!zoomFunctionsRef.current}
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </div>

      {/* Contenedor principal */}
      <div className="flex-1 flex overflow-hidden">
        {/* Área de imagen */}
        <div ref={containerRef} className="flex-1 relative overflow-hidden bg-gray-200 dark:bg-gray-900">
          <TransformWrapper
            initialScale={1}
            minScale={0.5}
            maxScale={5}
            wheel={{ step: 0.1 }}
            doubleClick={{ disabled: true }}
            panning={{ 
              disabled: annotationMode, // Deshabilitar pan cuando está en modo anotación
              lockAxisX: false, 
              lockAxisY: false,
              velocityDisabled: false
            }}
            limitToBounds={false}
          >
            {({ zoomIn, zoomOut, resetTransform }) => {
              // Guardar funciones de zoom para usar en el header
              zoomFunctionsRef.current = { zoomIn, zoomOut, resetTransform };
              return (
              <>
                <TransformComponent wrapperClass="w-full h-full">
                  <div 
                    className="relative w-full h-full flex items-center justify-center"
                    onClick={(e) => {
                      if (!annotationMode || !imageRef.current) return;
                      
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
                      setIsModalOpen(true);
                    }}
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
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-lg transition-all ${
                            annotation.text
                              ? 'bg-blue-600 hover:bg-blue-700'
                              : 'bg-gray-500 hover:bg-gray-600'
                          } ${
                            highlightedId === annotation.id
                              ? 'ring-4 ring-yellow-400 scale-125'
                              : ''
                          }`}
                        >
                          {annotation.id}
                        </div>
                        
                        {/* Tooltip con preview del comentario */}
                        {annotation.text && (
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
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
                    className="p-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-colors"
                    aria-label="Zoom in"
                  >
                    <Plus size={20} />
                  </button>
                  <button
                    onClick={() => zoomOut()}
                    className="p-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-colors"
                    aria-label="Zoom out"
                  >
                    <Minus size={20} />
                  </button>
                  <button
                    onClick={() => resetTransform()}
                    className="p-3 rounded-full bg-gray-600 hover:bg-gray-700 text-white shadow-lg transition-colors"
                    aria-label="Reset zoom"
                  >
                    <RotateCcw size={20} />
                  </button>
                </div>
              </>
            );
            }}
          </TransformWrapper>
        </div>

        {/* Panel lateral de comentarios */}
        <div className="w-80 bg-white dark:bg-gray-800 shadow-lg overflow-y-auto border-l border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Comentarios ({annotations.filter(a => a.text).length})
            </h3>
          </div>
          <div className="p-4 space-y-3">
            {annotations
              .filter(a => a.text)
              .map((annotation) => (
                <div
                  key={annotation.id}
                  onClick={() => handleListClick(annotation)}
                  className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-semibold flex items-center justify-center">
                      {annotation.id}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(annotation.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {annotation.text}
                  </p>
                </div>
              ))}
            {annotations.filter(a => a.text).length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>No hay comentarios aún.</p>
                <p className="text-sm mt-2">Haz click en la imagen para crear anotaciones.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal para agregar/editar comentario */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                {selectedAnnotation?.text ? 'Editar' : 'Agregar'} Comentario - Marcador {selectedAnnotation?.id}
              </h3>
              <button
                onClick={handleCancel}
                className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>
            </div>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Escribe tu comentario aquí..."
              className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200"
              autoFocus
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleSaveComment}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                <Save size={18} />
                Guardar
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg transition-colors font-medium"
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
