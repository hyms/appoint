namespace appoint.Domain;

public class UserRequest
{
    public string Password { get; set; }
    public string? Username { get; set; }
    public string Role { get; set; }
}