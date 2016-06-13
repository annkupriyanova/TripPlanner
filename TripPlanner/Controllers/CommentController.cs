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
    public class CommentController : Controller
    {
        TPEntities db = new TPEntities();

        ////возвращает частичное представление "Отзывы", принимает id маршрута
        //public ActionResult Index(int id)
        //{
        //    string userId = User.Identity.GetUserId();
        //    //если пользователь не авторизован, возвращаем список комментариев к этому маршруту
        //    if (userId == null)
        //    {
        //        Trip trip = db.Trips.Where(t => t.TripId == id).First();

        //        return PartialView("Index", trip.Comments.ToList());
        //    }

        //    Comment comment = db.Comments.Where(c => (c.TripId == id) && (c.UserId == userId)).FirstOrDefault();

        //    Users_Trips u_t = db.Users_Trips.Where(ut => ut.TripId == id && ut.UserId == userId).FirstOrDefault();

        //    //если этот пользователь еще не оставлял комментарий и оценку к маршруту, но добавил этот маршрут
        //    if (comment == null && u_t != null)
        //    {
        //        ViewBag.TripId = id;
        //        return PartialView("NoComment");
        //    }
        //    //иначе возвращаем список комментариев к этому маршруту
        //    else
        //    {
        //        Trip trip = db.Trips.Where(t => t.TripId == id).First();

        //        return PartialView("Index", trip.Comments.ToList());
        //    }
        //}

        //[HttpPost]
        //public ActionResult Create(Comment comment)
        //{
        //    string userId = User.Identity.GetUserId();
        //    comment.AspNetUser = db.AspNetUsers.Where(u => u.Id == userId).FirstOrDefault();

        //    Trip trip = db.Trips.Find(comment.TripId);
        //    if (trip == null)
        //    {
        //        return HttpNotFound();
        //    }
        //    else
        //    {
        //        double divider = trip.Comments.Count + 1;
        //        if (trip.Rating == null)
        //            trip.Rating = 0;
        //        trip.Rating = (trip.Rating * trip.Comments.Count + comment.Rating) / divider;

        //        if (ModelState.IsValid)
        //        {
        //            db.Entry(trip).State = EntityState.Modified;
        //            db.SaveChanges();
        //        }
        //    }

        //    if (ModelState.IsValid)
        //    {
        //        db.Comments.Add(comment);
        //        db.SaveChanges();
        //    }

        //    return RedirectToAction("Details", "Route", new { id = comment.TripId });
        //}
    }
}