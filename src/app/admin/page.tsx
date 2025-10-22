import Link from "next/link";
import { UserService } from "@/lib/services/UserService";
import { Button, Card, Badge } from "@/components/ui";
import { User } from "@/lib/types";

export default async function AdminDashboard() {
  const userService = new UserService();
  const usersResult = await userService.getAllUsers(5, 0);
  const recentUsers: User[] = usersResult.success ? (usersResult.users || []) : [];

  return (
    <div className="space-y-6">
      <div className="text-center pt-10">
        <h1 className="text-3xl font-bold text-foreground">
          Tableau de bord administrateur
        </h1>
        <p className="mt-2 text-muted-foreground">
          Gérez votre application Notus depuis cette interface.
        </p>
      </div>

      {/* Statistiques rapides */}
      {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="overflow-hidden">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-primary-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-muted-foreground truncate">
                    Utilisateurs récents
                  </dt>
                  <dd className="text-2xl font-bold text-foreground">
                    {recentUsers.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-muted-foreground truncate">
                    Système opérationnel
                  </dt>
                  <dd className="text-2xl font-bold text-green-600 dark:text-green-400">
                    En ligne
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-muted-foreground truncate">
                    Actions requises
                  </dt>
                  <dd className="text-2xl font-bold text-foreground">
                    0
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </Card>
      </div> */}

      {/* Actions rapides */}
      <Card className="max-w-4xl mx-auto bg-background">
        <Card.Header>
          <Card.Title className="text-foreground text-center">Actions rapides</Card.Title>
        </Card.Header>
        <Card.Content className="flex justify-center items-center">
          <div>
            <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground py-2 px-4">
              <Link href="/admin/users">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                  />
                </svg>
                Gérer les utilisateurs
              </Link>
            </Button>
          </div>
        </Card.Content>
      </Card>

      {/* Utilisateurs récents */}
      <Card className="max-w-4xl mx-auto bg-background">
        <Card.Header>
          <div className="flex items-center justify-between">
            <Card.Title className="text-foreground text-2xl font-semibold">Utilisateurs récents</Card.Title>
            <Button variant="link" asChild className="text-primary hover:text-primary/80">
              <Link href="/admin/users">Voir tous</Link>
            </Button>
          </div>
        </Card.Header>
        <Card.Content className="scroll-smooth">
          {recentUsers.length > 0 ? (
            <div className="overflow-x-auto scroller">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-background">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                      Utilisateur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                      Inscription
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-background divide-y divide-border">
                  {recentUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-medium text-primary">
                                {user.first_name?.charAt(0) || ''}
                                {user.last_name?.charAt(0) || ''}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-foreground">
                              {user.first_name || ''} {user.last_name || ''}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              @{user.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant={
                            user.is_banned
                              ? "destructive"
                              : user.email_verified
                                ? "success"
                                : "warning"
                          }
                        >
                          {user.is_banned
                            ? "Banni"
                            : user.email_verified
                              ? "Actif"
                              : "En attente"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString("fr-FR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                  />
                </svg>
              </div>
              <p className="text-muted-foreground">
                Aucun utilisateur trouvé.
              </p>
            </div>
          )}
        </Card.Content>
      </Card>
    </div>
  );
}

