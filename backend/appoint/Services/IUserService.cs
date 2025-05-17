using appoint.Domain;
using appoint.Models;

namespace appoint.Services;

public interface IUserService
{
    Task<UserModel> Authenticate(string modelUsername, string modelPassword);

    string GenerateJwtToken(UserModel user);
    Task<IEnumerable<UserModel>> GetAllUsersAsync();
    Task<UserModel> GetUserByIdAsync(int id);
    Task<UserModel> CreateUserAsync(CreateUserRequest request);
    Task<UserModel> UpdateUserAsync(int id, UpdateUserRequest request);
    Task<bool> DeleteUserAsync(int id);
}