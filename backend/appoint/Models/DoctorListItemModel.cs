namespace appoint.Models;

public class DoctorListItemModel
{
    public Guid Id { get; set; } // ID del Doctor
    public Guid UserId { get; set; } // ID del Usuario vinculado al doctor
    public string FullName { get; set; }
    public string Email { get; set; }
    public bool IsActive { get; set; } // Mapeado de user.status == 1
    public DateTime? EmailVerifiedAt { get; set; }
    public DateTime CreatedAt { get; set; } // Fecha de creación del Doctor/Usuario
}
