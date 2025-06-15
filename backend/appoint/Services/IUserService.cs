using appoint.Models; 
using appoint.Domain; 

namespace appoint.Services;

public interface IUserService
{
    // Método para autenticar un usuario
    // Cambiado 'modelUsername' a 'email' y devuelve UserModel si la autenticación es exitosa
    Task<UserModel> Authenticate(string email, string password);

    // Método para generar un token JWT
    string GenerateJwtToken(UserModel user);

    // Método para obtener todos los usuarios
    Task<IEnumerable<UserModel>> GetAllUsersAsync();

    // Método para obtener un usuario por su ID (Guid)
    Task<UserModel> GetUserByIdAsync(Guid id); // Cambio de int a Guid

    // Método para obtener un usuario por su email
    Task<UserModel> GetUserByUsernameAsync(string username); // Nuevo método, reemplazando GetUserByUsernameAsync

    // Método para crear un nuevo usuario
    Task<UserModel> CreateUserAsync(UserRequest request);

    // Método para actualizar un usuario existente por su ID (Guid)
    Task<UserModel> UpdateUserAsync(Guid id, UserRequest request); // Cambio de int a Guid

    // Método para eliminar un usuario por su ID (Guid)
    Task<bool> DeleteUserAsync(Guid id); // Cambio de int a Guid

    // Método para verificar una contraseña
    bool VerifyPassword(string plainTextPassword, string hashedPassword);
}