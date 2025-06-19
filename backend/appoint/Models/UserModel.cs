using System.ComponentModel.DataAnnotations;

namespace appoint.Models;

public class UserModel
{
    public Guid Id { get; set; }

    [EmailAddress]
    public string Email { get; set; }
    public string PasswordHash { get; set; }
    // La columna 'Role' se usará para el nombre del rol si no se usa la tabla UserRoles,
    // pero si se usa UserRoles, esta propiedad podría ser 'PrincipalRoleName' o similar.
    public string Role { get; set; } // Rol simplificado como string por ahora, será Guid si se usa UserRoles y tabla Roles

    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string FullName => $"{FirstName} {LastName}".Trim();

    public string Type { get; set; } // Ej., Admin, Doctor, Patient, Staff
    public DateTime? EmailVerifiedAt { get; set; }
    public string? Contact { get; set; }
    public string? RegionCode { get; set; }
    public string? BloodGroup { get; set; }
    public int? Gender { get; set; }
    public DateTime? Dob { get; set; }

    // --- CAMPO BranchId FK A LA TABLA BRANCHES ---
    public Guid BranchId { get; set; } // Cada usuario debe estar relacionado a una sucursal
    public BranchModel? Branch { get; set; } // Propiedad de navegación para la sucursal asociada

    // --- CAMPO PARA NOTIFICACIONES POR EMAIL ---
    public bool EmailNotificationEnabled { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
