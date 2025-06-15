namespace appoint.Domain.Response;

public class AuthenticatedUserResponse
{
    public Guid Id { get; set; }
    public string Username { get; set; }
    public string Role { get; set; }
    public string Token { get; set; }
}