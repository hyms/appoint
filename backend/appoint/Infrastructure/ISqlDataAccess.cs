namespace appoint.Infrastructure;

// Interfaz que define las operaciones básicas de acceso a datos
public interface ISqlDataAccess
{
    Task<IEnumerable<T>> LoadData<T, TU>(string storedProcedure, TU parameters, string connectionId = "DefaultConnection");
    Task SaveData<T>(string storedProcedure, T parameters, string connectionId = "DefaultConnection");
    Task<int> ExecuteScalar<T>(string storedProcedure, T parameters, string connectionId = "DefaultConnection");
    // Puedes añadir más métodos según tus necesidades, como QueryFirstOrDefaultAsync sin SP
    Task<T> QueryFirstOrDefaultAsync<T, TU>(string sql, TU parameters, string connectionId = "DefaultConnection");
    Task<IEnumerable<T>> QueryAsync<T, TU>(string sql, TU parameters, string connectionId = "DefaultConnection");
    Task<int> ExecuteAsync<T>(string sql, T parameters, string connectionId = "DefaultConnection");
}