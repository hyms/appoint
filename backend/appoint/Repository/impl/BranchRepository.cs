using appoint.Infrastructure;
using appoint.Models;
using Dapper;

namespace appoint.Repository.impl;

public class BranchRepository : IBranchRepository
{
    private readonly ISqlDataAccess _db;

    public BranchRepository(ISqlDataAccess db)
    {
        _db = db;
    }

    public async Task<IEnumerable<BranchModel>> GetAllBranchesAsync()
    {
        const string sql =
            "SELECT Id, Name, AddressLine1, AddressLine2, City, State, Country, PostalCode, PhoneNumber, Email, IsActive, CreatedAt, UpdatedAt FROM Branches";
        return await _db.LoadData<BranchModel, dynamic>(sql, new { });
    }

    public async Task<BranchModel?> GetBranchByIdAsync(Guid branchId)
    {
        const string sql =
            "SELECT Id, Name, AddressLine1, AddressLine2, City, State, Country, PostalCode, PhoneNumber, Email, IsActive, CreatedAt, UpdatedAt FROM Branches WHERE Id = @Id";
        using (var connection = _db.GetConnection())
        {
            return await connection.QueryFirstOrDefaultAsync<BranchModel>(sql, new { Id = branchId });
        }
    }

    public async Task<BranchModel?> GetBranchByNameAsync(string branchName)
    {
        const string sql =
            "SELECT Id, Name, AddressLine1, AddressLine2, City, State, Country, PostalCode, PhoneNumber, Email, IsActive, CreatedAt, UpdatedAt FROM Branches WHERE Name = @Name";
        using (var connection = _db.GetConnection())
        {
            return await connection.QueryFirstOrDefaultAsync<BranchModel>(sql, new { Name = branchName });
        }
    }

    public async Task<Guid> AddBranchAsync(BranchModel branch)
    {
        branch.Id = Guid.NewGuid();
        branch.CreatedAt = DateTime.UtcNow;
        branch.UpdatedAt = DateTime.UtcNow;

        const string sql = @"
            INSERT INTO Branches (Id, Name, AddressLine1, AddressLine2, City, State, Country, PostalCode, PhoneNumber, Email, IsActive, CreatedAt, UpdatedAt)
            VALUES (@Id, @Name, @AddressLine1, @AddressLine2, @City, @State, @Country, @PostalCode, @PhoneNumber, @Email, @IsActive, @CreatedAt, @UpdatedAt)";

        await _db.SaveData(sql, branch);
        return branch.Id;
    }

    public async Task UpdateBranchAsync(BranchModel branch)
    {
        branch.UpdatedAt = DateTime.UtcNow;
        const string sql = @"
            UPDATE Branches SET
                Name = @Name, AddressLine1 = @AddressLine1, AddressLine2 = @AddressLine2,
                City = @City, State = @State, Country = @Country, PostalCode = @PostalCode,
                PhoneNumber = @PhoneNumber, Email = @Email, IsActive = @IsActive, UpdatedAt = @UpdatedAt
            WHERE Id = @Id";
        await _db.SaveData(sql, branch);
    }

    public async Task DeleteBranchAsync(Guid branchId)
    {
        // NOTA: Asegúrate de que no haya usuarios relacionados con esta sucursal antes de eliminarla,
        // o configura tu FK en la DB con ON DELETE CASCADE.
        const string sql = "DELETE FROM Branches WHERE Id = @Id";
        await _db.SaveData(sql, new { Id = branchId });
    }

    public async Task<bool> IsBranchInUseAsync(Guid branchId)
    {
        // Verifica si hay algún usuario asociado a esta sucursal
        const string sql = "SELECT COUNT(Id) FROM Users WHERE BranchId = @BranchId";
        var count = await _db.LoadData<int, dynamic>(sql, new { BranchId = branchId });
        return count.FirstOrDefault() > 0;
    }
}