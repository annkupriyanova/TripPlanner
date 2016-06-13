using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace TripPlanner.Models
{
    public class PlaceViewModel
    {
        public PlaceViewModel()
        {
            Reviews = new List<Review>();
            OpeningHours = new List<string>();
        }
        public string Value { get; set; }
        public string Name { get; set; }
        public string Address { get; set; }
        public List<string> OpeningHours { get; set; }
        public List<Review> Reviews { get; set; }       
        public string PhotoUrl { get; set; }
        public string Rating { get; set; }
        //public string Url { get; set; }
        public string Website { get; set; }
    }

    public class Review
    {
        public string AuthorName { get; set; }
        public string Text { get; set; }
        public string Rating { get; set; }
    }
}