using appoint.Models;

namespace appoint.Services;

public interface IServiceCategoryRepository
{
    // Obtiene todas las categorías de servicio
    Task<IEnumerable<ServiceCategoryModel>> GetAllServiceCategoriesAsync();

    // Obtiene una categoría de servicio por su ID
    Task<ServiceCategoryModel?> GetServiceCategoryByIdAsync(Guid categoryId);

    // Añade una nueva categoría de servicio
    Task<Guid> AddServiceCategoryAsync(ServiceCategoryModel category);

    // Actualiza una categoría de servicio existente
    Task UpdateServiceCategoryAsync(ServiceCategoryModel category);

    // Elimina una categoría de servicio por su ID
    Task DeleteServiceCategoryAsync(Guid categoryId);
}