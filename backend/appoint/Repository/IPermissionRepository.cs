using appoint.Models;

namespace appoint.Repository;

public interface IPermissionRepository
{
    // Obtiene todos los permisos disponibles
    Task<IEnumerable<PermissionModel>> GetAllPermissionsAsync();
}