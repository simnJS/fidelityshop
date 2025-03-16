import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { FaUpload, FaTrash, FaLink, FaCopy, FaImage, FaSpinner } from 'react-icons/fa';

const ImageUploadPage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Vérifier si l'utilisateur est connecté et admin
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session && session.user && !(session.user as any).isAdmin) {
      router.push('/dashboard');
    }
  }, [session, status, router]);

  // Charger la liste des images
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await fetch('/api/admin/images');
        if (response.ok) {
          const data = await response.json();
          setImages(data.images);
        } else {
          setErrorMessage('Erreur lors du chargement des images');
        }
      } catch (error) {
        setErrorMessage('Erreur de connexion au serveur');
      } finally {
        setLoading(false);
      }
    };

    if (session && (session.user as any).isAdmin) {
      fetchImages();
    }
  }, [session]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Créer un aperçu
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Réinitialiser les états
      setUploadSuccess(false);
      setUploadedImageUrl(null);
      setErrorMessage(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setErrorMessage('Veuillez sélectionner une image');
      return;
    }
    
    // Vérifier le type de fichier
    if (!selectedFile.type.startsWith('image/')) {
      setErrorMessage('Veuillez sélectionner un fichier image valide');
      return;
    }
    
    // Préparer le formulaire
    const formData = new FormData();
    formData.append('image', selectedFile);
    
    setUploading(true);
    setErrorMessage(null);
    
    try {
      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setUploadSuccess(true);
        setUploadedImageUrl(data.imageUrl);
        // Ajouter la nouvelle image à la liste
        setImages([...images, data.imageUrl]);
      } else {
        setErrorMessage(data.error || 'Erreur lors de l\'upload');
      }
    } catch (error) {
      setErrorMessage('Erreur de connexion au serveur');
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('URL copiée dans le presse-papiers');
  };

  const deleteImage = async (imagePath: string) => {
    if (confirm('Voulez-vous vraiment supprimer cette image ?')) {
      try {
        const filename = imagePath.split('/').pop();
        const response = await fetch(`/api/admin/delete-image?filename=${filename}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          // Mettre à jour la liste des images
          setImages(images.filter(img => img !== imagePath));
        } else {
          const data = await response.json();
          setErrorMessage(data.error || 'Erreur lors de la suppression');
        }
      } catch (error) {
        setErrorMessage('Erreur de connexion au serveur');
      }
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <FaSpinner className="animate-spin text-4xl text-blue-500" />
      </div>
    );
  }

  if (status === 'unauthenticated' || (session && !(session.user as any).isAdmin)) {
    return null; // Redirection gérée par useEffect
  }

  return (
    <>
      <Head>
        <title>Gestion des Images | Admin</title>
      </Head>

      <div className="container mx-auto px-4 py-8">
        <motion.h1 
          className="text-3xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Gestion des Images
        </motion.h1>

        <motion.div 
          className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <FaUpload className="mr-2 text-blue-500" />
            Upload d'image
          </h2>

          <form onSubmit={handleUpload} className="space-y-4">
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center hover:border-blue-500 transition-colors">
              <label className="cursor-pointer block">
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleFileChange}
                />
                {previewUrl ? (
                  <div className="relative mx-auto max-w-xs">
                    <img 
                      src={previewUrl} 
                      alt="Aperçu" 
                      className="mx-auto max-h-48 rounded-lg object-contain"
                    />
                    <p className="mt-2 text-sm text-gray-400">Cliquez pour changer d'image</p>
                  </div>
                ) : (
                  <div className="py-8">
                    <FaImage className="mx-auto text-4xl text-gray-500 mb-2" />
                    <p className="text-gray-400">Cliquez pour sélectionner une image</p>
                  </div>
                )}
              </label>
            </div>

            {errorMessage && (
              <div className="bg-red-900/20 text-red-400 p-3 rounded-lg">
                {errorMessage}
              </div>
            )}

            {uploadSuccess && (
              <div className="bg-green-900/20 text-green-400 p-3 rounded-lg">
                Image uploadée avec succès!
              </div>
            )}

            {uploadedImageUrl && (
              <div className="bg-gray-700 p-3 rounded-lg flex items-center justify-between">
                <div className="overflow-hidden overflow-ellipsis mr-2 flex-1">
                  <span className="text-sm text-gray-300">{uploadedImageUrl}</span>
                </div>
                <button 
                  type="button"
                  onClick={() => copyToClipboard(uploadedImageUrl)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded flex items-center text-sm"
                >
                  <FaCopy className="mr-1" /> Copier
                </button>
              </div>
            )}

            <button 
              type="submit"
              disabled={!selectedFile || uploading}
              className={`w-full py-2 px-4 rounded-lg flex items-center justify-center ${
                !selectedFile
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {uploading ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Upload en cours...
                </>
              ) : (
                <>
                  <FaUpload className="mr-2" />
                  Uploader l'image
                </>
              )}
            </button>
          </form>
        </motion.div>

        <motion.div 
          className="bg-gray-800 rounded-lg p-6 border border-gray-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-xl font-semibold mb-4">Images Uploadées</h2>

          {images.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Aucune image n'a été uploadée</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image, index) => (
                <motion.div 
                  key={index}
                  className="bg-gray-700 rounded-lg overflow-hidden border border-gray-600 hover:border-blue-500 transition-all"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * index }}
                  whileHover={{ y: -5 }}
                >
                  <div className="aspect-square relative">
                    <img 
                      src={image} 
                      alt={`Image ${index}`}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3">
                    <div className="flex justify-between mb-2">
                      <button 
                        onClick={() => copyToClipboard(image)}
                        className="text-blue-400 hover:text-blue-300 flex items-center text-sm"
                      >
                        <FaCopy className="mr-1" /> Copier URL
                      </button>
                      <button 
                        onClick={() => deleteImage(image)}
                        className="text-red-400 hover:text-red-300 flex items-center text-sm"
                      >
                        <FaTrash className="mr-1" /> Supprimer
                      </button>
                    </div>
                    <div className="text-xs text-gray-400 truncate">
                      {image.split('/').pop()}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </>
  );
};

export default ImageUploadPage; 