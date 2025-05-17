using System.Collections.Generic;
using System.Threading.Tasks;

namespace appoint.Services;
public interface IPermissionService
{
    Task<IEnumerable<string>> GetPermissionsForUserAsync(int userId);
    // Otros métodos relacionados con permisos si los tienes
}