using appoint.Domain.Request;
using appoint.Models;
using appoint.Repository;

namespace appoint.Services.implement;

public class ServiceService : IServiceService
{
    private readonly IServiceRepository _serviceRepository;
    private readonly IServiceCategoryRepository _serviceCategoryRepository;

    public ServiceService(IServiceRepository serviceRepository, IServiceCategoryRepository serviceCategoryRepository)
    {
        _serviceRepository = serviceRepository;
        _serviceCategoryRepository = serviceCategoryRepository;
    }

    public async Task<IEnumerable<ServiceListItemModel>> GetAllServicesAsync(string? statusFilter = null)
    {
        return await _serviceRepository.GetAllServiceListItemsAsync(statusFilter);
    }

    public async Task<ServiceModel?> GetServiceDetailsAsync(Guid serviceId)
    {
        return await _serviceRepository.GetServiceByIdAsync(serviceId);
    }

    public async Task<Guid> CreateServiceAsync(ServiceCreateRequest request)
    {
        // Validaciones de negocio:
        // 1. Verificar si la categoría existe
        var category = await _serviceCategoryRepository.GetServiceCategoryByIdAsync(request.CategoryId);
        if (category == null)
        {
            throw new InvalidOperationException($"Service category with ID '{request.CategoryId}' not found.");
        }

        // 2. Opcional: Verificar si ya existe un servicio con el mismo nombre
        // Esto requeriría un método en IServiceRepository como GetServiceByNameAsync
        // var existingService = await _serviceRepository.GetServiceByNameAsync(request.Name);
        // if (existingService != null) { throw new InvalidOperationException("Service with this name already exists."); }

        // Mapear DTO de request a modelo de entidad
        var serviceModel = new ServiceModel
        {
            Name = request.Name,
            CategoryId = request.CategoryId,
            Price = request.Charges, // 'charges' en el DTO, 'Price' en el modelo
            ShortDescription = request.ShortDescription,
            Status = "Active", // Asumimos 'Active' por defecto al crear
            // Icono se gestionaría aparte si es una carga de archivo
        };

        var serviceId = await _serviceRepository.AddServiceAsync(serviceModel, request.DoctorIds);
        return serviceId;
    }

    public async Task UpdateServiceAsync(Guid serviceId, ServiceUpdateRequest request)
    {
        var existingService = await _serviceRepository.GetServiceByIdAsync(serviceId);
        if (existingService == null)
        {
            throw new InvalidOperationException($"Service with ID '{serviceId}' not found.");
        }

        // 1. Verificar si la categoría existe (si se cambió)
        if (existingService.CategoryId != request.CategoryId)
        {
            var category = await _serviceCategoryRepository.GetServiceCategoryByIdAsync(request.CategoryId);
            if (category == null)
            {
                throw new InvalidOperationException($"Service category with ID '{request.CategoryId}' not found.");
            }
        }
        
        // 2. Opcional: Verificar si el nuevo nombre ya existe para otro servicio
        // var serviceByName = await _serviceRepository.GetServiceByNameAsync(request.Name);
        // if (serviceByName != null && serviceByName.Id != serviceId) { throw new InvalidOperationException("Service with this name already exists."); }

        // Actualizar propiedades del modelo
        existingService.Name = request.Name;
        existingService.CategoryId = request.CategoryId;
        existingService.Price = request.Charges;
        existingService.ShortDescription = request.ShortDescription;
        existingService.Status = request.Status;
        // Icono se gestionaría aparte

        await _serviceRepository.UpdateServiceAsync(existingService, request.DoctorIds);
    }

    public async Task DeleteServiceAsync(Guid serviceId)
    {
        var existingService = await _serviceRepository.GetServiceByIdAsync(serviceId);
        if (existingService == null)
        {
            throw new InvalidOperationException($"Service with ID '{serviceId}' not found.");
        }

        // Puedes añadir validaciones de negocio aquí, por ejemplo:
        // - Si hay citas pendientes asociadas a este servicio.
        // - Si el servicio está "activo" y no se permite eliminarlo directamente.
        // En tu controlador Laravel, simplemente se eliminaba.

        await _serviceRepository.DeleteServiceAsync(serviceId);
    }

    public async Task UpdateServiceStatusAsync(Guid serviceId, string status)
    {
        var existingService = await _serviceRepository.GetServiceByIdAsync(serviceId);
        if (existingService == null)
        {
            throw new InvalidOperationException($"Service with ID '{serviceId}' not found.");
        }
        
        // Validar el valor del estado si es necesario (ej. solo "Active", "Inactive")
        if (status != "Active" && status != "Inactive") // Asumiendo estos son los valores válidos
        {
            throw new ArgumentException("Invalid status value. Must be 'Active' or 'Inactive'.", nameof(status));
        }

        await _serviceRepository.UpdateServiceStatusAsync(serviceId, status);
    }

    public async Task<IEnumerable<ServiceModel>> GetServicesByDoctorIdAsync(Guid doctorId)
    {
        // Puedes añadir lógica de negocio adicional aquí si fuera necesario
        return await _serviceRepository.GetServicesByDoctorIdAsync(doctorId);
    }

    public async Task<decimal?> GetServiceChargeByIdAsync(Guid serviceId)
    {
        return await _serviceRepository.GetServicePriceByIdAsync(serviceId); // Mapea a 'Price' en el repositorio
    }

    public async Task<IEnumerable<ServiceCategoryModel>> GetAllServiceCategoriesAsync()
    {
        return await _serviceCategoryRepository.GetAllServiceCategoriesAsync();
    }
}