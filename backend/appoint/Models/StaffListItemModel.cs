namespace appoint.Models;

public class StaffListItemModel
{
    public Guid Id { get; set; } // ID del usuario/staff
    public string FullName { get; set; }
    public string Email { get; set; }
    public string RoleName { get; set; } // Nombre del rol principal del staff
    public DateTime? EmailVerifiedAt { get; set; }
    // Asumo que created_at de Laravel se refiere a CreatedAt del UserModel
    public DateTime CreatedAt { get; set; }
}