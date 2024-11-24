import {
  GameEntity,
  GameIdleEntity,
  GameOverEntity,
} from "@/entities/game/domain";
import { prisma } from "@/shared/lib/db";
import { Game, User } from "@prisma/client";
import { z } from "zod";

async function gamesList(): Promise<GameEntity[]> {
  const games = await prisma.game.findMany({
    include: {
      winner: true,
      players: true,
    },
  });

  return games.map((game) => dbGameToGameEntity(game));
}

const fieldSchema = z.array(z.union([z.string(), z.null()]));

function dbGameToGameEntity(
  game: Game & {
    players: User[];
    winner?: User | null;
  }
): GameEntity {
  if (game.status === "idle") {
    return {
      id: game.id,
      players: game.players,
      status: game.status,
    } satisfies GameIdleEntity;
  }

  if (game.status === "inProgress" || game.status === "gameOverDraw") {
    return {
      id: game.id,
      players: game.players,
      status: game.status,
      field: fieldSchema.parse(game.field ?? []),
    };
  }

  if (game.status === "gameOver") {
    if (!game.winner) {
      throw new Error("Winner should be in game over");
    }

    return {
      id: game.id,
      players: game.players,
      status: game.status,
      field: fieldSchema.parse(game.field ?? []),
      winner: game.winner,
    } satisfies GameOverEntity;
  }

  throw new Error(`Unhandled game status: ${game.status}`);
}

export const gameRepository = { gamesList };
