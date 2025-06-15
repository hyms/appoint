using System.Data;
using appoint.Infrastructure;
using appoint.Models;
using Dapper;

namespace appoint.Repository.impl;

public class RoleRepository : IRoleRepository
{
    private readonly ISqlDataAccess _db;

    public RoleRepository(ISqlDataAccess db)
    {
        _db = db;
    }

    public async Task<IEnumerable<RoleModel>> GetAllRolesAsync()
    {
        const string sql = "SELECT Id, Name FROM Roles";
        return await _db.LoadData<RoleModel, dynamic>(sql, new { });
    }

    public async Task<RoleModel?> GetRoleByIdAsync(Guid roleId)
    {
        const string sql = @"
            SELECT r.Id, r.Name,
                   p.Id, p.Name, p.GuardName
            FROM Roles r
            LEFT JOIN RolePermissions rp ON r.Id = rp.RoleId
            LEFT JOIN Permissions p ON rp.PermissionId = p.Id
            WHERE r.Id = @RoleId;";

        var roleDictionary = new Dictionary<Guid, RoleModel>();

        // Usamos _db.GetConnection() para obtener la conexión y luego el método Query de Dapper
        using (IDbConnection connection = _db.GetConnection())
        {
            var result = await connection.QueryAsync<RoleModel, PermissionModel, RoleModel>(
                sql,
                (role, permission) =>
                {
                    if (!roleDictionary.TryGetValue(role.Id, out var currentRole))
                    {
                        currentRole = role;
                        currentRole.Permissions = new List<PermissionModel>();
                        roleDictionary.Add(currentRole.Id, currentRole);
                    }

                    // Solo añade el permiso si existe (LEFT JOIN puede traer nulos)
                    if (permission != null)
                    {
                        currentRole.Permissions!.Add(permission);
                    }
                    return currentRole;
                },
                param: new { RoleId = roleId }, // Aquí se pasan los parámetros
                splitOn: "Id,Id" // Esto le dice a Dapper que las columnas "Id" de los resultados son los puntos de división para los objetos RoleModel y PermissionModel
            );
        }
        
        // Después de que el using block se cierre, roleDictionary seguirá conteniendo los datos
        return roleDictionary.Values.FirstOrDefault();
    }

    public async Task<Guid> AddRoleAsync(RoleModel role)
    {
        const string sql = "INSERT INTO Roles (Id, Name) VALUES (@Id, @Name)";
        role.Id = Guid.NewGuid();
        await _db.SaveData(sql, new { role.Id, role.Name });
        return role.Id;
    }

    public async Task UpdateRoleAsync(RoleModel role)
    {
        const string sql = "UPDATE Roles SET Name = @Name WHERE Id = @Id";
        await _db.SaveData(sql, new { role.Name, role.Id });
    }

    public async Task DeleteRoleAsync(Guid roleId)
    {
        const string deleteRolePermissionsSql = "DELETE FROM RolePermissions WHERE RoleId = @RoleId";
        await _db.SaveData(deleteRolePermissionsSql, new { RoleId = roleId });

        const string deleteRoleSql = "DELETE FROM Roles WHERE Id = @RoleId";
        await _db.SaveData(deleteRoleSql, new { RoleId = roleId });
    }

    public async Task<IEnumerable<PermissionModel>> GetAllPermissionsAsync()
    {
        const string sql = "SELECT Id, Name, GuardName FROM Permissions";
        return await _db.LoadData<PermissionModel, dynamic>(sql, new { });
    }

    public async Task AssignPermissionsToRoleAsync(Guid roleId, IEnumerable<Guid> permissionIds)
    {
        await RemoveAllPermissionsFromRoleAsync(roleId);

        if (permissionIds != null && permissionIds.Any())
        {
            var sql = "INSERT INTO RolePermissions (RoleId, PermissionId) VALUES ";
            var parameters = new DynamicParameters();
            var valuePairs = new List<string>();

            for (int i = 0; i < permissionIds.Count(); i++)
            {
                var permissionId = permissionIds.ElementAt(i);
                valuePairs.Add($"(@RoleId{i}, @PermissionId{i})");
                parameters.Add($"@RoleId{i}", roleId);
                parameters.Add($"@PermissionId{i}", permissionId);
            }

            sql += string.Join(", ", valuePairs);

            await _db.SaveData(sql, parameters);
        }
    }

    public async Task RemoveAllPermissionsFromRoleAsync(Guid roleId)
    {
        const string sql = "DELETE FROM RolePermissions WHERE RoleId = @RoleId";
        await _db.SaveData(sql, new { RoleId = roleId });
    }

    public async Task<bool> IsRoleDefaultAsync(Guid roleId)
    {
        // (Lógica previamente explicada, sin cambios aquí)
        const string sql = "SELECT COUNT(Id) FROM Roles WHERE Id = @RoleId AND (Name = 'Admin' OR Name = 'Super Admin')";
        var count = await _db.LoadData<int, dynamic>(sql, new { RoleId = roleId });
        return count.FirstOrDefault() > 0;
    }

    public async Task<bool> HasUsersAssignedAsync(Guid roleId)
    {
        // (Lógica previamente explicada, sin cambios aquí, aún asume tabla 'UserRoles')
        const string sql = "SELECT COUNT(UserId) FROM UserRoles WHERE RoleId = @RoleId";
        var count = await _db.LoadData<int, dynamic>(sql, new { RoleId = roleId });
        return count.FirstOrDefault() > 0;
    }
}