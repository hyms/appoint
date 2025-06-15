using appoint.Infrastructure;
using appoint.Models;
using Dapper;

namespace appoint.Repository.impl;

public class AddressRepository : IAddressRepository
{
    private readonly ISqlDataAccess _db;

    public AddressRepository(ISqlDataAccess db)
    {
        _db = db;
    }

    public async Task<AddressModel?> GetAddressByIdAsync(Guid addressId)
    {
        const string sql = "SELECT Id, Address1, Address2, CountryId, StateId, CityId, PostalCode, CreatedAt, UpdatedAt FROM Addresses WHERE Id = @AddressId";
        using (var conection = _db.GetConnection())
        {
            return await conection.QueryFirstOrDefaultAsync<AddressModel>(sql, new { AddressId = addressId });
        }
    }

    public async Task<Guid> AddAddressAsync(AddressModel address)
    {
        address.Id = Guid.NewGuid(); // Generar un nuevo GUID para el ID
        address.CreatedAt = DateTime.UtcNow;
        address.UpdatedAt = DateTime.UtcNow;

        const string sql = @"
            INSERT INTO Addresses (Id, Address1, Address2, CountryId, StateId, CityId, PostalCode, CreatedAt, UpdatedAt)
            VALUES (@Id, @Address1, @Address2, @CountryId, @StateId, @CityId, @PostalCode, @CreatedAt, @UpdatedAt)";
        
        await _db.SaveData(sql, address);
        return address.Id;
    }

    public async Task UpdateAddressAsync(AddressModel address)
    {
        address.UpdatedAt = DateTime.UtcNow;
        const string sql = @"
            UPDATE Addresses SET
                Address1 = @Address1, Address2 = @Address2, CountryId = @CountryId,
                StateId = @StateId, CityId = @CityId, PostalCode = @PostalCode, UpdatedAt = @UpdatedAt
            WHERE Id = @Id";
        await _db.SaveData(sql, address);
    }

    public async Task DeleteAddressAsync(Guid addressId)
    {
        const string sql = "DELETE FROM Addresses WHERE Id = @AddressId";
        await _db.SaveData(sql, new { AddressId = addressId });
    }
}