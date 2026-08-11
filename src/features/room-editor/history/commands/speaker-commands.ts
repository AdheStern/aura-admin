// src/features/room-editor/history/commands/speaker-commands.ts — dónde está y hacia dónde apunta
// cada caja. A diferencia del resto de familias no hay alta ni baja de la ENTIDAD: el parlante lo
// crea el grafo de señal, y lo que este par de comandos da y quita es su colocación en el recinto.
//
// El orden dentro de `speakers` no lo lee nadie (se busca por nodeId, y el compilador emite las
// fuentes en el orden del grafo), así que a diferencia de los pilares el inverso de una baja no
// necesita restaurar la posición en la lista — solo la colocación.

import type { RoomCommandHandler } from "@/features/room-editor/history/command-result";

export const applySetSpeakerPlacement: RoomCommandHandler<
  "setSpeakerPlacement"
> = (document, command) => {
  const { nodeId } = command.speaker;
  const previous = document.speakers.find(
    (speaker) => speaker.nodeId === nodeId,
  );

  return {
    next: {
      ...document,
      speakers: previous
        ? document.speakers.map((speaker) =>
            speaker.nodeId === nodeId ? command.speaker : speaker,
          )
        : [...document.speakers, command.speaker],
    },
    // Sin colocación previa el inverso es quitarla, no "colocarla en otro sitio": deshacer el
    // primer arrastre tiene que devolver la caja a su posición por defecto, que no está guardada.
    inverse: previous
      ? { kind: "setSpeakerPlacement", speaker: previous }
      : { kind: "removeSpeakerPlacement", nodeId },
  };
};

export const applyRemoveSpeakerPlacement: RoomCommandHandler<
  "removeSpeakerPlacement"
> = (document, command) => {
  const previous = document.speakers.find(
    (speaker) => speaker.nodeId === command.nodeId,
  );
  if (!previous) return null;

  return {
    next: {
      ...document,
      speakers: document.speakers.filter(
        (speaker) => speaker.nodeId !== command.nodeId,
      ),
    },
    inverse: { kind: "setSpeakerPlacement", speaker: previous },
  };
};
