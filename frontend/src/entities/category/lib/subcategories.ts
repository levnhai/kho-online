import { Category, SubCategory } from '@/shared/types';

/**
 * Lấy danh sách thể loại con (Subcategories) từ dữ liệu Category trong Database.
 * Không còn dùng dữ liệu hardcode tĩnh. Dữ liệu được tải trực tiếp từ MongoDB thông qua API.
 */
export const getSubcategories = (cat?: Category | null): SubCategory[] => {
  if (!cat || !cat.subcategories || !Array.isArray(cat.subcategories) || cat.subcategories.length === 0) {
    return [];
  }

  return cat.subcategories.map((sub: any, idx: number) => {
    if (typeof sub === 'string') {
      const cleanName = sub.trim();
      const slug = cleanName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'd')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      return {
        id: `${cat.slug || cat._id}-sub-${idx}`,
        name: cleanName,
        slug: slug || `sub-${idx}`,
        keyword: cleanName.split(' ')[0] || cleanName,
      };
    }
    return sub;
  });
};
