namespace appoint.Models;

public class UserModel
{
    public Guid Id { get; set; } // Cambio de int a Guid
    public string Username { get; set; } // Cambio de Username a Email
    public string PasswordHash { get; set; } // Necesitas esta propiedad para autenticar, pero no devolverla
    public string Role { get; set; }
    // Añadir otras propiedades según tu tabla Users, como FirstName, LastName, etc.
}