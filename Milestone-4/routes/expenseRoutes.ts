import { Router } from "express";
import { ObjectId } from "mongodb";
import { addExpense, deleteExpense, filterExpenses, updateExpense, userCollection } from "../database";
import { Person,Expense} from "../interfaces";
import { checkSession } from "../middleware/sessionMiddleware";//middleware imprten
import authRoutes from "./loginRegisterRoute";
import exp from "constants";
const expenseRouter = Router();

//kostentoevoegen route
expenseRouter.get('/KostenToevoegen', checkSession, (req, res) => {
    res.render("KostenToevoegen");
});

expenseRouter.post('/KostenToevoegen', checkSession, async (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login");
    }
   const { description, amount, date, currency, paymentMethod, cardNumber, expiryDate, isIncoming, category, isPaid } = req.body;
      const incomingGeparsed = (isIncoming === "true");
      const amountGeparsed = parseFloat(amount);
      const ispaidGeparsed = (isPaid === "true");
  
      let kosten: Expense = {
          _id: new ObjectId(),//Nieuwe id aanmaken zodat ik die later  kan ophalen om verwijderen/bijwerken
          description: description,
          amount: amountGeparsed, // Zorg ervoor dat amount een float is
          date: date,
          currency: currency,
          paymentMethod: {
              method: paymentMethod,
              CardDetail: {
                  cardNumber: cardNumber,
                  expiryDate: expiryDate
              }
          },
          isIncoming: incomingGeparsed,
          category: category,
          isPaid: ispaidGeparsed,
          tags: []
      };
      //de session id in variabale userid steken
      const userId = new ObjectId(req.session.user._id); // Dit is nu een ObjectId
      console.log(kosten._id);//de kosten tonen die je net hebt gevoegd in terminal
      //id en expense in functie addexpense zie database.ts
      await addExpense(userId, kosten);
      res.redirect("/indexEjs");
});

//kostenbekijken route
expenseRouter.get('/KostenBekijken',checkSession, async (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login");
    }
    const typeFilter = req.query.type as string;
    const typeSearch = req.query.search as string;
    const userId = new ObjectId(req.session.user._id); // Zorg ervoor dat dit een ObjectId is
    const expenses = await filterExpenses(userId, typeFilter, typeSearch);

    console.log('All Expenses:', expenses); //de expenses tonen in terminal
    expenses.forEach(expense => {
        console.log('Expense ID:', expense._id); // Log de ID van elke expense
    });

//budgetLimiet, waarschuwingslociga

    let totalExpenses = 0;
    expenses.forEach(expense => {
        if (!expense.isIncoming) { // Alleen uitgaven tellen
            totalExpenses += expense.amount;
        }
    });
    const budgetOver = req.session.user.budget.monthlyLimit - totalExpenses;


    res.render('KostenBekijken', { expenses, user: req.session.user, typeFilter , totalExpenses: totalExpenses,
        budgetOver: budgetOver});
});

// Route voor het bijwerken van een uitgave
expenseRouter.get('/KostenBewerken/:id',checkSession, async (req, res) => {

    if (!req.session.user) {
        return res.redirect("/login");
    }

    const expenseId = new ObjectId(req.params.id);
    const userId = new ObjectId(req.session.user._id);

    // Zoek de gebruiker
    const user = await userCollection.findOne({ _id: userId });
    if (!user) {
        res.status(404).send('Gebruiker niet gevonden.');
        return;
    }

    // Zoek de specifieke uitgave
    const expense = user.expenses.find(exp => exp._id.toString()=== expenseId.toString());
    if (!expense) {
        res.status(404).send('Uitgave niet gevonden.');
        return;
    }
   

    res.render('KostenBijwerken', { expense, user: req.session.user });
});




expenseRouter.post('/KostenBewerken/:id', checkSession,async (req, res) => {
    try {
    if (!req.session.user) {
        return res.redirect("/login");
    }
 

    const expenseId = new ObjectId(req.params.id);
    const userId = new ObjectId(req.session.user._id);

    const { description, amount, date, currency, paymentMethod, isIncoming, category, isPaid ,cardNumber,expiryDate} = req.body;
    const updatedExpense: Expense = {
        _id: expenseId,
        description,
        amount: parseFloat(amount),
        date,
        currency,
        paymentMethod: {
            method: paymentMethod,
            CardDetail: {
                cardNumber:cardNumber, // Voeg kaartgegevens toe als nodig
                expiryDate:expiryDate
            }
        },
        isIncoming: isIncoming === "true",
        category,
        isPaid: isPaid === "true",
        tags: [] // Voeg tags toe als dat nodig is
    };
console.log("in de kostenbewerken route")
   
        await updateExpense(userId, expenseId, updatedExpense);
        res.redirect('/expenses/KostenBekijken');
    } catch (error) {
        console.error("Fout bij het bijwerken van de uitgave:", error);
        res.status(500).send("Er is een fout opgetreden bij het bijwerken van de uitgave.");
    }
});

// Route voor het verwijderen van een uitgave
expenseRouter.post('/KostenVerwijderen/:id',checkSession, async (req, res) => {
    console.log("Verwijderen route voor id", req.params.id);

    if (!req.session.user) {
        return res.redirect("/login");
    }

    const expenseId = new ObjectId(req.params.id);
    const userId = new ObjectId(req.session.user._id);

    try {
        await deleteExpense(userId, expenseId);
        res.redirect('/expenses/KostenBekijken');
    } catch (error) {
        console.error('Fout bij het verwijderen van de uitgave:', error);
        res.status(500).send('Er is een fout opgetreden bij het verwijderen van de uitgave.');
    }
});

export default expenseRouter; //de routes exporteren om in index te imprtn