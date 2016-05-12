using System.Data.Entity;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNet.Identity;
using Microsoft.AspNet.Identity.EntityFramework;

namespace TripPlanner.Models
{
    // You can add profile data for the user by adding more properties to your ApplicationUser class, please visit http://go.microsoft.com/fwlink/?LinkID=317594 to learn more.
    public class ApplicationUser : IdentityUser
    {
        public async Task<ClaimsIdentity> GenerateUserIdentityAsync(UserManager<ApplicationUser> manager)
        {
            // Note the authenticationType must match the one defined in CookieAuthenticationOptions.AuthenticationType
            var userIdentity = await manager.CreateIdentityAsync(this, DefaultAuthenticationTypes.ApplicationCookie);
            // Add custom user claims here
            return userIdentity;
        }
    }

    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        public ApplicationDbContext()
            : base("TripPlanner", throwIfV1Schema: false)
        {
        }

        public static ApplicationDbContext Create()
        {
            return new ApplicationDbContext();
        }
        
        //protected override void OnModelCreating(DbModelBuilder modelBuilder)
        //{
        //    base.OnModelCreating(modelBuilder);

        //    modelBuilder.Entity<IdentityRole>().HasKey<string>(r => r.Id).ToTable("AspNetRoles");

        //    modelBuilder.Entity<IdentityUser>().ToTable("AspNetUsers");

        //    modelBuilder.Entity<IdentityUserLogin>().HasKey(l => new
        //    {
        //        l.UserId,
        //        l.LoginProvider,
        //        l.ProviderKey
        //    }).ToTable("AspNetUserLogins");

        //    modelBuilder.Entity<IdentityUserRole>().HasKey(r => new
        //    {
        //        r.RoleId,
        //        r.UserId
        //    }).ToTable("AspNetUserRoles");

        //    modelBuilder.Entity<IdentityUserClaim>().ToTable("AspNetUserClaims");
        //}

    }
}