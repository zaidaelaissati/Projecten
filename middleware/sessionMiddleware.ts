// sessionMiddleware.ts
import { Request, Response, NextFunction } from 'express';

export function checkSession(req: Request, res: Response, next: NextFunction): void {
    if (req.session.user) {
        next(); // Als de gebruiker ingelogd is ga verder met de route
    } else {
        res.redirect("/login"); // Als de gebruiker niet ingelogd is, stuur naar de loginpagina
    }
}
