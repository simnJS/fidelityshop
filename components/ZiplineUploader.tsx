import React, { useState, useRef } from 'react';
import axios from 'axios';
import { FiUpload, FiX, FiCheck, FiClipboard, FiImage } from 'react-icons/fi';

interface ZiplineUploaderProps {
  onUploadComplete?: (url: string) => void;
  className?: string;
}

const CDN_UPLOAD_URL = 'https://cdn.simnjs.fr/api/upload';
const CDN_AUTH_TOKEN = 'MTc0MjEzODIyMzM5Mw==.ODQ2NjI0NDhiMzRkNmI4MzQwOTI2MTBkNzE1NjI0NWEuMzIwOGNmODY0Y2E2NTE3ZWJmZDJhZWQ0N2QxNmQ3MmRlZDc3YjQ0MWMwNTA2NmE4ZmU4YWI3ZGI1Mjc5ZGVjOWM5ODI4ZTZiZDU3YmRmNDJiMjUxNmYxMjM3MmFlYzlkZGUxYTQzMWRkY2Y3NGQ3NmMwZjJmODUyYmRjNmZmYzdkYzNjYzVhNzE1NTI0YTU5MWY3ZTVlNDMwNzdhMGQxOQ==';

export default function ZiplineUploader({ onUploadComplete, className = '' }: ZiplineUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    setUploadedUrl(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(CDN_UPLOAD_URL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': CDN_AUTH_TOKEN
        }
      });

      if (response.data && response.data.files && response.data.files.length > 0) {
        const imageUrl = response.data.files[0].url;
        setUploadedUrl(imageUrl);
        if (onUploadComplete) {
          onUploadComplete(imageUrl);
        }
      } else {
        throw new Error('Format de réponse inattendu');
      }
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      setUploadError('Erreur lors de l\'upload de l\'image. Veuillez réessayer.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUpload(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const copyToClipboard = () => {
    if (uploadedUrl) {
      navigator.clipboard.writeText(uploadedUrl)
        .then(() => {
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
        })
        .catch(err => {
          console.error('Erreur lors de la copie:', err);
        });
    }
  };

  return (
    <div className={`${className}`}>
      <div 
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragging 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*"
        />
        
        {isUploading ? (
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-3"></div>
            <p className="text-gray-500 dark:text-gray-400">Upload en cours...</p>
          </div>
        ) : uploadedUrl ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <img 
                  src={uploadedUrl} 
                  alt="Image uploadée" 
                  className="max-h-40 object-contain"
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center mt-2 bg-gray-100 dark:bg-gray-800 rounded px-3 py-2">
                <input 
                  type="text" 
                  value={uploadedUrl} 
                  readOnly 
                  className="bg-transparent flex-grow text-sm text-gray-700 dark:text-gray-300 outline-none overflow-hidden text-ellipsis"
                />
                <button 
                  onClick={copyToClipboard} 
                  className="ml-2 text-blue-500 hover:text-blue-700 focus:outline-none"
                  title="Copier l'URL"
                >
                  {isCopied ? <FiCheck /> : <FiClipboard />}
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {isCopied ? "URL copiée !" : "Cliquez sur l'icône pour copier l'URL"}
              </p>
            </div>
            
            <button
              onClick={() => {
                setUploadedUrl(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="text-blue-500 hover:text-blue-700 text-sm flex items-center justify-center space-x-1 mx-auto"
            >
              <FiX size={16} />
              <span>Uploader une autre image</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-center">
              <FiImage className="text-gray-400 dark:text-gray-500" size={48} />
            </div>
            <div className="space-y-2">
              <p className="text-gray-700 dark:text-gray-300 font-medium">
                Glissez-déposez une image ici
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                ou
              </p>
              <button
                type="button"
                onClick={handleBrowseClick}
                className="inline-flex items-center space-x-2 text-sm font-medium text-blue-500 hover:text-blue-700"
              >
                <FiUpload size={16} />
                <span>Parcourir les fichiers</span>
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              PNG, JPG ou GIF (max. 10MB)
            </p>
          </div>
        )}
        
        {uploadError && (
          <div className="mt-3 text-red-500 text-sm">
            {uploadError}
          </div>
        )}
      </div>
    </div>
  );
} 