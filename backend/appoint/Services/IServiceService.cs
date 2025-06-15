using appoint.Domain.Request;
using appoint.Models;

namespace appoint.Services;

public interface IServiceService
{
    // Obtiene una lista de todos los servicios para la tabla principal.
    Task<IEnumerable<ServiceListItemModel>> GetAllServicesAsync(string? statusFilter = null);

    // Obtiene los detalles completos de un servicio por su ID.
    Task<ServiceModel?> GetServiceDetailsAsync(Guid serviceId);

    // Crea un nuevo servicio y lo asocia a los doctores seleccionados.
    Task<Guid> CreateServiceAsync(ServiceCreateRequest request);

    // Actualiza un servicio existente y sincroniza sus doctores asociados.
    Task UpdateServiceAsync(Guid serviceId, ServiceUpdateRequest request);

    // Elimina un servicio por su ID.
    Task DeleteServiceAsync(Guid serviceId);

    // Cambia el estado de un servicio (ej. "Active", "Inactive").
    Task UpdateServiceStatusAsync(Guid serviceId, string status);

    // Obtiene los servicios ofrecidos por un doctor específico (para el dropdown en citas).
    Task<IEnumerable<ServiceModel>> GetServicesByDoctorIdAsync(Guid doctorId);

    // Obtiene el precio de un servicio por su ID.
    Task<decimal?> GetServiceChargeByIdAsync(Guid serviceId);
    
    // Obtiene todas las categorías de servicio disponibles (para dropdowns de selección).
    Task<IEnumerable<ServiceCategoryModel>> GetAllServiceCategoriesAsync();
}