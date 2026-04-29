import React, { useState, useRef } from 'react';
import { ArrowLeft, Camera, User, Mail, Phone, Car, Hash, Palette, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function EditProfile() {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const isDriver = userData?.role === 'driver';
  
  // Reference for the hidden file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States for the form
  const [formData, setFormData] = useState({
    name: userData?.displayName || 'PAKO',
    email: userData?.email || 'pakodilla3@gmail.com',
    phone: '+52 998 123 4567',
    vehicle: 'Nissan Versa 2022',
    plates: 'ABC-123-D',
    color: 'Plata',
    capacity: '4'
  });

  // State for the selected profile image file (ready for backend upload)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // State for the preview URL to show the image instantly in the UI
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Create a local URL for the preview image
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const handleTriggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // TODO: [Backend] Implement profile update logic here.
    // 1. Update text fields in standard user document based on `formData`.
    // 2. If `selectedFile` is not null, upload it to Firebase Storage (or other service).
    // 3. Get the uploaded image URL and attach it to the user's document.
    
    console.log("Datos a guardar:", formData);
    console.log("Archivo a subir:", selectedFile);

    alert('¡Perfil actualizado con éxito!');
    navigate('/profile');
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] dark:bg-zinc-900 text-[#2d3748] dark:text-zinc-100 pb-24 font-sans flex flex-col transition-colors duration-200">
      
      {/* Header con botón de regreso */}
      <header className="bg-white dark:bg-zinc-800 px-4 py-4 sticky top-0 z-10 shadow-sm flex items-center gap-4 transition-colors duration-200">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-full transition-colors"
        >
          <ArrowLeft size={24} className="text-[#2d3748] dark:text-zinc-100" />
        </button>
        <h1 className="text-[18px] font-bold text-[#2d3748] dark:text-zinc-100">Editar Perfil</h1>
      </header>

      <main className="p-4 md:p-8 max-w-[600px] mx-auto w-full flex-1">
        
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Foto de Perfil */}
          <div className="flex flex-col items-center mt-4 mb-8">
            <div className="relative">
              <div className="w-28 h-28 bg-[#00d4aa] rounded-full flex items-center justify-center text-white shadow-md shadow-[#00d4aa]/20 overflow-hidden">
                {imagePreview ? (
                  <img src={imagePreview} alt="Vista previa" className="w-full h-full object-cover" />
                ) : (
                  <User size={56} />
                )}
              </div>
              <button 
                type="button"
                onClick={handleTriggerFileInput}
                className="absolute bottom-0 right-0 bg-white dark:bg-zinc-800 p-2.5 rounded-full shadow-lg border border-gray-100 dark:border-zinc-700 text-[#4a5568] dark:text-zinc-300 hover:text-[#00d4aa] dark:hover:text-[#00d4aa] transition-colors z-10 cursor-pointer"
              >
                <Camera size={20} />
              </button>
              
              {/* Hidden file input */}
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef} 
                onChange={handleImageChange} 
                className="hidden" 
              />
            </div>
            <span className="text-[13px] text-[#718096] dark:text-zinc-400 mt-3 font-medium">Toca para cambiar la foto</span>
          </div>

          {/* Campos del Formulario */}
          <div className="bg-white dark:bg-zinc-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-zinc-700 space-y-5 transition-colors duration-200">
            
            {/* Nombre */}
            <div>
              <label className="block text-[12px] font-bold text-[#718096] dark:text-zinc-400 uppercase tracking-wider mb-2">
                Nombre Completo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={18} className="text-[#a0aec0] dark:text-zinc-500" />
                </div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-[#f8fafc] dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-[15px] font-medium text-[#2d3748] dark:text-zinc-100 focus:outline-none focus:border-[#00d4aa] focus:ring-1 focus:ring-[#00d4aa] transition-all"
                  placeholder="Tu nombre"
                />
              </div>
            </div>

            {/* Correo */}
            <div>
              <label className="block text-[12px] font-bold text-[#718096] dark:text-zinc-400 uppercase tracking-wider mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={18} className="text-[#a0aec0] dark:text-zinc-500" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-[#f8fafc] dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-[15px] font-medium text-[#2d3748] dark:text-zinc-100 focus:outline-none focus:border-[#00d4aa] focus:ring-1 focus:ring-[#00d4aa] transition-all"
                  placeholder="tu@correo.com"
                />
              </div>
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-[12px] font-bold text-[#718096] dark:text-zinc-400 uppercase tracking-wider mb-2">
                Teléfono
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone size={18} className="text-[#a0aec0] dark:text-zinc-500" />
                </div>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-[#f8fafc] dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-[15px] font-medium text-[#2d3748] dark:text-zinc-100 focus:outline-none focus:border-[#00d4aa] focus:ring-1 focus:ring-[#00d4aa] transition-all"
                  placeholder="+52 000 000 0000"
                />
              </div>
            </div>

          </div>

          {/* Datos del Vehículo (Solo visible para conductores) */}
          {isDriver && (
            <div className="bg-white dark:bg-zinc-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-zinc-700 space-y-5 transition-colors duration-200">
              <h3 className="text-[15px] font-bold text-[#2d3748] dark:text-zinc-100 mb-4 border-b border-gray-100 dark:border-zinc-700 pb-2">Datos del Vehículo</h3>
              
              {/* Vehículo */}
              <div>
                <label className="block text-[12px] font-bold text-[#718096] dark:text-zinc-400 uppercase tracking-wider mb-2">
                  Modelo del Vehículo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Car size={18} className="text-[#a0aec0] dark:text-zinc-500" />
                  </div>
                  <input
                    type="text"
                    name="vehicle"
                    value={formData.vehicle}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-[#f8fafc] dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-[15px] font-medium text-[#2d3748] dark:text-zinc-100 focus:outline-none focus:border-[#00d4aa] focus:ring-1 focus:ring-[#00d4aa] transition-all"
                    placeholder="Ej. Nissan Versa 2022"
                  />
                </div>
              </div>

              {/* Placas */}
              <div>
                <label className="block text-[12px] font-bold text-[#718096] dark:text-zinc-400 uppercase tracking-wider mb-2">
                  Placas
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Hash size={18} className="text-[#a0aec0] dark:text-zinc-500" />
                  </div>
                  <input
                    type="text"
                    name="plates"
                    value={formData.plates}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-[#f8fafc] dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-[15px] font-medium text-[#2d3748] dark:text-zinc-100 uppercase focus:outline-none focus:border-[#00d4aa] focus:ring-1 focus:ring-[#00d4aa] transition-all"
                    placeholder="ABC-123-D"
                  />
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="block text-[12px] font-bold text-[#718096] dark:text-zinc-400 uppercase tracking-wider mb-2">
                  Color del Vehículo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Palette size={18} className="text-[#a0aec0] dark:text-zinc-500" />
                  </div>
                  <input
                    type="text"
                    name="color"
                    value={formData.color}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-[#f8fafc] dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-[15px] font-medium text-[#2d3748] dark:text-zinc-100 focus:outline-none focus:border-[#00d4aa] focus:ring-1 focus:ring-[#00d4aa] transition-all"
                    placeholder="Ej. Plata, Blanco, Rojo"
                  />
                </div>
              </div>

              {/* Capacidad */}
              <div>
                <label className="block text-[12px] font-bold text-[#718096] dark:text-zinc-400 uppercase tracking-wider mb-2">
                  Capacidad (Pasajeros)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Users size={18} className="text-[#a0aec0] dark:text-zinc-500" />
                  </div>
                  <input
                    type="number"
                    name="capacity"
                    min="1"
                    max="6"
                    value={formData.capacity}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-[#f8fafc] dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-[15px] font-medium text-[#2d3748] dark:text-zinc-100 focus:outline-none focus:border-[#00d4aa] focus:ring-1 focus:ring-[#00d4aa] transition-all"
                    placeholder="Ej. 4"
                  />
                </div>
              </div>

            </div>
          )}

          {/* Botón Guardar */}
          <button 
            type="submit"
            className="w-full mt-6 bg-[#00d4aa] hover:bg-[#00bfa0] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 text-[16px] shadow-md shadow-[#00d4aa]/20 transition-colors"
          >
            Guardar Cambios
          </button>

        </form>

      </main>
    </div>
  );
}
