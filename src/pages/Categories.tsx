import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Loader2, Image as ImageIcon } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const Categories = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', nameEn: '', nameAr: '', image: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data: categories, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => api.get('/categories', { params: { includeOutOfStock: 'true' } }).then(res => res.data),
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      let imageUrl = data.image;

      if (selectedFile) {
        setIsUploading(true);
        try {
          const uploadFormData = new FormData();
          uploadFormData.append('file', selectedFile);
          const uploadRes = await api.post('/admin/upload', uploadFormData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          imageUrl = uploadRes.data.url;
        } catch (error) {
          toast.error('Failed to upload image');
          throw error;
        } finally {
          setIsUploading(false);
        }
      }

      const payload = { ...data, image: imageUrl };
      if (selectedCategory) return api.put(`/categories/${selectedCategory.id}`, payload);
      return api.post('/categories', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      toast.success(`Category ${selectedCategory ? 'updated' : 'created'} successfully`);
      closeModal();
    },
    onError: () => toast.error('Failed to save category'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      toast.success('Category deleted');
    },
    onError: (error: any) => {
      console.error('Delete error:', error);
      const message = error.response?.status === 500 
        ? 'Failed to delete category. Ensure it has no products and is not referenced elsewhere.' 
        : 'Failed to delete category';
      toast.error(message);
    },
  });

  const openModal = (category: any = null) => {
    setSelectedCategory(category);
    setFormData(category ? { 
      name: category.name, 
      nameEn: category.nameEn || category.name || '',
      nameAr: category.nameAr || '',
      image: category.image || '' 
    } : { name: '', nameEn: '', nameAr: '', image: '' });
    setSelectedFile(null);
    setPreviewUrl(category?.image || '');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCategory(null);
    setSelectedFile(null);
    setPreviewUrl('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size exceeds 5MB');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  if (isLoading) return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={40} /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Categories</h1>
          <p className="text-slate-500 mt-1">Organize your products with categories</p>
        </div>
        <button onClick={() => openModal()} className="btn btn-primary flex items-center gap-2">
          <Plus size={20} /> Add Category
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories?.map((category: any) => (
          <div key={category.id} className="card group hover:shadow-md transition-all">
            <div className="aspect-video relative overflow-hidden bg-slate-100">
              <img src={category.image} alt={category.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                <h3 className="text-white font-bold text-xl">{category.name}</h3>
              </div>
            </div>
            <div className="p-4 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">{category.count || 0} Products</span>
              <div className="flex gap-2">
                <button onClick={() => openModal(category)} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all">
                  <Edit2 size={18} />
                </button>
                <button 
                  onClick={() => {
                    if (category.count > 0) {
                      toast.error(`Cannot delete category "${category.name}" because it contains ${category.count} products.`);
                      return;
                    }
                    deleteMutation.mutate(category.id);
                  }} 
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-6">{selectedCategory ? 'Edit Category' : 'New Category'}</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Category Name (English)</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                  value={formData.nameEn}
                  onChange={(e) => setFormData({ ...formData, nameEn: e.target.value, name: formData.name || e.target.value })}
                  placeholder="Electronics"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Category Name (Arabic)</label>
                <input 
                  type="text" 
                  dir="rtl"
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-right"
                  value={formData.nameAr}
                  onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                  placeholder="الإلكترونيات"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Category Image</label>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-video w-full rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-all overflow-hidden group relative"
                >
                  {previewUrl ? (
                    <>
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                        <ImageIcon className="text-white" size={32} />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center text-slate-400">
                      <ImageIcon size={32} className="mb-2" />
                      <span className="text-xs font-medium">Click to upload image</span>
                      <span className="text-[10px]">JPG, PNG, WebP up to 5MB</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={closeModal} className="flex-1 btn btn-outline">Cancel</button>
              <button 
                onClick={() => mutation.mutate(formData)} 
                disabled={mutation.isPending || isUploading}
                className="flex-1 btn btn-primary flex items-center justify-center gap-2"
              >
                {(mutation.isPending || isUploading) ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    <span>{isUploading ? 'Uploading...' : 'Saving...'}</span>
                  </>
                ) : 'Save Category'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Categories;
