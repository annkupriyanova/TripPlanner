using System;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using TripPlanner.Controllers;
using TripPlanner.Models;
using System.Collections.Generic;
using System.Web.Mvc;

namespace TripPlanner.Tests.Controllers
{
    [TestClass]
    public class RouteControllerTest
    {
        [TestMethod]
        public void DetailViewModelNotNull()
        {
            // Arrange
            var mock = new Mock<IRepository>();
            mock.Setup(a => a.GetTrip(31)).Returns(new Trip());
            RouteController controller = new RouteController(mock.Object);

            // Act
            ViewResult result = controller.Details(31, null) as ViewResult;

            // Assert
            Assert.IsNotNull(result.Model);
        }
    }
}
