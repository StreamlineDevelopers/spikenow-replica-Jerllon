import googleUtil from "../src/google-util";
import jwt from "jsonwebtoken";
import UserController from "../controllers/UserController";

const auth = ({ app, config }) => {
  const user = new UserController(config.mysql.client);

  app.post("/google-auth", async (req, res, next) => {
    try {
      console.log(req.body.code);
      const { id, email, full_name, refresh_token } =
        await googleUtil.getGoogleAccountFromCode(req.body.code);
      const token = jwt.sign(
        {
          email,
          id,
          full_name,
          refresh_token,
        },
        "SpikeNowReplicaApi"
      );
      user.saveUser({ email, id });
      res.status(201).json({
        token,
        id,
        email,
        full_name,
      });
    } catch (error) {
      return next(error);
    }
  });

  app.get("/isAuth", async (req, res, next) => {
    if (!req.user || typeof req.user !== "undefined") {
      return res.json(false);
    } else {
      return res.json(true);
    }
  });

  return app;
};

export default auth;
