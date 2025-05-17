using appoint.Domain;
using appoint.Models;

namespace appoint.Services;

public class UserService : IUserService
{
    public async Task<UserModel> Authenticate(string modelUsername, string modelPassword)
    {
        return new UserModel();
    }

    public string GenerateJwtToken(UserModel user)
    {
        return "";
    }

    public async Task<IEnumerable<UserModel>> GetAllUsersAsync()
    {
        List<UserModel> resutls = new List<UserModel>();
        resutls.Add(new UserModel());
        return resutls;
    }

    public async Task<UserModel> GetUserByIdAsync(int id)
    {
        return new UserModel();
    }

    public async Task<UserModel> CreateUserAsync(CreateUserRequest request)
    {
        return new UserModel();
    }

    public async Task<UserModel> UpdateUserAsync(int id, UpdateUserRequest request)
    {
        return new UserModel();
    }

    public async Task<bool> DeleteUserAsync(int id)
    {
        return true;
    }
}