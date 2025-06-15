using appoint.Domain.Response;
using appoint.Models;

namespace appoint.Repository;

public interface IDoctorRepository
{
    // Obtener todos los doctores (para la tabla de índice)
    Task<IEnumerable<DoctorListItemModel>> GetAllDoctorListItemsAsync(string? statusFilter = null);

    // Obtener un doctor por su ID, incluyendo sus datos de usuario relacionados, especializaciones, etc.
    Task<DoctorModel?> GetDoctorByIdAsync(Guid doctorId);

    // Obtener detalles completos de un doctor para la vista 'show'
    Task<DoctorDetailsResponse?> GetDoctorDetailsAsync(Guid doctorId, Guid loggedInUserId); // Se pasa el ID de usuario logueado para verificar permisos/roles

    // Obtener un doctor por el ID de usuario asociado
    Task<DoctorModel?> GetDoctorByUserIdAsync(Guid userId);

    // Crear un nuevo doctor (implicará crear un usuario y una dirección también)
    Task<Guid> AddDoctorAsync(DoctorModel doctor, UserModel user, AddressModel? address, IEnumerable<Guid>? specializationIds);

    // Actualizar un doctor existente (implicará actualizar usuario y dirección)
    Task UpdateDoctorAsync(DoctorModel doctor, UserModel user, AddressModel? address, IEnumerable<Guid>? specializationIds);

    // Eliminar un doctor por su ID (implicará eliminar el usuario asociado, dirección, etc.)
    Task DeleteDoctorAsync(Guid doctorId);

    // Actualizar el estado de un doctor (User.Status)
    Task UpdateDoctorStatusAsync(Guid userId, bool isActive);

    // Obtener especializaciones de un doctor por DoctorId
    Task<IEnumerable<SpecializationModel>> GetDoctorSpecializationsAsync(Guid doctorId);
    
    // Obtener calificaciones de un usuario/doctor
    Task<IEnumerable<QualificationModel>> GetUserQualificationsAsync(Guid userId);

    // Manejar la relación muchos a muchos entre Doctor y Specialization
    Task AssignSpecializationsToDoctorAsync(Guid doctorId, IEnumerable<Guid> specializationIds);
}