import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { categoriaService } from '../services/api';
import { log } from '../utils/logger';

/**
 * Reusable CategoryFilter component
 * Fetches categories from backend API and provides filtering functionality
 * Synchronizes category selection across pages using URL parameters
 */
function CategoryFilter({ onCategoryChange, selectedCategories = [], multiSelect = true, showAllOption = true }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  // Load categories from API on component mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Sync with URL params when they change
  useEffect(() => {
    const categoriaParam = searchParams.get('categoria');
    if (categoriaParam && categories.length > 0) {
      const category = categories.find(cat => cat.Nome?.toLowerCase() === categoriaParam.toLowerCase());
      if (category && !selectedCategories.some(sc => sc.value === category.Nome)) {
        // Auto-select category from URL if not already selected
        handleCategorySelect(category);
      }
    }
  }, [searchParams, categories, selectedCategories]);

  /**
   * Load categories from the backend API
   */
  const loadCategories = async () => {
    try {
      setLoading(true);
      log.info('category_filter_load_start');
      const response = await categoriaService.listar();

      // Map API response to component format
      const mappedCategories = (response.categorias || response).map(categoria => ({
        id: categoria.CategoriaID || categoria.id,
        label: categoria.Nome || categoria.nome,
        value: categoria.Nome || categoria.nome,
        count: categoria._count?.produtos || 0
      }));

      setCategories(mappedCategories);
      log.info('category_filter_load_success', { total: mappedCategories.length });
    } catch (error) {
      log.error('category_filter_load_error', { error: error.message });
      // Fallback to empty array - component will handle gracefully
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle category selection/deselection
   * Updates URL params for synchronization and calls onCategoryChange callback
   */
  const handleCategorySelect = (category) => {
    let newSelected;

    if (multiSelect) {
      // Multi-select logic
      const isSelected = selectedCategories.some(sc => sc.value === category.value);
      if (isSelected) {
        // Remove category
        newSelected = selectedCategories.filter(sc => sc.value !== category.value);
      } else {
        // Add category
        newSelected = [...selectedCategories, {
          type: 'category',
          label: category.label,
          value: category.value
        }];
      }
    } else {
      // Single-select logic (for explorer page)
      newSelected = selectedCategories.some(sc => sc.value === category.value) ? [] : [{
        type: 'category',
        label: category.label,
        value: category.value
      }];
    }

    // Update URL params for synchronization
    const params = new URLSearchParams(searchParams);
    if (newSelected.length > 0) {
      params.set('categoria', newSelected[0].value); // Use first selected for URL param
    } else {
      params.delete('categoria');
    }
    setSearchParams(params);

    // Call parent callback
    if (onCategoryChange) {
      onCategoryChange(newSelected);
    }
  };

  /**
   * Check if a category is currently selected
   */
  const isCategorySelected = (categoryValue) => {
    return selectedCategories.some(sc => sc.value === categoryValue);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-sm text-slate-600">Carregando categorias...</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {showAllOption && (
        <button
          onClick={() => handleCategorySelect({ value: 'all', label: 'Todas as Categorias' })}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
            selectedCategories.length === 0
              ? 'bg-blue-100 text-blue-800 border border-blue-200'
              : 'text-slate-700 hover:bg-slate-50 border border-transparent hover:border-slate-200'
          }`}
        >
          Todas as Categorias
        </button>
      )}

      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => handleCategorySelect(category)}
          disabled={category.count === 0}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
            isCategorySelected(category.value)
              ? 'bg-blue-100 text-blue-800 border border-blue-200'
              : 'text-slate-700 hover:bg-slate-50 border border-transparent hover:border-slate-200'
          } ${category.count === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="flex items-center justify-between">
            <span>{category.label}</span>
            {category.count > 0 && (
              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {category.count}
              </span>
            )}
          </div>
        </button>
      ))}

      {categories.length === 0 && !loading && (
        <p className="text-sm text-slate-500 py-2">Nenhuma categoria disponível</p>
      )}
    </div>
  );
}

export default CategoryFilter;