using appoint.Infrastructure;
using appoint.Models;

namespace appoint.Repository.impl;

public class QualificationRepository : IQualificationRepository
{
    private readonly ISqlDataAccess _db;

    public QualificationRepository(ISqlDataAccess db)
    {
        _db = db;
    }

    public async Task<IEnumerable<QualificationModel>> GetQualificationsByUserIdAsync(Guid userId)
    {
        const string sql = "SELECT Id, UserId, Name, Institute, CompletionDate FROM Qualifications WHERE UserId = @UserId";
        return await _db.LoadData<QualificationModel, dynamic>(sql, new { UserId = userId });
    }

    public async Task<Guid> AddQualificationAsync(QualificationModel qualification)
    {
        qualification.Id = Guid.NewGuid();
        const string sql = @"
            INSERT INTO Qualifications (Id, UserId, Name, Institute, CompletionDate)
            VALUES (@Id, @UserId, @Name, @Institute, @CompletionDate)";
        await _db.SaveData(sql, qualification);
        return qualification.Id;
    }

    public async Task UpdateQualificationAsync(QualificationModel qualification)
    {
        const string sql = @"
            UPDATE Qualifications SET
                Name = @Name, Institute = @Institute, CompletionDate = @CompletionDate
            WHERE Id = @Id AND UserId = @UserId"; // Asegurar que se actualice la calificación del usuario correcto
        await _db.SaveData(sql, qualification);
    }

    public async Task DeleteQualificationAsync(Guid qualificationId)
    {
        const string sql = "DELETE FROM Qualifications WHERE Id = @QualificationId";
        await _db.SaveData(sql, new { QualificationId = qualificationId });
    }
}