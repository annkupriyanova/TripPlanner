using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace TripPlanner.Models
{
    public class PlaceInTableViewModel
    {
        public PlaceInTableViewModel()
        {
            OpeningHours = new List<string>();
        }
        public string Value { get; set; }
        public string Name { get; set; }
        public string Address { get; set; }
        public List<string> OpeningHours { get; set; }
        public string Website { get; set; }
        public int IndexNum { get; set; }
        public int DayNum { get; set; }        
           
    }
}