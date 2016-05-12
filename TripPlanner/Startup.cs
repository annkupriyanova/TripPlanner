using Microsoft.Owin;
using Owin;

[assembly: OwinStartupAttribute(typeof(TripPlanner.Startup))]
namespace TripPlanner
{
    public partial class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            ConfigureAuth(app);
        }
    }
}
