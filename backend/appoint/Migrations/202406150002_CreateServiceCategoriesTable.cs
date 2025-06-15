using FluentMigrator;

namespace appoint.Migrations;

[Migration(20240615002)] // Reemplaza con la fecha y hora actuales
public class CreateServiceCategoriesTable : Migration
{
    public override void Up()
    {
        Create.Table("ServiceCategories")
            .WithColumn("Id").AsGuid().NotNullable().PrimaryKey()
            .WithColumn("Name").AsString(255).NotNullable().Unique();
    }

    public override void Down()
    {
        Delete.Table("ServiceCategories");
    }
}