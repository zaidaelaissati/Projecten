import {Router} from "express";
import bcrypt from "bcrypt";
import { getUserByUsername, addUser } from "../database";
import { ObjectId } from "mongodb";

const authRoutes= Router();

//login route
authRoutes.get("/login", (req, res) => {
    if (req.session.user) {
        return res.redirect("/indexEjs");
    }
    res.render("login");
});

authRoutes.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const user = await getUserByUsername(username);

    if (user && bcrypt.compareSync(password, user.password)) {
               // Als het wachtwoord klopt, worden gegevens in de sessie en gestuurd naar hoofdpagina
        // req.session.user =user ; //hierin wordt de gehele Person gegevens opgeslagen
        //dus sla ik enkel de gegevens op in de sessien, zonder wachtwoord
        req.session.user = {
            _id: user._id,
            username: user.username,
            email: user.email,
            expenses: user.expenses,
            budget: user.budget
        };
        console.log("je bent ingelogd");
        res.redirect("/indexEjs");
    } else {
        res.send("Ongeldige gebruikersnaam of wachtwoord.");
    }
});
//hoofdpaginaroute 
authRoutes.get("/", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login");
    }
    res.redirect("/indexEjs");  //als je bent ingelogd wordt je verstuurd naar hoofdpagina
});


authRoutes.get("/indexEjs", (req, res) => {
    //als gebruiker niet is ingelogd wordt die gestuurd naar login pagina er wordt gekeken naar de session
    if (!req.session.user) {
        return res.redirect("/login");
    }
    res.render("indexEjs", { user: req.session.user });
});

//registratieroute
authRoutes.get("/register", (req, res) => {
    res.render("Registratie");//wordt verstuurd naar registratie.ejs
});

authRoutes.post("/register", async (req, res) => {
    try {
    const { username, email, password, monthlyLimit, notificationThreshold, isActive } = req.body;
      //nakijken als de gebruiker al bestaat zo ja, krijgt die melding dat gebruiker al bestaat
    const existingUser = await getUserByUsername(username);

    if (existingUser) {
        res.status(400).send("De gebruikersnaam bestaat al.");
        return
    }
        //ww hashen
    const hashedPassword = await bcrypt.hash(password, 10);
    
        //als gebruiker neit bestaat wordt er een nieuwe user angemaakt
    const newUser = {
        _id: new ObjectId(),
        username,
        email,
        password: hashedPassword, //met de gehashte ww
        expenses: [],
        budget: {
            monthlyLimit: parseFloat(monthlyLimit),
            notificationThreshold: parseFloat(notificationThreshold),
            isActive: isActive === "on"
        }
    };
       //user wordt opgeslagen in db zie functie adduser
    await addUser(newUser);
    console.log("je bent geregistreerd");
    res.redirect("/login");
} catch (error) {
    console.error("Fout bij registratie:", error);
    res.status(500).send("Er is een fout opgetreden bij de registratie.");
}
});

//uitlogroute
authRoutes.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/login");
    });
    console.log("je wordt uitgelogd")
});

//alle routes exporteren
export default authRoutes;