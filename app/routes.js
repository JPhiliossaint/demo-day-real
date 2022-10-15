module.exports = function (app, passport, db, multer, ObjectId) {
  // Image Upload Code =========================================================================
  var storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "public/images/uploads");
    },
    filename: (req, file, cb) => {
      cb(null, file.fieldname + "-" + Date.now() + ".png");
    },
  });
  var upload = multer({ storage: storage });

  // req.user === authenticated user. req.user._id

  // normal routes ===============================================================

  // show the home page (will also have our login links)
  app.get("/", function (req, res) {
    res.render("index.ejs");
  });

  // PROFILE SECTION =========================
  app.get("/profile", isLoggedIn, function (req, res) {
    db.collection("posts")
      .find({ caption: "asdflkjasdflkasjdf" })
      .toArray((err, result) => {
        if (err) return console.log(err);

        console.log(result);
      });
    db.collection("posts")
      .find({ postedBy: req.user._id })
      .toArray((err, result) => {
        if (err) return console.log(err);
        res.render("profile.ejs", {
          user: req.user,
          posts: result,
        });
      });
  });
  app.put("/updateUserProfile", isLoggedIn, function (req, res) {
    // db.collection('users').findOneAndUpdate({name: req.body.name,})
    console.log(req.body);
  });
  //feed page
  app.get("/feed", function (req, res) {
    db.collection("posts")
      .find()
      .toArray((err, result) => {
        if (err) return console.log(err);
        console.log(result);
        res.render("feed.ejs", {
          user: req.user,
          posts: result,
        });
      });
  });
  //post page
  //  "/post/asdf" "/post/:id"
  //  req.params.<param name> (req.params.id)
  //  /post/19823sedf82394ref789q3fa
  //  req.params = {
  //    apple:  "19823sedf82394ref789q3fa"
  // }

  // req.params.apple
  // app.get('/edit/:zebra', isLoggedIn, function (req, res) {
  //   let postId = ObjectId(req.params.zebra)
  //   console.log(postId)
  //   db.collection('posts').find({ _id: postId }).toArray((err, result) => {
  //     if (err) return console.log(err)
  //     db.collection('comments').find({ eventID: postId, postedBy: req.user._id }).toArray((err, comments) => {
  //       console.log(comments)
  //       res.render('edit.ejs', {
  //         posts: result, comments
  //       })
  //     })

  //   })
  // });

  app.get("/post/:zebra", isLoggedIn, function (req, res) {
    let postId = ObjectId(req.params.zebra);
    console.log(postId);
    db.collection("posts")
      .aggregate([
        { $match: { _id: postId } },
        {
          $lookup: {
            from: "users",
            localField: "registeredUsers",
            foreignField: "_id",
            as: "registeredUsers",
          },
        },
      ])
      .toArray((err, result) => {
        if (err) return console.log(err);
        console.log(result);
        const registered = result[0].registeredUsers.some(
          (user) => String(user._id) == String(req.user._id)
        );
        console.log(
          "REGISTERED?:",
          result[0].registeredUsers,
          req.user._id,
          registered
        );
        db.collection("comments")
          .find({ eventID: postId, postedBy: req.user._id })
          .toArray((err, comments) => {
            console.log(comments);

            res.render(
              String(result[0].postedBy) === String(req.user._id)
                ? "edit.ejs"
                : "post.ejs",
              {
                posts: result,
                comments,
                registered,
              }
            );
          });
      });
  });

  app.post("/post/:zebra/delete", isLoggedIn, function (req, res) {
    let postId = ObjectId(req.params.zebra);
    db.collection("posts").remove({ _id: postId });
    res.redirect("/feed");
  });

  app.post("/post/:zebra/register", isLoggedIn, function (req, res) {
    let postId = ObjectId(req.params.zebra);

    db.collection("posts").findOneAndUpdate(
      { _id: postId },
      [
        {
          $set: {
            registeredUsers: {
              $cond: [
                { $in: [req.user._id, "$registeredUsers"] },
                { $setDifference: ["$registeredUsers", [req.user._id]] },
                { $concatArrays: ["$registeredUsers", [req.user._id]] },
              ],
            },
          },
        },
      ],
      (err, result) => {
        if (err) return console.log(err);
        console.log("saved to database");
        res.redirect(`/post/${req.params.zebra}`);
      }
    );
  });

  app.post("/post/:zebra", (req, res) => {
    let postId = ObjectId(req.params.zebra);
    db.collection("posts").findOneAndUpdate(
      { _id: postId },
      {
        $set: {
          newEvent: req.body.eventName,
          eventDate: req.body.eventDate,
          description: req.body.description,
        },
      },
      (err, result) => {
        if (err) return console.log(err);
        console.log("saved to database");
        res.redirect(`/post/${req.params.zebra}`);
      }
    );
  });

  //profile page
  app.get("/page/:id", isLoggedIn, function (req, res) {
    let postId = ObjectId(req.params.id);
    db.collection("posts")
      .find({ postedBy: postId })
      .toArray((err, result) => {
        if (err) return console.log(err);
        res.render("page.ejs", {
          posts: result,
        });
      });
  });

  // LOGOUT ==============================
  app.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/");
  });
  // post routes

  /*
  
  <form action="/makePost" method="post">
  <input name="caption" type="text" placeholder="Caption">
  <input name="file-to-upload" type="file">
  <input type="submit" value="Make Post!">
  </form>
  
  */

  app.post("/makePost", upload.single("file-to-upload"), (req, res) => {
    let user = req.user._id;
    db.collection("posts").save(
      {
        caption: req.body.caption,
        img: "images/uploads/" + req.file.filename,
        postedBy: user,
      },
      (err, result) => {
        if (err) return console.log(err);
        console.log("saved to database");
        res.redirect("/feed");
      }
    );
  });

  // message board routes ===============================================================

  app.post("/messages", (req, res) => {
    db.collection("messages").save(
      { name: req.body.name, msg: req.body.msg, thumbUp: 0, thumbDown: 0 },
      (err, result) => {
        if (err) return console.log(err);
        console.log("saved to database");
        res.redirect("/feed");
      }
    );
  });

  app.put("/messages", (req, res) => {
    db.collection("messages").findOneAndUpdate(
      { name: req.body.name, msg: req.body.msg },
      {
        $set: {
          thumbUp: req.body.thumbUp + 1,
        },
      },
      {
        sort: { _id: -1 },
        upsert: true,
      },
      (err, result) => {
        if (err) return res.send(err);
        res.send(result);
      }
    );
  });

  app.delete("/messages", (req, res) => {
    db.collection("messages").findOneAndDelete(
      { name: req.body.name, msg: req.body.msg },
      (err, result) => {
        if (err) return res.send(500, err);
        res.send("Message deleted!");
      }
    );
  });

  // =============================================================================
  // AUTHENTICATE (FIRST LOGIN) ==================================================
  // =============================================================================

  // locally --------------------------------
  // LOGIN ===============================
  // show the login form
  app.get("/login", function (req, res) {
    res.render("login.ejs", { message: req.flash("loginMessage") });
  });

  // process the login form
  app.post(
    "/login",
    passport.authenticate("local-login", {
      successRedirect: "/feed", // redirect to the secure profile section
      failureRedirect: "/login", // redirect back to the signup page if there is an error
      failureFlash: true, // allow flash messages
    })
  );

  // SIGNUP =================================
  // show the signup form
  app.get("/signup", function (req, res) {
    res.render("signup.ejs", { message: req.flash("signupMessage") });
  });

  // process the signup form
  app.post(
    "/signup",
    passport.authenticate("local-signup", {
      successRedirect: "/feed", // redirect to the secure profile section
      failureRedirect: "/signup", // redirect back to the signup page if there is an error
      failureFlash: true, // allow flash messages
    })
  );

  // add new Events

  app.get("/newEvent", function (req, res) {
    res.render("newEvent.ejs");
  });

  app.post("/newEvent", (req, res) => {
    db.collection("posts").insertOne(
      {
        newEvent: req.body.eventName,
        eventDate: req.body.eventDate,
        description: req.body.description,
        registeredUsers: [req.user._id],
        postedBy: req.user._id,
      },
      (err, result) => {
        if (err) return console.log(err);
        console.log("saved to database");
        res.redirect("/feed");
      }
    );
  });

  // Comments Section

  app.post("/post/:id/comment", (req, res) => {
    let postId = ObjectId(req.params.id);
    db.collection("comments").insertOne(
      {
        eventComment: req.body.eventComment,
        postedBy: req.user._id,
        eventID: postId,
      },
      (err, result) => {
        if (err) return console.log(err);
        console.log("saved to database");
        res.redirect(`/post/${req.params.id}`);
      }
    );
  });
  // =============================================================================
  // UNLINK ACCOUNTS =============================================================
  // =============================================================================
  // used to unlink accounts. for social accounts, just remove the token
  // for local account, remove email and password
  // user account will stay active in case they want to reconnect in the future

  // local -----------------------------------
  app.get("/unlink/local", isLoggedIn, function (req, res) {
    var user = req.user;
    user.local.email = undefined;
    user.local.password = undefined;
    user.save(function (err) {
      res.redirect("/feed");
    });
  });
};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();

  res.redirect("/");
}
