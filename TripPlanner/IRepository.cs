using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using System.Web;
using TripPlanner.Models;

namespace TripPlanner
{
    public interface IRepository : IDisposable
    {
        List<Trip> GetTripList();
        Trip GetTrip(int id);
        void Create(Trip item);
        void Update(Trip item);
        void Delete(int id);
        void Save();
    }

    public class TripRepository : IRepository
    {
        private TPEntities db;
        public TripRepository()
        {
            this.db = new TPEntities();
        }
        public List<Trip> GetTripList()
        {
            return db.Trips.ToList();
        }
        public Trip GetTrip(int id)
        {
            return db.Trips.Find(id);
        }

        public void Create(Trip c)
        {
            db.Trips.Add(c);
        }

        public void Update(Trip c)
        {
            db.Entry(c).State = EntityState.Modified;
        }

        public void Delete(int id)
        {
            Trip c = db.Trips.Find(id);
            if (c != null)
                db.Trips.Remove(c);
        }

        public void Save()
        {
            db.SaveChanges();
        }

        private bool disposed = false;

        public virtual void Dispose(bool disposing)
        {
            if (!this.disposed)
            {
                if (disposing)
                {
                    db.Dispose();
                }
            }
            this.disposed = true;
        }

        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }
    }
    
}