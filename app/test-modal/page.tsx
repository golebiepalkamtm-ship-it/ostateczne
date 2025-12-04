'use client';

import { useState } from 'react';
import ImageModal from '@/components/ImageModal';

export default function TestModalPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<any>(null);

  const handleImageClick = () => {
    console.log('Test Modal: Image clicked, opening modal...');
    setSelectedImage({
      id: 'test-image-1',
      src: '/logo.png',
      alt: 'Test Image 1'
    });
    setModalOpen(true);
    console.log('Test Modal: Modal state set to true');
  };

  const handleClose = () => {
    console.log('Test Modal: Closing modal');
    setModalOpen(false);
    setSelectedImage(null);
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Test Modal Page</h1>
      
      <div className="space-y-8">
        <div>
          <h2 className="text-xl mb-4">Test Image Click</h2>
          <img
            src="/logo.png"
            alt="Test Logo"
            className="w-32 h-32 cursor-pointer border-2 border-blue-500 hover:border-blue-300"
            onClick={handleImageClick}
          />
          <p className="text-sm text-gray-400 mt-2">Click the logo to test modal</p>
        </div>

        <div className="bg-gray-800 p-4 rounded">
          <h3 className="text-lg mb-2">Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Click the logo image above</li>
            <li>You should see a 4-second animation of the image flying to center</li>
            <li>After animation, modal should appear with black background</li>
            <li>Modal should show controls: zoom, navigation, close</li>
          </ol>
          <div className="mt-4">
            <strong>Status:</strong> 
            <span className={modalOpen ? 'text-green-400' : 'text-red-400'}>
              {modalOpen ? 'Modal OPEN' : 'Modal CLOSED'}
            </span>
          </div>
        </div>
      </div>

      {/* Test Modal */}
      {modalOpen && selectedImage && (
        <ImageModal
          image={selectedImage}
          onClose={handleClose}
          sourceElement={null} // No source element for test
        />
      )}
    </div>
  );
}