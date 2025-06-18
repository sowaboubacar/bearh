import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { ThumbsUp, ThumbsDown, Minus, Trophy, Star, Info } from 'lucide-react';
import {
  IEmployeeOfTheMonth,
  IVote,
} from "~/core/entities/employeeOfTheMonth.entity.server";
import { Link, useFetcher, useLoaderData } from "@remix-run/react";
import { motion } from "framer-motion";
import { LoaderFunctionArgs, json } from "@remix-run/node";
import { employeeOfTheMonthService } from "~/services/employeeOfTheMonth.service.server";
import { formatDateToFrenchWithTime } from "~/utils/dateFormatting";
import { authService } from "~/services/auth.service.server";
import { HallOfFameActions } from "~/core/entities/utils/access-permission";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const currentUser = await authService.requireUser(request, {condition: {any: [HallOfFameActions.CastVote]}});
  const currentCandidates = await employeeOfTheMonthService.getNominationsInRange();

  // Get the user's votes for each candidate
  const userVotes = await Promise.all(
    currentCandidates.map(async (candidate) => {
      const vote = await employeeOfTheMonthService.getUserVoteForCandidate(candidate.id, currentUser.id);
      return { candidateId: candidate.id, voteValue: vote?.voteValue };
    })
  );

  return Response.json({ currentCandidates, currentUser, userVotes });
};

export const action = async ({ request }: LoaderFunctionArgs) => {
  const currentUser = await authService.requireUser(request, {condition: {any: [HallOfFameActions.CastVote]}});
  const formData = await request.formData();
  const voteValue = Number(formData.get("voteValue"));
  const candidateId = formData.get("candidateId") as string;

  await employeeOfTheMonthService.castVote(candidateId, currentUser.id as string, voteValue);

  return Response.json({success: true, message: "Vote cast successfully" });
}

export default function EmployeeOfTheMonthOngoing() {
  const { currentCandidates, currentUser, userVotes } = useLoaderData<typeof loader>();
  const [candidates, setCandidates] = useState<IEmployeeOfTheMonth[]>(currentCandidates);
  const fetcher = useFetcher();
  const [localUserVotes, setLocalUserVotes] = useState<{ [key: string]: number | undefined }>(
    userVotes.reduce((acc, vote) => ({ ...acc, [vote.candidateId]: vote.voteValue }), {})
  );

  const handleVote = (candidateId: string, voteValue: number) => {
    if (localUserVotes[candidateId] !== undefined) return;

    setCandidates((prevCandidates) =>
      prevCandidates.map((candidate) =>
        candidate.id === candidateId
          ? {
              ...candidate,
              votes: [
                ...candidate.votes,
                { voter: currentUser?.id, voteValue, votedAt: new Date() },
              ],
            }
          : candidate
      )
    );

    setLocalUserVotes((prevVotes) => ({
      ...prevVotes,
      [candidateId]: voteValue,
    }));

    const formData = new FormData();
    formData.append("candidateId", candidateId);
    formData.append("voteValue", String(voteValue));
    fetcher.submit(formData, {
      method: "post",
      action: "/o/hall-of-fame/ongoing",
    });
  };

  const getVoteCount = (votes: IVote[], voteValue: number) =>
    votes.filter((vote) => vote.voteValue === voteValue).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-white">
      <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-primary-800 flex items-center justify-center">
            <Trophy className="mr-2 h-10 w-10 text-yellow-500" />
            Employé du Mois
          </h1>
          <p className="text-xl sm:text-2xl text-primary-600 mb-6">
            Votre voix compte ! Participez à l'élection de l'Employé du Mois
          </p>
          <Card className="bg-white p-6 max-w-2xl mx-auto">
            <CardContent>
              <Info className="h-8 w-8 text-primary-500 mb-4 mx-auto" />
              <h2 className="text-lg sm:text-xl font-semibold mb-2">
                Comment ça marche ?
              </h2>
              <p className="text-gray-600">
                Vous pouvez voter une seule fois pour chaque candidat.
                Choisissez parmi trois options :
                <span className="font-semibold text-green-600"> J'accepte</span>,
                <span className="font-semibold text-gray-600"> Neutre</span>,
                ou
                <span className="font-semibold text-red-600"> Je refuse</span>.
                Votre décision est définitive pour chaque candidat, alors
                choisissez judicieusement !
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {candidates.map((candidate, index) => (
            <motion.div
              key={candidate.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="overflow-hidden transition-all duration-300 hover:shadow-2xl bg-white">
                <Link to={`/o/hall-of-fame/${candidate.id}`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center space-x-4">
                      <Avatar className="h-20 w-20 border-4 border-primary shadow-lg">
                        <AvatarImage
                          src={candidate.employee.avatar?.file?.url}
                          alt={candidate.employee.firstName}
                        />
                        <AvatarFallback>
                          {(
                            candidate.employee.firstName +
                            " " +
                            candidate.employee.lastName
                          )
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-2xl font-bold text-primary-800">
                          {candidate.employee.firstName}{" "}
                          {candidate.employee.lastName}{" "}
                        </p>
                        <p className="text-sm text-primary-600">
                          {candidate.employee.currentPosition?.title}{" "}
                        </p>
                      </div>
                    </CardTitle>
                  </CardHeader>
                </Link>
                <CardContent className="pt-4">
                  <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
                    <Badge
                      variant="outline"
                      className="text-sm bg-blue-50 text-primary-700 border-blue-300"
                    >
                      Nominé le{" "}
                      {formatDateToFrenchWithTime(candidate.nominationDate)}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="text-sm bg-yellow-100 text-yellow-800"
                    >
                      <Star className="h-4 w-4 mr-1" /> {candidate.votes.length}{" "}
                      votes
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      {
                        value: -1,
                        label: "Je refuse",
                        icon: ThumbsDown,
                        color: "red",
                      },
                      { value: 0, label: "Neutre", icon: Minus, color: "yellow" },
                      {
                        value: 1,
                        label: "J'accepte",
                        icon: ThumbsUp,
                        color: "green",
                      },
                    ].map((option) => (
                      <Button
                        key={option.value}
                        variant={
                          localUserVotes[candidate.id] === option.value
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() => handleVote(candidate.id, option.value)}
                        disabled={localUserVotes[candidate.id] !== undefined}
                        className={`w-full transition-all duration-300 ${
                          localUserVotes[candidate.id] === option.value
                            ? `bg-${option.color}-500 text-white hover:bg-${option.color}-600`
                            : `hover:bg-${option.color}-100`
                        }`}
                      >
                        <option.icon className="mr-1 h-4 w-4" />
                        <span className="hidden sm:inline">{option.label}</span>
                        <span className="ml-1">
                          ({getVoteCount(candidate.votes, option.value)})
                        </span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

