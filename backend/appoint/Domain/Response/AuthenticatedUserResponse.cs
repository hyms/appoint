namespace appoint.Domain.Response;

public class AuthenticatedUserResponse
{
    public Guid UserId { get; set; } // Corresponde a 'userId' en el frontend
    public string Email { get; set; }
    public string Role { get; set; }
    public List<string> Permissions { get; set; } = new List<string>(); // Lista de nombres de permisos
    public string Token { get; set; }
}