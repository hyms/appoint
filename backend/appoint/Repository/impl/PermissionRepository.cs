using appoint.Infrastructure;
using appoint.Models;

namespace appoint.Repository.impl;

public class PermissionRepository : IPermissionRepository
{
    private readonly ISqlDataAccess _db;

    public PermissionRepository(ISqlDataAccess db)
    {
        _db = db;
    }

    public async Task<IEnumerable<PermissionModel>> GetAllPermissionsAsync()
    {
        const string sql = "SELECT Id, Name, GuardName FROM Permissions";
        return await _db.LoadData<PermissionModel, dynamic>(sql, new { });
    }
}