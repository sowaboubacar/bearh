/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  LinksFunction,
  redirect,
  type ActionFunctionArgs,
} from "@remix-run/node";
import { Form, Link, useActionData, useNavigation } from "@remix-run/react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "~/components/ui/input-otp";
import { authService } from "~/services/auth.service.server";
import { commitSession, getSession } from "~/utils/session.server";
import { motion } from "framer-motion";
import { ArrowLeftIcon, LockIcon } from "lucide-react";
import { attendanceService } from "~/services/attendance.service.server";
import { CheckLocationButton } from "~/components/CheckLocationButton";
import { convertMeterToKilometer } from "~/utils/distance";
import { PointageActions } from "~/core/entities/utils/access-permission";

export const links: LinksFunction = () => [
  {
    rel: "preload",
    as: "image",
    href: "https://images.unsplash.com/photo-1562243061-204550d8a2c9?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    rel: "preload",
    as: "image",
    href: "/img/logo-rect-white.png",
  },
  {
    rel: "preload",
    as: "image",
    href: "/img/logo-rect-dark.png",
  },
];

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const pin = formData.get("pin") as string;
  const latitude = parseFloat(formData.get("latitude") as string);
  const longitude = parseFloat(formData.get("longitude") as string);

  if (isNaN(latitude) || isNaN(longitude)) {
    return Response.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  try {
    const { distance, isWithinRadius } =
      await attendanceService.checkUserProximityToAuthorizedPoint(
        latitude,
        longitude
      );

    if (!isWithinRadius) {
      return Response.json(
        {
          error:
            "Position non autorisé. Plus de " +
            convertMeterToKilometer(distance).toFixed(2) +
            " (Km) de la pharmacie !",
        },

        { status: 403 }
      );
    }

    const authResult = await authService.withPinSharedAuth(pin);

    if (authResult) {
      const { user, token } = authResult;
      
      // If user cannot DoSharedAuthLoginOnPublicCheckRoute, return 403
      const canDoThis = authService.can(user?.id as string, {any: [
        PointageActions.DoSharedAuthLoginOnPublicCheckRoute,
      ]});

      if (!canDoThis) {
        return Response.json(
          { error: "Vous n'êtes pas autorisé à faire l'authentification partagé pour le pointage" },
          { status: 403 }
        );
      }


      const session = await getSession(request.headers.get("Cookie"));
      authService.setSharedAuth(session, token);
      const setCookieHeader = await commitSession(session);

      return redirect("/check", {
        headers: { "Set-Cookie": setCookieHeader },
      });
    } else {
      return Response.json({ error: "Code PIN invalide" }, { status: 401 });
    }
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export default function SharedAuth() {
  const [pin, setPin] = useState("");
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const handleLocationObtained = (latitude: number, longitude: number) => {
    setLatitude(latitude);
    setLongitude(longitude);
  };

  return (
    <div
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1562243061-204550d8a2c9?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
      }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100 p-4"
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  delay: 0.2,
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                }}
              >
                <LockIcon className="w-16 h-16 text-indigo-500" />
              </motion.div>
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-bold text-center text-gray-800">
              Checking Sécurisé
            </CardTitle>
            <CardDescription className="text-center text-gray-600">
              Entrez votre code PIN pour continuer.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CheckLocationButton onLocationObtained={handleLocationObtained} />

            {latitude && longitude && (
              <Form method="post" className="space-y-6">
                {actionData?.error && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-red-500 text-center text-sm mt-2 mb-2"
                  >
                    {actionData.error}
                  </motion.p>
                )}
                <input
                  type="hidden"
                  name="latitude"
                  value={latitude?.toString()}
                />
                <input
                  type="hidden"
                  name="longitude"
                  value={longitude?.toString()}
                />
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={4}
                    value={pin}
                    onChange={(value) => setPin(value)}
                    render={({ slots }) => (
                      <InputOTPGroup className="gap-2 sm:gap-4">
                        {slots.map((slot, index) => (
                          <InputOTPSlot
                            key={index}
                            {...slot}
                            className="w-12 h-12 sm:w-16 sm:h-16 text-2xl sm:text-3xl"
                          />
                        ))}
                      </InputOTPGroup>
                    )}
                  />
                  <input type="hidden" name="pin" value={pin} />
                </div>

                <div className="flex justify-center">
                  <Button
                    type="submit"
                    disabled={isSubmitting || pin.length !== 4}
                    className="w-full sm:w-auto px-8 py-3 text-lg font-semibold transition-all duration-200 ease-in-out transform hover:scale-105"
                  >
                    {isSubmitting ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        Vérification...
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        Valider
                      </motion.div>
                    )}
                  </Button>
                </div>
                <div className="text-center">
                  <Link to="/">
                    <p
                      className="flex items-center justify-center text-sm text-gray-600"
                      style={{ color: "rgba(107, 114, 128, 1)" }}
                    >
                      <ArrowLeftIcon className="h-3.5 w-3.5 xs:w-4 xs:h-4" />
                      Espace Personnel
                    </p>
                  </Link>
                </div>
              </Form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
