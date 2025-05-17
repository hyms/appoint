using appoint;
using appoint.Migrations;
using Serilog;

Log.Logger = new LoggerConfiguration()
    .CreateBootstrapLogger();

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSerilog((services, lc) => lc
    .ReadFrom.Configuration(builder.Configuration)
    .ReadFrom.Services(services)
    .Enrich.FromLogContext()
    .WriteTo.Console());

string connectionString = builder.Configuration.GetConnectionString("DefaultConnection")!;

// Configure Services in ServiceExtensions
builder.Services.ConfigureServices(connectionString);

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

//app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.UseCors("AllowLocalhost");

// migrations
var serviceProvider = app.Services.CreateScope().ServiceProvider;
MigrationRunner.RunMigrations(serviceProvider);

app.Run();