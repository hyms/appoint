using FluentMigrator;

namespace appoint.Migrations;

[Migration(202406150003)] // Usa una estampilla de tiempo posterior a Users y Roles
public class CreateUserRolesTable : Migration
{
    public override void Up()
    {
        Create.Table("UserRoles")
            .WithColumn("UserId").AsGuid().NotNullable()
            .WithColumn("RoleId").AsGuid().NotNullable();

        Create.PrimaryKey("PK_UserRoles")
            .OnTable("UserRoles")
            .Columns("UserId", "RoleId");

        Create.ForeignKey("FK_UserRoles_UserId_Users_Id")
            .FromTable("UserRoles").InSchema("dbo").ForeignColumn("UserId")
            .ToTable("Users").InSchema("dbo").PrimaryColumn("Id");

        Create.ForeignKey("FK_UserRoles_RoleId_Roles_Id")
            .FromTable("UserRoles").InSchema("dbo").ForeignColumn("RoleId")
            .ToTable("Roles").InSchema("dbo").PrimaryColumn("Id");
    }

    public override void Down()
    {
        Delete.ForeignKey("FK_UserRoles_RoleId_Roles_Id").OnTable("UserRoles");
        Delete.ForeignKey("FK_UserRoles_UserId_Users_Id").OnTable("UserRoles");
        Delete.Table("UserRoles");
    }
}