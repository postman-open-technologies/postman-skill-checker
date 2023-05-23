/*
Hello! This is a learning API for the Postman student expert training. 
Check out the template: https://explore.postman.com/templates/11860/student-skill-checker
*/

var xml = require("xml");

var low = require("lowdb");
var FileSync = require("lowdb/adapters/FileSync");
var adapter = new FileSync(".data/db.json");
var db = low(adapter);
const faker = require("faker");
var validator = require("email-validator");
const sendgridmail = require("@sendgrid/mail");

db.defaults({
  learners: [
    {
      id: 1,
      email: "sue.smith@postman.com",
      methods: 0,
      bodies: "",
      auth: "",
      vars: "",
      script: 0,
      rand: "Sue"
    }
  ],
  count: 1,
  calls: []
}).write();

var routes = function(app) {
  app.get("/", function(req, res) {
    var newDate = new Date();
    db.get("calls")
      .push({
        when: newDate.toDateString() + " " + newDate.toTimeString(),
        where: "GET /"
      })
      .write();
    res.status(200).json({
      message:
        "Use the API 101 template in Postman to learn API basics! Import the collection in Postman by clicking " +
        "New > Templates, and searching for 'API 101'. Open the first request in the collection and click Send. " +
        "To see the API code navigate to https://glitch.com/edit/#!/api-101 in your web browser"
    });
  });

  var welcomeMsg =
    "You're using the Postman Skill Checker! " +
    "Click Visualize for a more readable view of the response.";

  app.use("/skills", function(req, res, next) { 
    if (
      req.method === "GET" ||
      req.method === "POST" ||
      req.method === "PUT" ||
      req.method === "DELETE"
    ) {
      var newDate = new Date();
      db.get("calls")
        .push({
          when: newDate.toDateString() + " " + newDate.toTimeString(),
          where: "GET /skills",
          what: req.get("user-id")
        })
        .write();

      var existing = db
        .get("learners")
        .find({ id: req.get("user-id") })
        .value();
      var done = true;
      let learner = {};
      if (existing) {
        let email = "",
          bodies = "",
          methods = 0,
          auth = "",
          vars = "",
          script = 0;
        if (
          req.query.email &&
          req.query.email.length > 0 &&
          validator.validate(req.query.email)
        )
          email = req.query.email;

        if (req.body.name && req.body.name.indexOf("{{") < 0) bodies = req.body.name; 
        if (
          req.method === "POST" ||
          req.method === "PUT" ||
          req.method === "DELETE"
        )
          methods = 1; 
        if (req.get("auth_key") && req.get("auth_key").indexOf("{{") < 0) auth = req.get("auth_key");
        if (req.get("course") && req.get("course").indexOf("{{") < 0) vars = req.get("course");
        if (req.get("response-value") == existing.rand) script = 1;
        learner = {
          email: email,
          methods: methods,
          bodies: bodies,
          auth: auth,
          vars: vars,
          script: script,
          rand: existing.rand
        };
        db.get("learners")
          .find({ id: req.get("user-id") })
          .assign(learner)
          .write();
      } else {
        learner = {
          id: req.get("user-id"),
          email: "",
          methods: 0,
          bodies: "",
          auth: "",
          vars: "",
          script: 0,
          rand: faker.name.firstName()
        };
        db.get("learners")
          .push(learner)
          .write();
      }
      if (
        learner.email.length < 1 ||
        learner.methods < 1 ||
        learner.bodies.length < 1 ||
        learner.auth.length < 1 ||
        learner.vars.length < 1 ||
        learner.script < 1
      )
        done = false;
      let statusCode = done ? 200 : 400;
      let titleMsg = done
        ? "Skill checker complete!!!"
        : "Skill checker incomplete!";
      let introMsg = done
        ? "You completed the skill checker! To complete your training, make sure all of your requests are saved, and in the collection on the "+
          "left of Postman, open the overview > then click **Share collection**. Choose the **Via API** tab and click **Generate API Key** button in the link parameter to get a JSON link."+
          "Copy the address to your clipboard, then open the final "+
          "folder in the collection **3. Check Progress** > open the **Test "+
          "Collection** request, paste your collection link in as the request address, **Send**, and this time open the **Test Results** "+
          "tab to see the status of your collection. Any failed tests will indicate parts of the collection you still need to complete. "+
          "After all your tests pass, **Save** your work and continue with the lessons in Postman Academy to submit your collection and claim your badge (https://academy.postman.com/path/postman-api-fundamentals-student-expert/postman-api-fundamentals-student-expert-certification/1976)"
        : "Now let's reapply the skills you've learned by carrying them out again in this request. Complete each of the following request "+
          "configurations and keep hitting Send to see the list update. When you're done you'll get a 200 OK status code!";

      /*
      if (done) {
        sendgridmail.setApiKey(process.env.SENDGRID_API_KEY);
          const msg = {
            to: "sue.smith@postman.com",
            from: "sue@benormal.info",
            subject: "Checker Submission",
            html:
              "<h1>Learner submission received from:</h1><p>" + learner.email
          };

          sendgridmail.send(msg);
        
      }*/

      res.status(statusCode).json({
        welcome: welcomeMsg,
        title: titleMsg,
        intro: introMsg,
        done: done,
        skills: [
          {
            name: "Changed method",
            hint: "Change the request method to `POST`, `PUT`, or `DELETE`.",
            value: learner.methods > 0 ? true : false
          },
          {
            name: "Sent query parameter",
            hint:
              "Add `email` as a query param, with your student training email address as the value.",
            value: learner.email.length > 0 ? true : false
          },
          {
            name: "Added body data",
            hint:
              "Add JSON body data including a field `name` with the value as your name.",
            value: learner.bodies.length > 0 ? true : false
          },
          {
            name: "Authorized",
            hint:
              "Add API Key auth with the Key name `auth_key` and how much you learned from the student expert template (e.g. `loads`, `nothing`, etc)"+
              " as the value (add to the request header).",
            value: learner.auth.length > 0 ? true : false
          },
          {
            name: "Set a variable",
            hint:
              "Add a new variable to the collection, naming it `myCourse` and enter the reason you're learning about APIs as the Current value. " +
              "(Leave the other var in place.)",
            value: learner.vars.length > 0 ? true : false
          },
          {
            name: "Added a script",
            hint:
              "In this 'Skill check' request, add a test script in the Tests tab that gets the value of the `rand` property in the response JSON and sets it "+
              "as the value of a collection or environment variable named `responseData`. Hint: You'll need to Send the request twice after "+
              "adding your code because it won't save the value until after the response is received the first time.",
            value: learner.script > 0 ? true : false
          }
        ],
        rand: "" + learner.rand
      });
    } else next();
  });

  //protect everything after this by checking for the secret
  app.use((req, res, next) => {
    const apiSecret = req.get("admin_key");
    if (!apiSecret || apiSecret !== process.env.SECRET) {
      res.status(401).json({ error: "Unauthorized" });
    } else {
      next();
    }
  });

  // removes all entries from the collection
  app.get("/clear", (request, response) => {
    // removes all entries from the collection
    db.get("learners")
      .remove()
      .write();
    console.log("Database cleared");
    response.redirect("/");
  });

  //get all entries
  app.get("/all", function(req, res) {
    var learners = db.get("learners").value();
    res.status(200).json({
      learners: learners
    });
  });
  //get all entries
  app.get("/calls", function(req, res) {
    var calls = db.get("calls").value();
    console.log(process.env.PROJECT_REMIX_CHAIN);
    res.status(200).json(calls);
  });
  //admin delete
  app.delete("/records", function(req, res) {
    db.get("learners")
      .remove({ id: parseInt(req.query.learner_id) })
      .write();

    res.status(200).json({ message: "deleted" });
  });
};

module.exports = routes;
