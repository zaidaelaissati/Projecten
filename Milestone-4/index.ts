import express, { Express } from "express";
import dotenv from "dotenv";
import session from "express-session";
import path from "path";
import {connect} from "./database";
import authRoutes from "./routes/loginRegisterRoute";
import expenseRouter from "./routes/expenseRoutes";
import { checkSession } from "./middleware/sessionMiddleware";

dotenv.config();

const app: Express = express();
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("views", path.join(__dirname, "views"));


// sessie
app.use(session({
    secret: 'mijn-geheime-sleutel',
    resave: false,
    saveUninitialized: true,
    cookie: { 
        httpOnly:true,
        secure: false,
    sameSite:"strict" }
}));
//secure cookie kan enkel verstuurd worden over https beveilidge verbinding
//samesite bepaalt of cookie meegestuurd mag worden
//httpOnly: cookie kan niet aangepast worden door client-side js

connect(); //functie aanroepen om te connecteren met db
app.use("/", authRoutes);//route authroute (login, register, en uitlogroute)
app.use("/expenses", checkSession, expenseRouter);//middleware om te kijken of gebruiker is ingelogd, route voor kostentoevoege, bewerken,bekijken en verwijderen

app.listen(process.env.PORT ?? 3000, () => {
    console.log("Server started on http://localhost:" + (process.env.PORT ?? 3000));
});
