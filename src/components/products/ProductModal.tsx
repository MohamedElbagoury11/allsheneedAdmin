import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Loader2, Plus, Trash2, Camera, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/api';
import toast from 'react-hot-toast';

const ProductModal = ({ isOpen, onClose, product }: any) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<any>({
    name: '',
    nameEn: '',
    nameAr: '',
    description: '',
    descriptionEn: '',
    descriptionAr: '',
    price: '',
    category: '',
    images: [],
    stock: '',
    specifications: {},
    discountPrice: '',
    onSale: false,
  });
  const [selectedFiles, setSelectedFiles] = useState<(File | string)[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const { data: categories } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => api.get('/categories').then(res => res.data),
  });

  useEffect(() => {
    if (product) {
      setFormData({
        ...product,
        nameEn: product.nameEn || product.name || '',
        nameAr: product.nameAr || '',
        descriptionEn: product.descriptionEn || product.description || '',
        descriptionAr: product.descriptionAr || '',
        images: product.images || [],
        discountPrice: product.discountPrice || '',
        onSale: !!product.onSale,
      });
      setSelectedFiles(product.images || []);
    } else {
      setFormData({
        name: '',
        nameEn: '',
        nameAr: '',
        description: '',
        descriptionEn: '',
        descriptionAr: '',
        price: '',
        category: '',
        images: [],
        stock: '',
        specifications: {},
        discountPrice: '',
        onSale: false,
      });
      setSelectedFiles([]);
    }
  }, [product, isOpen]);

  const mutation = useMutation({
    mutationFn: (data: any) => {
      if (product) {
        return api.put(`/products/${product.id}`, data);
      }
      return api.post('/products', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success(`Product ${product ? 'updated' : 'created'} successfully`);
      onClose();
    },
    onError: () => toast.error(`Failed to ${product ? 'update' : 'create'} product`),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.description.length < 10) {
      toast.error('Description must be at least 10 characters');
      return;
    }

    setIsUploading(true);
    try {
      const uploadedUrls = await Promise.all(
        selectedFiles.map(async (file) => {
          if (typeof file === 'string') return file;
          
          const uploadFormData = new FormData();
          uploadFormData.append('file', file);
          const res = await api.post('/admin/upload', uploadFormData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          return res.data.url;
        })
      );

      mutation.mutate({
        ...formData,
        images: uploadedUrls,
        categoryName: formData.category,
        category: undefined,
        price: Number(formData.price),
        discountPrice: formData.discountPrice ? Number(formData.discountPrice) : undefined,
        stock: Number(formData.stock),
        onSale: !!formData.onSale,
      });
    } catch (error) {
      toast.error('Failed to upload some images');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 5MB`);
        return false;
      }
      return true;
    });
    setSelectedFiles([...selectedFiles, ...validFiles]);
  };

  const removeImage = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-xl font-bold text-slate-900">
            {product ? 'Edit Product' : 'Add New Product'}
          </h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Product Name (English)</label>
              <input
                required
                type="text"
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                value={formData.nameEn}
                onChange={(e) => setFormData({ ...formData, nameEn: e.target.value, name: formData.name || e.target.value })}
                placeholder="Sony WH-1000XM4"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Product Name (Arabic)</label>
              <input
                type="text"
                dir="rtl"
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-right"
                value={formData.nameAr}
                onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                placeholder="سماعات سوني"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Category</label>
              <select
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none bg-white"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="">Select Category</option>
                {categories?.map((c: any) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Description (English)</label>
              <textarea
                required
                rows={3}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                value={formData.descriptionEn}
                onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value, description: formData.description || e.target.value })}
                placeholder="Industry-leading noise cancelling headphones..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Description (Arabic)</label>
              <textarea
                rows={3}
                dir="rtl"
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none text-right"
                value={formData.descriptionAr}
                onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                placeholder="تفاصيل المنتج..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Price ($)</label>
              <input
                required
                type="number"
                step="0.01"
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="349.99"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Stock Quantity</label>
              <input
                required
                type="number"
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                placeholder="50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-blue-900">Discount Price ($)</label>
              <input
                type="number"
                step="0.01"
                className="w-full px-4 py-2 border border-blue-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                value={formData.discountPrice}
                onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value })}
                placeholder="299.99"
              />
              <p className="text-[10px] text-blue-600">Leave empty if no discount</p>
            </div>
            <div className="flex items-center gap-3 h-full pt-6">
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={formData.onSale}
                  onChange={(e) => setFormData({ ...formData, onSale: e.target.checked })}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ms-3 text-sm font-semibold text-blue-900 uppercase tracking-wider">On Sale</span>
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-700">Product Images</label>
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                className="text-primary text-xs font-bold hover:underline flex items-center gap-1"
              >
                <Plus size={14} /> Add Images
              </button>
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              multiple 
              accept="image/*" 
              onChange={handleFileChange}
            />

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {selectedFiles.map((file, index) => (
                <div key={index} className="aspect-square relative rounded-xl overflow-hidden group border border-slate-100 bg-slate-50">
                  <img 
                    src={typeof file === 'string' ? file : URL.createObjectURL(file)} 
                    alt="" 
                    className="w-full h-full object-cover" 
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-100 hover:border-primary/50 hover:text-primary transition-all"
              >
                <Plus size={24} className="mb-1" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Add Image</span>
              </button>
            </div>
          </div>
        </form>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 btn btn-outline">
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={mutation.isPending || isUploading}
            className="flex-1 btn btn-primary flex items-center justify-center gap-2"
          >
            {(mutation.isPending || isUploading) ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                <span>{isUploading ? 'Uploading...' : 'Saving...'}</span>
              </>
            ) : (product ? 'Update Product' : 'Create Product')}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ProductModal;
