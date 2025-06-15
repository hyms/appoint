using System.ComponentModel.DataAnnotations;

namespace appoint.Domain.Request;

public class RoleRequest
{
    [Required(ErrorMessage = "Role name is required.")]
    [StringLength(255, ErrorMessage = "Role name cannot exceed 255 characters.")]
    public string Name { get; set; }

    // Lista de IDs de permisos asociados a este rol.
    // Se asume que se envían los GUIDs de los permisos que se desean asignar al rol.
    public List<Guid>? PermissionIds { get; set; } = new List<Guid>();
}