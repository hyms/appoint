using appoint.Models;

namespace appoint.Repository;


public interface IBranchRepository
{
    // Obtener todas las sucursales
    Task<IEnumerable<BranchModel>> GetAllBranchesAsync();

    // Obtener una sucursal por su ID
    Task<BranchModel?> GetBranchByIdAsync(Guid branchId);

    // Obtener una sucursal por su nombre (para validación de unicidad)
    Task<BranchModel?> GetBranchByNameAsync(string branchName);

    // Añadir una nueva sucursal
    Task<Guid> AddBranchAsync(BranchModel branch);

    // Actualizar una sucursal existente
    Task UpdateBranchAsync(BranchModel branch);

    // Eliminar una sucursal por su ID
    Task DeleteBranchAsync(Guid branchId);

    // Verificar si una sucursal está en uso (ej. si tiene usuarios asociados)
    Task<bool> IsBranchInUseAsync(Guid branchId);
}