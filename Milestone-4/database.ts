import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv"; //dotenv gegevens ophalen
import { Expense, Person } from "./interfaces"; // de interface importeren
import 'express-session';
//eigen mongo client maken 
dotenv.config({path:"./.env"});
// export const client = new MongoClient("mongodb+srv://zaidaelaissati:s121864@webontwikkeling.b1c5s.mongodb.net/");
const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');

 // Haal de URI uit de .env
//db maken met de collection in en uitgaven en haalt de Expense uit de interface
export const userCollection = client.db("Milestone4").collection<Person>("users");

//ervoor zorgen dat verbinding opgezet en erna afgesloten
async function exit() {
    try {
        await client.close();
        console.log("Disconnected from database");
    } catch (error) {
        console.error(error);
    }
    process.exit(0);
}

//nieuwe gebruiker voegen
export async function addUser(user: Person) {
    try {
        const result = await userCollection.insertOne(user);
        console.log("Nieuwe gebruiker toegevoegd:", result);
    } catch (error: any) {
        console.error("Er is een fout opgetreden bij het toevoegen van de gebruiker:", error.message);
        throw new Error("Er is een fout opgetreden bij het toevoegen van de gebruiker.");
    }
}


//gebruiker zoeken en tonen op basis van naam
export async function getUserByUsername(username: string) {
    try {
        return await userCollection.findOne({ username });
    } catch (error: any) {
      
        
            console.error("Er is een onbekende fout opgetreden:", error);
            throw new Error("er is een fout opgetreden.");
        }
    
}



//-------------CRUD toepassen-------------
//----create---- x

//kosten toevoegen en wegshcrijven in db

export async function addExpense(userId: ObjectId, expense: Expense) {
    try {
        const user = await userCollection.findOne({ _id: userId });
        if (user) {
            expense._id = new ObjectId(); // Genereer een unieke _id voor de expense
            user.expenses.push(expense);

            //budgetlimietLogica
            let totalExpenses = 0;
            for (const exp of user.expenses) {
                if (!exp.isIncoming) {  // Alleen uitgaven tellen
                    totalExpenses += exp.amount;
                }
            }

            const BugetOver = user.budget.monthlyLimit - totalExpenses;

            
            // Update de gebruiker in de database
            await userCollection.updateOne(
                { _id: userId },
                { $set: { expenses: user.expenses } }
            );
            console.log(`Je hebt ${totalExpenses} gespendeerd.`);
            console.log(`Je hebt nog ${BugetOver} over van je budget.`);
return {totalExpenses,BugetOver};
           
        } else {
            throw new Error("Gebruiker niet gevonden.");
        }
    } catch (error: any) {
        console.error("Er is een fout opgetreden bij het toevoegen van een uitgave:", error.message);

        throw error; 
    }
}






//----read----- x

//in en uitgaven filteren + in en uitgaven zoeken op naam
export async function filterExpenses(userId: ObjectId, type: string, search: string) {
try {
    

    //de juiste id zoeken en op basis daarvan de kosten later kunnen bekijken
    const user = await userCollection.findOne({ _id: userId });

    if (!user) {
        throw new Error('Gebruiker niet gevonden.');
    }



    // Filter op basis van type (incoming of outgoing)
    if (type === 'incoming') {
        user.expenses = user.expenses.filter(expense => expense.isIncoming);
       
       
    } else if (type === 'outgoing') {
        user.expenses = user.expenses.filter(expense => !expense.isIncoming);
      
    }

// Filter  op basis van zoekterm
    if (search) {
        user.expenses = user.expenses.filter(expense =>
            expense.description.toLowerCase().includes(search.toLowerCase()));

    }
    return user.expenses;

}
    catch (error:any) {
        console.error("Er is een fout opgetreden bij het filteren van de uitgaven:", error.message);
        throw error; 
    }
}










//----update---- 
//in en uitgaven aanpassen
export async function updateExpense(userId: ObjectId, expenseId: ObjectId, updatedExpense: Expense) {

try {
    
 
    // Verifieer of de gebruiker bestaat
    const user = await userCollection.findOne({ _id: userId });
    if (!user) {
        throw new Error("Gebruiker niet gevonden.");
    }

    // Update de specifieke expense binnen de array
    const result = await userCollection.updateOne(
        { _id: userId, "expenses._id": expenseId },
        {
            $set: {
                "expenses.$.description": updatedExpense.description,
                "expenses.$.amount": updatedExpense.amount,
                "expenses.$.date": updatedExpense.date,
                "expenses.$.currency": updatedExpense.currency,
                "expenses.$.paymentMethod": updatedExpense.paymentMethod,
            
                "expenses.$.isIncoming": updatedExpense.isIncoming,
                "expenses.$.category": updatedExpense.category,
                "expenses.$.isPaid": updatedExpense.isPaid,
                "expenses.$.tags": updatedExpense.tags,
            },
        }
    );


    console.log("Uitgave bijgewerkt:", expenseId);
}
    catch (error: any) {
        console.error("Er is een fout opgetreden bij het bijwerken van de uitgave:", error.message);
        throw error; // De fout verder doorgeven
    }
}

//----delete---- 
//in en uitgaven verwijderen
export async function deleteExpense(userId: ObjectId, expenseId: ObjectId) {
    await userCollection.updateOne(
        { _id: userId },
        { $pull: { expenses: { _id: expenseId } } } // Verwijder de uitgave met het gegeven expenseId
    );
}

export async function connect() {
    try {
        await client.connect();
        console.log("Connected to database");
        process.on("SIGINT", exit); //als je ctr c drukt dan wordt functie exit toegepast dus conenction afgesloten
    } catch (error) {
        console.error(error);
    }
}