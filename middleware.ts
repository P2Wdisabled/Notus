import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import { NextResponse } from 'next/server';
import { query } from './src/lib/database';

// Middleware personnalisé pour vérifier le statut banni
export async function middleware(request: any) {
  // Exécuter le middleware NextAuth d'abord
  const response = await NextAuth(authConfig).auth(request);
  
  // Si l'utilisateur est connecté, vérifier s'il est banni
  if (response && request.nextUrl.pathname !== '/login' && request.nextUrl.pathname !== '/logout') {
    try {
      // Récupérer la session depuis la réponse NextAuth
      const session = response;
      
      if (session?.user?.id) {
        // Vérifier le statut banni dans la base de données
        const userResult = await query(
          'SELECT is_banned FROM users WHERE id = $1',
          [session.user.id]
        );
        
        if (userResult.rows.length > 0 && userResult.rows[0].is_banned) {
          console.log('🚫 Utilisateur banni détecté, redirection vers page banni:', session.user.id);
          // Rediriger vers la page de compte banni
          return NextResponse.redirect(new URL('/banned', request.url));
        }
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du statut banni:', error);
      // En cas d'erreur, continuer normalement
    }
  }
  
  return response;
}

export default middleware;

export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
  runtime: 'nodejs',
};
