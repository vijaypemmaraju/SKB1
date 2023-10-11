import { LinkObject, NodeObject } from "force-graph";

export type NodeType = NodeObject & {
  group: "ROOT" | "PUZZLE" | "CLUE" | "LOCK" | "KEY" | "ROOM";
  description?: string;
};

export const GROUP_NODE_SIZES = {
  ROOT: 20,
  PUZZLE: 5,
  CLUE: 5,
  LOCK: 5,
  KEY: 5,
  ROOM: 20,
};

export const GROUP_COLORS = {
  ROOT: "#000000",
  PUZZLE: "#0000FF",
  CLUE: "#00FF00",
  LOCK: "#FF0000",
  KEY: "#FFFF00",
  ROOM: "#FFFFFF",
};

export type LinkType = LinkObject & {
  group: "CONTAINS" | "SOLVES" | "UNLOCKS" | "LEADS_TO";
};

type GraphData = {
  nodes: NodeType[];
  links: LinkType[];
};

const ROOMS = [
  "Grassy Grove",
  "Misty Marsh",
  "Frosty Forest",
  "Sandy Shore",
  "Dusty Desert",
  "Rocky Ruins",
  "Fiery Fields",
  "Icy Island",
];

const PUZZLES = [
  "Color Blocks",
  "Music Blocks",
  "Symbol Blocks",
  "Number Blocks",
  "Word Blocks",
];

const PUZZLE_CLUES = {
  "Color Blocks": ["Color Clue 1", "Color Clue 2", "Color Clue 3"],
  "Music Blocks": ["Music Clue 1", "Music Clue 2", "Music Clue 3"],
  "Symbol Blocks": ["Symbol Clue 1", "Symbol Clue 2", "Symbol Clue 3"],
  "Number Blocks": ["Number Clue 1", "Number Clue 2", "Number Clue 3"],
  "Word Blocks": ["Word Clue 1", "Word Clue 2", "Word Clue 3"],
} as { [key in (typeof PUZZLES)[number]]: string[] };

const LOCKS = ["Funny Troll", "Silly Bridge", "Big Boulder"];

const KEYS = ["Troll Key", "Bridge Key", "Boulder Key"];

const graphGenerator = () => {
  const nodes: NodeType[] = [];
  const links: LinkType[] = [];

  // Add 5 random rooms, non-duplicate
  let roomNames = [...ROOMS];
  // shuffle rooms
  for (let i = roomNames.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [roomNames[i], roomNames[j]] = [roomNames[j], roomNames[i]];
  }
  roomNames = roomNames.slice(0, 3);

  const puzzles = [];

  for (let i = 0; i < roomNames.length; i++) {
    const roomName = roomNames[i];
    nodes.push({
      id: roomName,
      group: "ROOM",
    });

    // Add 1 puzzle per room
    const puzzleName = PUZZLES[i];
    puzzles.push(puzzleName);
    nodes.push({
      id: puzzleName,
      group: "PUZZLE",
    });

    links.push({
      source: roomName,
      target: puzzleName,
      group: "CONTAINS",
    });
  }

  // // // add clues for each puzzle to random rooms
  for (const puzzleName of puzzles) {
    const puzzleClues = PUZZLE_CLUES[puzzleName];
    // shuffle clues
    for (let i = puzzleClues.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [puzzleClues[i], puzzleClues[j]] = [puzzleClues[j], puzzleClues[i]];
    }
    for (const clue of puzzleClues) {
      const roomName = roomNames[Math.floor(Math.random() * roomNames.length)];
      nodes.push({
        id: clue,
        group: "CLUE",
      });

      links.push({
        source: roomName,
        target: clue,
        group: "CONTAINS",
      });

      links.push({
        source: clue,
        target: puzzleName,
        group: "SOLVES",
      });
    }
  }

  const rooms = [...roomNames];
  // shuffle rooms
  for (let i = rooms.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rooms[i], rooms[j]] = [rooms[j], rooms[i]];
  }
  let index = 0;
  // add locks, and connect to two random rooms each
  for (const lockName of LOCKS) {
    nodes.push({
      id: lockName,
      group: "LOCK",
    });
    const room1 = rooms[index];
    index = (index + 1) % rooms.length;
    const room2 = rooms[index];
    index = (index + 1) % rooms.length;

    links.push({
      source: room1,
      target: lockName,
      group: "LEADS_TO",
    });

    links.push({
      source: lockName,
      target: room2,
      group: "UNLOCKS",
    });
  }

  for (const node of nodes) {
    const connectedLinks = links.filter(
      (link) => link.source === node.id || link.target === node.id
    );

    let maxNodes = 1;
    for (const otherNode of nodes) {
      if (
        otherNode.group === "ROOM" &&
        !connectedLinks.some(
          (link) => link.source === otherNode.id || link.target === otherNode.id
        ) &&
        maxNodes > 0
      ) {
        maxNodes -= 1;
        // links.push({
        //   source: node.id,
        //   target: otherNode.id,
        //   group: "LEADS_TO",
        // });
      }
    }
  }

  return { nodes, links };
};

export default graphGenerator;
