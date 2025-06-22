using System.Data;

namespace appoint.Infrastructure;

// Interfaz que define las operaciones básicas de acceso a datos
public interface ISqlDataAccess
{
    // Método para cargar datos (lista de objetos)
    Task<IEnumerable<T>> LoadData<T, TU>(string sql, TU parameters);

    // Método para guardar datos (insertar, actualizar, eliminar)
    Task<int> SaveData<T>(string sql, T parameters); 

    // Método para obtener un único resultado (primer o por defecto)
    Task<T?> QueryFirstOrDefaultAsync<T, TU>(string sql, TU parameters);

    // Método para obtener la conexión de base de datos directamente.
    IDbConnection GetConnection();
}
