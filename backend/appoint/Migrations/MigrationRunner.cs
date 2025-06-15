using FluentMigrator.Runner;

namespace appoint.Migrations;

public static class MigrationRunner
{
    public static void ConfigureMigrationServices(IServiceCollection services, string connectionString)
    {
        services.AddFluentMigratorCore()
            .ConfigureRunner(rb => rb
                .AddMySql8() // O la versión específica de MySQL/MariaDB que estés usando (ej., AddMySql8)
                .WithGlobalConnectionString(connectionString)
                .ScanIn(typeof(ConsolidatedInitialSchema).Assembly)
                // .ScanIn(typeof(ConsolidatedInitialSchema).Assembly)
                .For.Migrations())
            .AddLogging(lb => lb.AddFluentMigratorConsole());
    }

    public static void RunMigrations(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var runner = scope.ServiceProvider.GetRequiredService<IMigrationRunner>();
        runner.MigrateUp();
    }
}