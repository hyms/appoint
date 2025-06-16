using appoint.Models;

namespace appoint.Repository;

public interface IStaffRepository
{
    // Obtener todos los miembros del personal para la tabla de índice
    Task<IEnumerable<StaffListItemModel>> GetAllStaffAsync(Guid loggedInUserId);

    // Obtener detalles completos de un miembro del personal
    Task<StaffDetailsResponse?> GetStaffDetailsAsync(Guid staffId);

    // Obtener un miembro del personal por su ID (UserModel)
    Task<UserModel?> GetUserByIdAsync(Guid userId);

    // Crear un nuevo miembro del personal
    Task<Guid> AddStaffAsync(UserModel user, Guid roleId);

    // Actualizar un miembro del personal existente
    Task UpdateStaffAsync(UserModel user, Guid roleId);

    // Eliminar un miembro del personal por su ID
    Task DeleteStaffAsync(Guid staffId);
    
    // Obtener los roles disponibles (para el dropdown de asignación de rol)
    Task<IEnumerable<RoleModel>> GetAvailableRolesAsync();

    // Actualizar el estado de verificación de email de un usuario
    Task UpdateEmailVerifiedStatusAsync(Guid userId, bool isVerified);

    // Actualizar la preferencia de notificación por email de un usuario
    Task UpdateEmailNotificationAsync(Guid userId, bool enableNotification);

    // Resend email verification (solo verifica si el email ya está verificado)
    Task<bool> IsEmailVerifiedAsync(Guid userId);
}