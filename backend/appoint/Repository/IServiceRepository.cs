using appoint.Models;

namespace appoint.Repository;

public interface IServiceRepository
{
    // Obtener todos los servicios con sus categorías para la lista principal.
    Task<IEnumerable<ServiceListItemModel>> GetAllServiceListItemsAsync(string? statusFilter = null);

    // Obtener un servicio por su ID, incluyendo su categoría y doctores asociados.
    Task<ServiceModel?> GetServiceByIdAsync(Guid serviceId);

    // Crear un nuevo servicio y asociarlo a doctores.
    Task<Guid> AddServiceAsync(ServiceModel service, IEnumerable<Guid>? doctorIds);

    // Actualizar un servicio existente y sincronizar sus doctores asociados.
    Task UpdateServiceAsync(ServiceModel service, IEnumerable<Guid>? doctorIds);

    // Eliminar un servicio por su ID.
    Task DeleteServiceAsync(Guid serviceId);

    // Cambiar el estado de un servicio (ej. "Active", "Inactive").
    Task UpdateServiceStatusAsync(Guid serviceId, string status);

    // Obtener servicios ofrecidos por un doctor específico (para la reserva de citas).
    Task<IEnumerable<ServiceModel>> GetServicesByDoctorIdAsync(Guid doctorId);

    // Obtener el precio de un servicio por su ID.
    Task<decimal?> GetServicePriceByIdAsync(Guid serviceId);

    // Asignar doctores a un servicio (gestiona la tabla pivote ServiceDoctors).
    Task AssignDoctorsToServiceAsync(Guid serviceId, IEnumerable<Guid> doctorIds);
}