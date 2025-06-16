namespace appoint.Models;

public class StaffDetailsResponse
{
    public Guid Id { get; set; } // ID del usuario/staff
    public string RoleName { get; set; } // Nombre del rol principal del staff
    public string FullName { get; set; }
    public string Email { get; set; }
    public string? RegionCode { get; set; }
    public string? Contact { get; set; }
    public int? Gender { get; set; } // 0: Male, 1: Female

    // Si 'getAllPermissions()' de Laravel mapea a una lista de permisos para el staff.
    // Esto dependerá de cómo se implemente la relación de permisos en .NET.
    // Por ahora, asumimos que se puede devolver una colección de PermissionModel.
    public ICollection<PermissionModel>? Permissions { get; set; } 

    public DateTime CreatedAt { get; set; } // Fecha de creación del usuario
    public DateTime UpdatedAt { get; set; } // Fecha de última actualización del usuario
}
