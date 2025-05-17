using Microsoft.AspNetCore.Mvc;

namespace appoint.Controllers;

public class HomeController : Controller
{
    private readonly ILogger<HomeController> _logger;

    public HomeController(ILogger<HomeController> logger)
    {
        _logger = logger;
    }

    public IActionResult Index()
    {
        return new JsonResult("index");
    }

    public IActionResult Privacy()
    {
        return new JsonResult("privacy");
    }

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error()
    {
        return new JsonResult("error");
    }
}