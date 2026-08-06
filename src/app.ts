import express,{ type Express} from "express";
import ROUTES from "./constants/api-routes.js";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import STATUS from "./constants/http-status.js";

const app:Express = express();

app.use(cors());

app.use(helmet());

app.use(compression());

app.use(express.json());

app.get(ROUTES.HEALTH , (req,res) => {

    return res.status(STATUS.SUCCESS.OK).json({ status: "healthy" });
});

export default app;

