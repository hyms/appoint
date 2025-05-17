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
}