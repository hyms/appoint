using appoint.Infrastructure;
using appoint.Models;
using Dapper;

namespace appoint.Services.implement;

public class ServiceCategoryRepository : IServiceCategoryRepository
{
    private readonly ISqlDataAccess _db;

    public ServiceCategoryRepository(ISqlDataAccess db)
    {
        _db = db;
    }

    public async Task<IEnumerable<ServiceCategoryModel>> GetAllServiceCategoriesAsync()
    {
        const string sql = "SELECT Id, Name FROM ServiceCategories";
        return await _db.LoadData<ServiceCategoryModel, dynamic>(sql, new { });
    }

    public async Task<ServiceCategoryModel?> GetServiceCategoryByIdAsync(Guid categoryId)
    {
        const string sql = "SELECT Id, Name FROM ServiceCategories WHERE Id = @Id";
        using (var connection = _db.GetConnection())
        {
            return await connection.QueryFirstOrDefaultAsync<ServiceCategoryModel>(sql, new { Id = categoryId });
        }
    }

    public async Task<Guid> AddServiceCategoryAsync(ServiceCategoryModel category)
    {
        category.Id = Guid.NewGuid();
        const string sql = "INSERT INTO ServiceCategories (Id, Name) VALUES (@Id, @Name)";
        await _db.SaveData(sql, new { category.Id, category.Name });
        return category.Id;
    }

    public async Task UpdateServiceCategoryAsync(ServiceCategoryModel category)
    {
        const string sql = "UPDATE ServiceCategories SET Name = @Name WHERE Id = @Id";
        await _db.SaveData(sql, new { category.Name, category.Id });
    }

    public async Task DeleteServiceCategoryAsync(Guid categoryId)
    {
        // Considerar validar si hay servicios asociados antes de eliminar una categoría.
        // O si la FK en Services está configurada con ON DELETE CASCADE.
        const string sql = "DELETE FROM ServiceCategories WHERE Id = @Id";
        await _db.SaveData(sql, new { Id = categoryId });
    }
}