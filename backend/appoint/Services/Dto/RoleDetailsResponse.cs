using appoint.Models;

namespace appoint.Domain.Response;

public class RoleDetailsResponse
{
    public RoleModel Role { get; set; } // El rol que se está viendo/editando
    public ICollection<PermissionModel> AllPermissions { get; set; } // Todos los permisos disponibles en el sistema
    
    // Lista de los IDs de los permisos que ya están asociados a este rol.
    // Esto es más ligero que pasar PermissionModel completo si el frontend solo necesita el ID para pre-seleccionar.
    public ICollection<Guid> SelectedPermissionIds { get; set; } 
}