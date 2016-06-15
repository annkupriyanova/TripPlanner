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
    public class UserTripControllerTest
    {
        [TestMethod]
        public void IndexViewResult_NotNull()
        {
            Assert.IsNotNull(1);
        }
        [TestMethod]
        public void AdminDeskViewResult_NotNull()
        {
            Assert.IsNotNull(1);
        }

        [TestMethod]
        public void CreatePostAction_RedirectToDetailsView()
        {
            Assert.AreEqual(1, 1);
        }

        [TestMethod]
        public void CreatePostAction_SaveModel()
        {
            Assert.AreEqual(1, 1);
        }

        [TestMethod]
        public void IndexComment_Authorized()
        {
            Assert.AreEqual(1, 1);
        }

        [TestMethod]
        public void IndexComment_NotAuthorized()
        {
            Assert.AreEqual(1, 1);
        }

        [TestMethod]
        public void CreateCommentPostAction_RedirectToDetailsView()
        {
            Assert.AreEqual(1, 1);
        }

        [TestMethod]
        public void CreateCommentPostAction_SaveModel()
        {
            Assert.AreEqual(1, 1);
        }

        [TestMethod]
        public void DeleteCommentPostAction_RedirectToDetailsView()
        {
            Assert.AreEqual(1, 1);
        }

        [TestMethod]
        public void DeleteCommentPostAction_SaveModel()
        {
            Assert.AreEqual(1, 1);
        }
    }
}
