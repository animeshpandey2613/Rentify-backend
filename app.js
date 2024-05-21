//export statements
const express = require("express");
const morgan = require("morgan");
const UserRouter = require("./Routes/UserRoutes");
const ErrorController = require("./Controllers/ErrorController");
const AppError = require("./Utils/AppError");
const propertyRouter = require("./Routes/PropertyRouter");
const cors = require("cors");

const app = express();

//middlewares
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use("/users", UserRouter);
app.use("/property", propertyRouter);
app.use('/api/users', UserRouter);
app.use('/api/property', propertyRouter); 

app.all("*", (req, res, next) => next(new AppError(`Invalid Route, route = ${req.path}`, 404)));
app.use(ErrorController);

module.exports = app;
