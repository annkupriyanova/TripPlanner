using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using TripPlanner.Models;

namespace TripPlanner.Controllers
{
    public class RouteController : Controller
    {
        TripPlannerEntities db = new TripPlannerEntities();

        // GET: Route
        public ActionResult Index()
        {
            return View();
        }

        [HttpPost]
        public ActionResult Create(List<string> places)
        {
            int i=1;

            //создание и запись в БД объекта Route
            Route route = new Route();
            route.AspNetUser = db.AspNetUsers.Where(u => u.UserName == User.Identity.Name).FirstOrDefault();
            route.CreationDate = DateTime.Now;

            db.Routes.Add(route);
            db.SaveChanges();

            //создание и запись в БД объектов Node (узлов маршрута)
            foreach(string s in places)
            {
                Node node = new Node();
                node.LatLng = getLatLng(s);

                db.Nodes.Add(node);
                db.SaveChanges();

                //создание и запись в БД объекта Route_Node 
                db.Route_Nodes.Add(new Route_Nodes { Route = route, Node = node, IndexNum = i });
                db.SaveChanges();

                i++;
            }

            return RedirectToAction("Index", "Home");
        }

        private string getLatLng(string s)
        {
            return s.Substring(1, s.Length - 2);
        }

        protected override void Dispose(bool disposing)
        {
            db.Dispose();
            base.Dispose(disposing);
        }
    }
}