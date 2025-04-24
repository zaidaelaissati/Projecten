import { ObjectId } from "mongodb";


declare module 'express-session' {
    export interface SessionData {
        // user?: Person;
        //zonder wachtwoord
        user?:{
            _id:ObjectId,
            username:string,
            email:string
            expenses:Expense[],
            budget:Budget
        }
    }
}
export interface Person {
    _id: ObjectId;
    // id:       number;
    
    username:     string;
    email:    string;
    password: string;
    expenses: Expense[];
    budget:   Budget;
}

export interface Budget {
    monthlyLimit:            number;
    notificationThreshold: number;
    isActive:              boolean;
}

export interface Expense {
    // id:            number;
    _id: ObjectId;
    description:   string;
    amount:        number;
    date:          string;
    currency:      string;
    paymentMethod: PaymentMethod;
    isIncoming:    boolean;
    category:      string;
    tags:          string[];
    isPaid:        boolean;
}

export interface PaymentMethod {
    method:     string;
    CardDetail: CardDetail;
}

export interface CardDetail {
    cardNumber: string;
    expiryDate: string;
}