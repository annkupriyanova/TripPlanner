using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Net;
using System.Web;
using System.Web.Mvc;
using Microsoft.AspNet.Identity;
using TripPlanner.Models;
using Rotativa;
using System.Web.Script.Serialization;
using System.Web.Security;

namespace TripPlanner.Controllers
{
    public class RouteController : Controller
    {
        TPEntities db = new TPEntities();

        IRepository repo;

        public RouteController(IRepository r)
        {
            repo = r;
        }
        public RouteController()
        {
            repo = new TripRepository();
        }

        public ActionResult Index(List<PlaceViewModel> placesToShow)
        {
            if (Request.IsAjaxRequest())
            {
                return PartialView("PlaceBlocks", placesToShow);
            }

            ViewData["id"] = Request.RequestContext.RouteData.Values["id"];
            ViewData["authorize"] = User.Identity.IsAuthenticated.ToString();

            return View("Index");
        }

        //ищет похожие маршруты(по названию города), id - название места
        public ActionResult SimilarTrips(string id)
        {
            string city = id.Split(' ')[0];
            List<Trip> trips = db.Trips.Where(r => r.Name.Contains(city)).ToList();

            return PartialView(trips);
        }

        public ActionResult PopularTrips()
        {
            List<Trip> trips = db.Trips.Where(t => t.Rating >= 4.5).ToList();

            if (trips.Count > 10)
                return PartialView(trips.GetRange(0, 10));
            else
                return PartialView(trips);
        }

        [HttpPost]
        [Authorize]
        public ActionResult Create(RequestTrip req)
        {
            int numOfNodes = 0;

            Trip trip = new Trip();
            trip.Name = req.Name;
            trip.Duration = Convert.ToInt32(req.Duration);
            trip.PhotoUrl = req.PhotoUrl;
            trip.CreationDate = DateTime.Now;
            foreach(StringPoint[] route in req.Routes)
            {
                numOfNodes += route.Length;
            }
            trip.NumOfNodes = numOfNodes;

            if (ModelState.IsValid)
            {
                db.Trips.Add(trip);
                db.SaveChanges();

                Users_Trips ut = new Users_Trips();                
                string userId = User.Identity.GetUserId();
                ut.AspNetUser = db.AspNetUsers.Where(u => u.Id == userId).FirstOrDefault();
                ut.Trip = trip;
                ut.Author = true;
                if (ModelState.IsValid)
                {
                    db.Users_Trips.Add(ut);
                    db.SaveChanges();
                }

                CreateRoutesAndNodes(req, trip);
            }

            return Json(trip.TripId, JsonRequestBehavior.AllowGet);
        }
        
        //создает узлы маршоута разбивая их по дням
        private void CreateRoutesAndNodes(RequestTrip req, Trip trip)
        {
            int i = 0, j = 0;

            Node startNode = new Node();
            startNode.Lat = double.Parse(req.StartPoint.Lat, CultureInfo.InvariantCulture);
            startNode.Lng = double.Parse(req.StartPoint.Lng, CultureInfo.InvariantCulture);
            startNode.PlaceId = null;
            startNode.Address = req.StartPoint.Address;

            Node endNode = new Node();

            if (req.StartPoint == req.EndPoint)
            {
                endNode = startNode;
            }
            else
            {
                endNode.Lat = double.Parse(req.EndPoint.Lat, CultureInfo.InvariantCulture);
                endNode.Lng = double.Parse(req.EndPoint.Lng, CultureInfo.InvariantCulture);
                endNode.PlaceId = null;
                endNode.Address = req.EndPoint.Address;
            }


            if (ModelState.IsValid)
            {
                db.Nodes.Add(startNode);
                db.Nodes.Add(endNode);
                db.SaveChanges();
            }

            for (i = 0; i < req.Routes.Length; i++)
            {
                Route route = new Route();
                route.Trip = trip;
                route.DayNum = i+1;

                if (ModelState.IsValid)
                {
                    db.Routes.Add(route);
                    db.SaveChanges();

                    for (j = 0; j < req.Routes[i].Length; j++)
                    {
                        Node node = new Node();
                        //node.Lat = double.Parse(req.Routes[i][j].Lat, CultureInfo.InvariantCulture);
                        //node.Lng = double.Parse(req.Routes[i][j].Lng, CultureInfo.InvariantCulture);
                        node.Lat = GetDouble(req.Routes[i][j].Lat);
                        node.Lng = GetDouble(req.Routes[i][j].Lng);

                        node.PlaceId = req.Routes[i][j].PlaceId;
                        node.Address = null;

                        if (ModelState.IsValid)
                        {
                            db.Nodes.Add(node);
                            db.SaveChanges();

                            Routes_Nodes rn = new Routes_Nodes();
                            rn.Node = node;
                            rn.Route = route;
                            rn.IndexNum = j+1;

                            db.Routes_Nodes.Add(rn);
                        }
                    }

                    Routes_Nodes rnStart = new Routes_Nodes();
                    rnStart.Node = startNode;
                    rnStart.Route = route;
                    rnStart.IndexNum = 0;

                    db.Routes_Nodes.Add(rnStart);

                    Routes_Nodes rnEnd = new Routes_Nodes();
                    rnEnd.Node = endNode;
                    rnEnd.Route = route;
                    rnEnd.IndexNum = req.Routes[i].Length+1;

                    db.Routes_Nodes.Add(rnEnd);
                    db.SaveChanges();
                }     
            }
        }

        private double GetDouble(string value)
        {
            double result;

            //Try parsing in the current culture
            if (!double.TryParse(value, System.Globalization.NumberStyles.Any, CultureInfo.CurrentCulture, out result) &&

                //Then try in US english
                !double.TryParse(value, System.Globalization.NumberStyles.Any, CultureInfo.GetCultureInfo("en-US"), out result) &&

                //Then in neutral language
                !double.TryParse(value, System.Globalization.NumberStyles.Any, CultureInfo.InvariantCulture, out result))
            {
                result = 0;
            }

            return result;
        }

        //возвращает подробности маршрута
        public ActionResult Details(int? id, List<PlaceInTableViewModel> placesToShow)
        {
            //if (Request.IsAjaxRequest())
            if (placesToShow != null)
            {
                List<PlaceInTableViewModel> result = placesToShow.OrderBy(x => x.DayNum).ThenBy(x => x.IndexNum).ToList();
                return PartialView("PlacesInTable", result);
            }

            if (id == null)
            {
                return new HttpStatusCodeResult(HttpStatusCode.BadRequest);
            }
            Trip trip = repo.GetTrip((int)id);
            if (trip == null)
            {
                return HttpNotFound();
            }

            //if (User.Identity.IsAuthenticated)
            //{
            //    return View("Details", trip);
            //}
            //else
                return View("DetailsAnonym", trip);

        }

        //возвращает модель Trip в формате JSON
        public JsonResult GetData(int id)
        {
            Trip trip = db.Trips.Where(r => r.TripId == id).FirstOrDefault();
            var model = JsonConvert.SerializeObject(trip);

            return Json(model, JsonRequestBehavior.AllowGet);

        }

        //возвращает в представление все маршруты пользователя
        [Authorize]
        public ActionResult UserTrips()
        {
            string userId = User.Identity.GetUserId();
            
            //if (Roles.IsUserInRole(User.Identity.Name, "admin"))
            if (User.Identity.Name == "annkupriyanova26@gmail.com")
            {
                return RedirectToAction("AdminDesk", "UserTrip");
            }

            var user_trips = db.Users_Trips.Where(ut => ut.UserId == userId);
            List<Trip> trips = new List<Trip>();
            foreach (Users_Trips ut in user_trips)
            {
                trips.Add(ut.Trip);
            }

            return View(trips);
        }

        public JsonResult Count(RequestData data)
        {
            //получили исходные точки
            Point[] points = ParseLatLng(data.Points);

            //получили равноудаленную точку (центр)
            Point center = GetCenteredPoint(points);

            //нашли n = data.Days точек, самых удаленных от центра
            Point[] farawayPoints = GetFarawayPoints(center, points, Convert.ToInt32(data.Days));

            //нашли области на графе
            Point[][] pointsInGroups = DivideInGroups(points, farawayPoints, Convert.ToInt32(data.Days));
            var groups = JsonConvert.SerializeObject(pointsInGroups);

            return Json(groups, JsonRequestBehavior.AllowGet);
        }

        //возвращает точки в  виде объектов Point
        private Point[] ParseLatLng(string[] points)
        {
            string[] values;
            string[] coordinates;
            List<Point> result = new List<Point>();

            for (int i = 0; i < points.Length; i++)
            {
                values = points[i].Split('|');

                values[0] = values[0].Substring(1, values[0].Length - 2);
                coordinates = values[0].Split(',');
                coordinates[1] = coordinates[1].Substring(1);

                result.Add(new Point(double.Parse(coordinates[0], CultureInfo.InvariantCulture),
                    double.Parse(coordinates[1], CultureInfo.InvariantCulture), values[1]));
            }

            return result.ToArray();
        }

        //возвращает центральную точку области
        private Point GetCenteredPoint(Point[] points)
        {
            double minLat = 1000, maxLat = -1000;
            double minLng = 1000, maxLng = -1000;

            foreach (Point point in points)
            {
                if (point.Lat < minLat)
                    minLat = point.Lat;

                if (point.Lng < minLng)
                    minLng = point.Lng;

                if (point.Lat > maxLat)
                    maxLat = point.Lat;

                if (point.Lng > maxLng)
                    maxLng = point.Lng;
            }
            Point center = new Point((minLat + maxLat) / 2, (minLng + maxLng) / 2, "");

            return center;
        }

        //возвращает наиболее удаленные от центра точки
        private Point[] GetFarawayPoints(Point center, Point[] points, int n)
        {
            List<double> distances=new List<double>();
            List<Point> result = new List<Point>();
            double distance;
            int density = points.Length / n;
            if (density == 0)
            {
                density = 1;
                n = points.Length;
            }

            foreach (Point point in points)
            {
                distance = Math.Sqrt(Math.Pow(center.Lat - point.Lat, 2.0) + Math.Pow(center.Lng - point.Lng, 2.0));
                distances.Add(distance);
            }

            Point[] newPoints = new Point[points.Length];
            points.CopyTo(newPoints, 0);

            Sort(distances.ToArray(), 0, distances.Count - 1, newPoints);
            newPoints.Reverse();

            bool close = false, notenough = false;
            for (int i = 0; i < newPoints.Length && result.Count < n; i++)
            {
                if (density == 1)
                {
                    result.Add(newPoints[i]);
                }
                else
                {
                    close = false;

                    if (i == 0)
                    {
                        result.Add(newPoints[i]);
                    }
                    else
                    {
                        if (notenough == false)
                        {
                            foreach (Point p in result)
                            {
                                distance = Math.Sqrt(Math.Pow(p.Lat - newPoints[i].Lat, 2.0) + Math.Pow(p.Lng - newPoints[i].Lng, 2.0));
                                if (distance < 0.05)
                                {
                                    close = true;
                                }
                            }
                            if (close == false)
                            {
                                result.Add(newPoints[i]);
                            }
                            else if (newPoints.Length - i <= n - result.Count)
                            {
                                result.Add(newPoints[i]);
                                notenough = true;
                            }
                        }
                        else
                        {
                            result.Add(newPoints[i]);
                        }

                    }
                }
                
            }

            return result.ToArray();
        }

        //быстрая сортировка
        private Point[] Sort(double[] arr, int l, int r, Point[] points)
        {
            //i и j нужны для цикла
            int i = l;
            int j = r;
            double x = arr[(l + r) / 2]; //Опорная
            double temp;
            Point tmpPoint;
            //Цикл сортировка
            while (i <= j)
            {
                //Деление на меньше и больше опорного
                while (arr[i] < x) i++;
                while (arr[j] > x) j--;
                //Если i<=j:
                if (i <= j)
                {
                    //меняем значение элемонтов
                    temp = arr[i];
                    tmpPoint = points[i];

                    arr[i] = arr[j];
                    points[i] = points[j];

                    arr[j] = temp;
                    points[j] = tmpPoint;

                    i++;
                    j--;
                }
            }
            //Рекурсия
            if (l < j) Sort(arr, l, j, points);
            if (i < r) Sort(arr, i, r, points);

            return points;
        }

        //разбивает все точки на области по дням
        private Point[][] DivideInGroups(Point[] points, Point[] farawayPoints, int n)
        {
            int i = 0, j = 0;
            int indexOfMin = 0;
            double min;
            //делим точки на n=farawayPoints.Length групп
            int density = points.Length / n;
            if (density == 0)
            {
                density = 1;
                n = points.Length;
            }

            List<double>[] distances = new List<double>[n];
            List<Point>[] groups = new List<Point>[n];
            for (i=0; i<n; i++)
            {
                distances[i] = new List<double>();
                groups[i] = new List<Point>();
            }

            //нашли расстояния от удаленных точек до всех остальных
            for (i=0; i< n; i++)
            {
                for (j=0; j<points.Length; j++)
                {
                    distances[i].Add (Math.Sqrt(Math.Pow(farawayPoints[i].Lat - points[j].Lat, 2.0) +
                                                Math.Pow(farawayPoints[i].Lng - points[j].Lng, 2.0)));                   
                }
            }

            
            int selected = 0;
            List<int> groupLength = new List<int>();
            int indexOfMinGroup = 0;

            if (density == 1)
            {
                for (i = 0; i < n; i++)
                {
                    min = distances[i].Min();
                    indexOfMin = distances[i].IndexOf(min);
                    for (j = 0; j < n; j++)
                    {
                        distances[j][indexOfMin] = 1000;
                    }

                    groups[i].Add(points[indexOfMin]);
                }
            }
            else
            {
                for (i = 0; i < n; i++)
                {
                    for (int k = 0; k < distances[i].Count && groups[i].Count < density + 1 && groups[i].Count < 8; k++)
                    {
                        if (distances[i][k] < 0.05)
                        {
                            for (j = 0; j < n; j++)
                            {
                                distances[j][k] = 1000;
                            }
                            groups[i].Add(points[k]);
                            selected++;
                        }
                    }
                    groupLength.Add(groups[i].Count);
                }
                i = 0;
                while (selected < points.Length)
                {
                    indexOfMinGroup = groupLength.IndexOf(groupLength.Min());

                    min = distances[indexOfMinGroup].Min();
                    indexOfMin = distances[indexOfMinGroup].IndexOf(min);
                    for (j = 0; j < n; j++)
                    {
                        distances[j][indexOfMin] = 1000;
                    }

                    groups[indexOfMinGroup].Add(points[indexOfMin]);
                    selected++;

                    groupLength[indexOfMinGroup]++;
                }
            }

            Point[][] result = new Point[n][];
            for (i = 0; i< groups.Length; i++)
            {
                result[i] = groups[i].ToArray();
            }

            return result;
        }

        [Authorize]
        public ActionResult Delete(int id)
        {
            Trip trip = db.Trips.Find(id);
            if (trip != null)
            {
                string userId = User.Identity.GetUserId();
                Users_Trips user_trip = db.Users_Trips.Where(u_t => u_t.TripId == id && u_t.UserId == userId).FirstOrDefault();

                if (user_trip == null)
                {
                    return PartialView("DeleteDenied");
                }

                return PartialView("Delete", trip);
            }
            return View("UserTrips");
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [ActionName("Delete")]
        [Authorize]
        public ActionResult DeleteTrip(int id)
        {
            string userId = User.Identity.GetUserId();

            Users_Trips user_trip = db.Users_Trips.Where(u_t => u_t.TripId == id && u_t.UserId == userId).FirstOrDefault();

            if (user_trip != null)
            {
                db.Users_Trips.Remove(user_trip);
                db.SaveChanges();
            }

            return RedirectToAction("UserTrips");
        }


        //public JsonResult Edit(EditRequest req)
        //{
        //    int i;

        //    Trip trip = db.Trips.Find(Convert.ToInt32(req.TripId));
        //    //Trip newTrip = trip;

        //    Route route = trip.Routes.Where(r => r.DayNum == Convert.ToInt32(req.Day)).First();
        //    //Route newRoute = route;

        //    List<Routes_Nodes> rns = new List<Routes_Nodes>();
        //    foreach(string index in req.Values)
        //    {
        //        i = Convert.ToInt32(index);
        //        rns.Add(route.Routes_Nodes.Where(rn => rn.IndexNum == i).First());
        //    }

        //    List<Node> nodes = new List<Node>();
        //    foreach(Routes_Nodes rn in rns)
        //    {
        //        nodes.Add(rn.Node);
        //    }

        //    List<Route> result = trip.Routes.OrderBy(x => x.Routes_Nodes.Count).ToList();
        //    Route minRoute = result[0];

        //    //save new trip
        //    trip.CreationDate = DateTime.Now;

        //    if (ModelState.IsValid)
        //    {
        //        db.Trips.Add(trip);
        //        db.SaveChanges();

                
        //    }

        //    return Json("", JsonRequestBehavior.AllowGet);
        //}

        protected override void Dispose(bool disposing)
        {
            db.Dispose();
            base.Dispose(disposing);
        }
    }

    public class Point
    {
        public double Lat { get; set; }
        public double Lng { get; set; }
        public string PlaceId { get; set; }
        public string Address { get; set; }


        public Point(double lat, double lng, string placeId)
        {
            Lat = lat;
            Lng = lng;
            PlaceId = placeId;
            Address = null;
        }
    }
   
    //для разбивки всех мест на области по дням
    public class RequestData
    {
        public string[] Points { get; set; }
        public string Days { get; set; }
    }

    //для сохранения маршрута
    public class RequestTrip
    {
        public string Name { get; set; }
        public string Duration { get; set; }
        public string PhotoUrl { get; set; }

        public StringPoint[][] Routes { get; set; }

        public StringPoint StartPoint { get; set; }
        public StringPoint EndPoint { get; set; }

    }

    public class StringPoint
    {
        public string Lat { get; set; }
        public string Lng { get; set; }
        public string PlaceId { get; set; }
        public string Address { get; set; }

    }

    public class EditRequest
    {
        public string TripId { get; set; }
        public string Day { get; set; }
        public string[] Values { get; set; }
    }
}