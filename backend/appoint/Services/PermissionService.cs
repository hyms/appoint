using System.Data;
using Dapper;

namespace appoint.Services;

public class PermissionService:IPermissionService
{
    private readonly IDbConnection _dbConnection;

    public PermissionService(IDbConnection dbConnection)
    {
        _dbConnection = dbConnection;
    }

    public async Task<IEnumerable<string>> GetPermissionsForUserAsync(int userId)
    {
        const string sql = @"
            SELECT p.name
            FROM permissions p
            INNER JOIN role_permissions rp ON p.id = rp.permission_id
            INNER JOIN users u ON u.role = rp.role_name
            WHERE u.id = @UserId;";
        return await _dbConnection.QueryAsync<string>(sql, new { UserId = userId });
    }
}