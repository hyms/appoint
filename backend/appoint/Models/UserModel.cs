namespace appoint.Models;

public class UserModel
{
    public string? Username;
    public string? Password;
    public int Id { get; set; }
    public string Role { get; set; }
}