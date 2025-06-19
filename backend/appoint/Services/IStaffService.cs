using appoint.Domain.Request;
using appoint.Domain.Response;
using appoint.Models;

namespace appoint.Services;

public interface IStaffService
{
    // Obtener todos los miembros del personal para la tabla de índice, excluyendo al usuario logueado.
    Task<IEnumerable<StaffListItemModel>> GetAllStaffAsync(Guid loggedInUserId);

    // Obtener detalles completos de un miembro del personal.
    Task<StaffDetailsResponse?> GetStaffDetailsAsync(Guid staffId);

    // Crear un nuevo miembro del personal.
    Task<Guid> CreateStaffAsync(StaffCreateRequest request);

    // Actualizar un miembro del personal existente.
    Task UpdateStaffAsync(Guid staffId, StaffUpdateRequest request);

    // Eliminar un miembro del personal por su ID.
    Task DeleteStaffAsync(Guid staffId);

    // Obtener los roles disponibles para la asignación de staff.
    Task<IEnumerable<RoleModel>> GetAvailableStaffRolesAsync();

    // Actualizar el estado de verificación de email de un usuario.
    Task UpdateEmailVerifiedStatusAsync(Guid userId, bool isVerified);

    // Actualizar la preferencia de notificación por email de un usuario.
    Task UpdateEmailNotificationAsync(Guid userId, bool enableNotification);

    // Resend email verification (solo devuelve si el email ya está verificado, no envía realmente el email).
    Task<bool> ResendEmailVerificationCheckAsync(Guid userId);
}