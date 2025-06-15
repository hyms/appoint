using System.ComponentModel.DataAnnotations;

namespace appoint.Models;

public class UserModel
{
    public Guid Id { get; set; }

    [EmailAddress]
    public string Email { get; set; }
    // PasswordHash solo para uso interno del servicio/repositorio, no debe exponerse en respuestas de API
    public string PasswordHash { get; set; }
    public string Role { get; set; } // Rol simplificado como string por ahora

    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string FullName => $"{FirstName} {LastName}".Trim(); // Propiedad auxiliar para nombre completo

    public string Type { get; set; } // Ej., Admin, Doctor, Patient (podría ser lo mismo que Role si aplica)
    public DateTime? EmailVerifiedAt { get; set; }
    public string? Contact { get; set; }
    public string? RegionCode { get; set; } // Para código de región telefónico
    public string? BloodGroup { get; set; } // Ej., "A+", "O-"
    public int? Gender { get; set; } // 0: Male, 1: Female (considerar un enum más adelante)
    public DateTime? Dob { get; set; } // Fecha de Nacimiento

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}