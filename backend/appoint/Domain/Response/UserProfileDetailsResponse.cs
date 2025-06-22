namespace appoint.Domain.Response;

public class UserProfileDetailsResponse
{
    public Guid UserId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Contact { get; set; }
    public string? RegionCode { get; set; }
    // Puedes añadir más campos del perfil si los necesitas en la UI
    // Por ejemplo: Gender, Dob, BloodGroup, BranchId, BranchName, etc.
}