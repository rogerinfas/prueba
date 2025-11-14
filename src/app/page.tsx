import ImageAnnotator from '@/components/ImageAnnotator';

export default function Home() {
  // Imagen local desde la carpeta public
  const imageUrl = '/1010-595-max.png';

  return (
    <div className="w-full h-screen bg-gray-300">
      <ImageAnnotator 
        imageUrl={imageUrl}
        imageAlt="Dibujo técnico de moda - Blusa cropped"
      />
    </div>
  );
}