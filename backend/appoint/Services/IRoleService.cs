using appoint.Domain.Request;
using appoint.Domain.Response;
using appoint.Models;

namespace appoint.Services;

public interface IRoleService
{
    // Obtiene una lista de todos los roles, típicamente para una tabla o lista.
    Task<IEnumerable<RoleModel>> GetAllRolesAsync();

    // Obtiene los detalles de un rol específico, incluyendo sus permisos asociados,
    // y todos los permisos disponibles en el sistema (para la vista de edición).
    Task<RoleDetailsResponse?> GetRoleDetailsForEditAsync(Guid roleId);

    // Crea un nuevo rol y asocia los permisos.
    Task<Guid> CreateRoleAsync(RoleRequest request);

    // Actualiza un rol existente y sincroniza sus permisos.
    Task UpdateRoleAsync(Guid roleId, RoleRequest request);

    // Elimina un rol, con las validaciones necesarias (si está en uso o es un rol por defecto).
    Task DeleteRoleAsync(Guid roleId);
}