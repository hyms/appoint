using appoint.Models;

namespace appoint.Repository;

public interface IRoleRepository
{
    // Obtiene todos los roles
    Task<IEnumerable<RoleModel>> GetAllRolesAsync();

    // Obtiene un rol por su ID, incluyendo sus permisos asociados
    Task<RoleModel?> GetRoleByIdAsync(Guid roleId);

    // Crea un nuevo rol
    Task<Guid> AddRoleAsync(RoleModel role);

    // Actualiza un rol existente
    Task UpdateRoleAsync(RoleModel role);

    // Elimina un rol por su ID
    Task DeleteRoleAsync(Guid roleId);

    // Obtiene todos los permisos disponibles
    Task<IEnumerable<PermissionModel>> GetAllPermissionsAsync();

    // Asocia permisos a un rol
    Task AssignPermissionsToRoleAsync(Guid roleId, IEnumerable<Guid> permissionIds);

    // Remueve todos los permisos de un rol específico
    Task RemoveAllPermissionsFromRoleAsync(Guid roleId);

    // Verifica si un rol es el "default" (Laravel original tenía is_default)
    // Asumimos que un rol "default" se gestiona por convención (ej. por nombre) o por una columna booleana si se añade a la migración.
    // Por ahora, lo dejamos abstracto hasta definir cómo se manejará "is_default".
    // Si la DB no tiene 'is_default', esta lógica deberá ir en el servicio y depender del nombre del rol o configuración.
    Task<bool> IsRoleDefaultAsync(Guid roleId);

    // Verifica si el rol está asignado a algún usuario
    // ESTO REQUIERE LA TABLA 'UserRoles' (o 'model_has_roles' equivalente)
    Task<bool> HasUsersAssignedAsync(Guid roleId);
}