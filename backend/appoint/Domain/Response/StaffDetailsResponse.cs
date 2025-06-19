using appoint.Models;

namespace appoint.Domain.Response;

public class StaffDetailsResponse
{
    public Guid Id { get; set; }
    public string RoleName { get; set; }
    public string FullName { get; set; }
    public string Email { get; set; }
    public string? RegionCode { get; set; }
    public string? Contact { get; set; }
    public int? Gender { get; set; }

    public ICollection<PermissionModel>? Permissions { get; set; } 

    // --- INFORMACIÓN DE LA SUCURSAL ASOCIADA AL USUARIO ---
    public Guid BranchId { get; set; }
    public string BranchName { get; set; } = string.Empty;
    public string BranchAddress1 { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
