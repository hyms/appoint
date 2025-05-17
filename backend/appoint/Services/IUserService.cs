using appoint.Domain;
using appoint.Models;

namespace appoint.Services;

public interface IUserService
{
    Task<UserModel> Authenticate(string modelUsername, string modelPassword);

    string GenerateJwtToken(UserModel user);
    Task<IEnumerable<UserModel>> GetAllUsersAsync();
    Task<UserModel> GetUserByIdAsync(int id);
    Task<UserModel> CreateUserAsync(UserRequest request);
    Task<UserModel> UpdateUserAsync(int id, UserRequest request);
    Task<bool> DeleteUserAsync(int id);
    public bool VerifyPassword(string plainTextPassword, string hashedPassword);
}