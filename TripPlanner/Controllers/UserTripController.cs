using Microsoft.AspNet.Identity;
using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using TripPlanner.Models;

namespace TripPlanner.Controllers
{
    public class UserTripController : Controller
    {
        TPEntities db = new TPEntities();

        public ActionResult Index(int id)
        {
            string userId = User.Identity.GetUserId();

            //если авторизован
            if (userId != null)
            {
                Users_Trips ut = db.Users_Trips.Where(u_t => u_t.TripId == id && u_t.UserId == userId).FirstOrDefault();

                //если у пользователя уже есть такой маршрут
                if (ut != null)
                {
                    ViewData["Disabled"] = true;
                }
                else
                    ViewData["Disabled"] = false;
            }
            else
                ViewData["Disabled"] = true;

            ViewData["TripId"] = id;

            return PartialView();
        }

        //добавление маршрута пользователю
        public ActionResult Create(int id)
        {
            Users_Trips user_trip = new Users_Trips();
            user_trip.Trip = db.Trips.Find(id);
            string userId = User.Identity.GetUserId();
            user_trip.AspNetUser = db.AspNetUsers.Where(u => u.Id == userId).FirstOrDefault();
            user_trip.Author = false;

            if (ModelState.IsValid)
            {
                db.Users_Trips.Add(user_trip);
                db.SaveChanges();
            }

            return RedirectToAction("Details", "Route", new { id = id });
        }

        //возвращает частичное представление "Отзывы", принимает id маршрута
        public ActionResult IndexComment(int id)
        {
            string userId = User.Identity.GetUserId();
            //если пользователь не авторизован, возвращаем список комментариев к этому маршруту
            if (userId == null)
            {
                Trip trip = db.Trips.Where(t => t.TripId == id).First();

                return PartialView("IndexComment", trip.Users_Trips.ToList());
            }

            Users_Trips u_t = db.Users_Trips.Where(ut => ut.TripId == id && ut.UserId == userId).FirstOrDefault();

            //если этот пользователь еще не оставлял комментарий и оценку к маршруту, но добавил этот маршрут
            if (u_t != null && u_t.CommentText == null)
            {
                ViewBag.TripId = id;
                return PartialView("NoComment");
            }
            //иначе возвращаем список комментариев к этому маршруту
            else
            {
                Trip trip = db.Trips.Where(t => t.TripId == id).First();

                return PartialView("IndexComment", trip.Users_Trips.ToList());
            }
        }

        [HttpPost]
        public ActionResult CreateComment(string CommentText, int Rating, int TripId)
        {
            string userId = User.Identity.GetUserId();
            Users_Trips user_trip = db.Users_Trips.Where(ut => ut.UserId == userId && ut.TripId == TripId).FirstOrDefault();

            user_trip.CommentText = CommentText;
            user_trip.Rating = Rating;

            List<Users_Trips> uts = db.Users_Trips.Where(ut => ut.TripId == TripId && ut.CommentText != null).ToList();

            Trip trip = db.Trips.Find(TripId);
            if (trip == null)
            {
                return HttpNotFound();
            }
            else
            {
                double divider = uts.Count + 1;
                if (trip.Rating == null)
                    trip.Rating = 0;
                trip.Rating = (trip.Rating * uts.Count + Rating) / divider;

                if (ModelState.IsValid)
                {
                    db.Entry(trip).State = EntityState.Modified;
                    db.SaveChanges();
                }
            }

            if (ModelState.IsValid)
            {
                db.Entry(user_trip).State = EntityState.Modified;
                db.SaveChanges();
            }

            return RedirectToAction("Details", "Route", new { id = TripId });
        }

        public ActionResult AdminDesk()
        {
            List<Users_Trips> uts = db.Users_Trips.Where(ut => ut.CommentText != null).ToList();

            return View(uts);
        }

        public ActionResult DeleteComment(string userId, int tripId)
        {
            Users_Trips ut = db.Users_Trips.Where(u_t => u_t.UserId == userId && u_t.TripId == tripId).First();

            if (ut != null)
            {
                ut.CommentText = null;
                db.Entry(ut).State = EntityState.Modified;
                db.SaveChanges();
            }
            return RedirectToAction("AdminDesk");
        }
    }
}