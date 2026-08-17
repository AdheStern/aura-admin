// src/features/room-editor/components/panels/obstacle-panel.tsx — un pilar. El tamaño se edita
// aquí (rect: ancho/profundidad; círculo: radio) porque no hay manija de redimensionar en el
// lienzo — v1 solo arrastra para mover (ver obstacle-layer.tsx).

"use client";

import { Button } from "@/components/ui/button";
import { MaterialField } from "@/features/room-editor/components/material-field";
import { NumberField } from "@/features/room-editor/components/panels/number-field";
import { useRoomStore } from "@/features/room-editor/store/room-store-provider";

const MIN_SIZE_M = 0.05;

export function ObstaclePanel({ obstacleId }: { obstacleId: string }) {
  const obstacle = useRoomStore((state) =>
    state.document.obstacles.find((o) => o.id === obstacleId),
  );
  const canManage = useRoomStore((state) => state.canManage);
  const updateObstacle = useRoomStore((state) => state.updateObstacle);
  const removeObstacle = useRoomStore((state) => state.removeObstacle);

  if (!obstacle) return null;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-heading text-sm font-medium">
        Pilar {obstacle.shape === "rect" ? "rectangular" : "circular"}
      </h2>
      <div className="flex flex-col gap-3 rounded-lg border p-3">
        <NumberField
          id="obstacle-x"
          label="X (m)"
          value={obstacle.at[0]}
          onChange={(x) =>
            updateObstacle(obstacle.id, { at: [x, obstacle.at[1]] })
          }
        />
        <NumberField
          id="obstacle-y"
          label="Y (m)"
          value={obstacle.at[1]}
          onChange={(y) =>
            updateObstacle(obstacle.id, { at: [obstacle.at[0], y] })
          }
        />
        {obstacle.shape === "rect" ? (
          <>
            <NumberField
              id="obstacle-width"
              label="Ancho (m)"
              value={obstacle.size[0]}
              min={MIN_SIZE_M}
              onChange={(width) =>
                updateObstacle(obstacle.id, { size: [width, obstacle.size[1]] })
              }
            />
            <NumberField
              id="obstacle-depth"
              label="Profundidad (m)"
              value={obstacle.size[1]}
              min={MIN_SIZE_M}
              onChange={(depth) =>
                updateObstacle(obstacle.id, { size: [obstacle.size[0], depth] })
              }
            />
          </>
        ) : (
          <NumberField
            id="obstacle-radius"
            label="Radio (m)"
            value={obstacle.size[0]}
            min={MIN_SIZE_M}
            onChange={(radius) =>
              updateObstacle(obstacle.id, { size: [radius] })
            }
          />
        )}
        <MaterialField
          value={obstacle.materialId}
          onChange={(materialId) => updateObstacle(obstacle.id, { materialId })}
        />
      </div>
      {canManage ? (
        <Button
          variant="destructive"
          size="sm"
          onClick={() => removeObstacle(obstacle.id)}
        >
          Quitar pilar
        </Button>
      ) : null}
    </div>
  );
}
