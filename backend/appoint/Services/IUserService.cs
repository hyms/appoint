using appoint.Models;

namespace appoint.Services;

public interface IUserService
{
    Task<UserModel> Authenticate(string modelUsername, string modelPassword);

    string GenerateJwtToken(UserModel user);
}