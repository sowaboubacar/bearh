import { Link } from "@remix-run/react";
import { UserSection } from "~/datas/userSections";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";

export function UserSectionsGrid({
  userId,
  userSections,
  can,
}: {
  userId: string;
  userSections: UserSection[];
  can?: Record<string, boolean>;
}) {
  if (!userSections) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {userSections?.map((section) => {
        if (can?.view) {
          return (
            <Card
              key={section.title}
              className="hover:shadow-lg transition-shadow h-full"
            >
              <Link
                to={section.link.replace(":id", userId)}
                prefetch="intent"
                className="block h-full"
              >
                <div className="flex flex-col h-full">
                  <CardHeader className="flex items-center space-x-4 p-6">
                    <section.icon className="w-6 h-6 text-primary" />
                    <CardTitle className="text-xl font-semibold">
                      {section.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 flex-grow">
                    <p className="text-gray-600">{section.description}</p>
                  </CardContent>
                </div>
              </Link>
            </Card>
          );
        }
      })}
    </div>
  );
}
