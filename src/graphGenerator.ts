import randomColor from "randomcolor";
import Phaser from "phaser";
import { LinkObject, NodeObject } from "force-graph";

export type NodeType = NodeObject & {
  group: "ROOT" | "PUZZLE" | "CLUE" | "LOCK" | "KEY" | "ROOM";
  description?: string;
  depth?: number;
};

export const GROUP_NODE_SIZES: { [key in NodeType["group"]]: number } = {
  ROOT: 20,
  PUZZLE: 8,
  CLUE: 4,
  LOCK: 4,
  KEY: 4,
  ROOM: 10,
};

// pretty pastel colors
export const GROUP_COLORS = {
  ROOT: randomColor(),
  PUZZLE: randomColor(),
  CLUE: randomColor(),
  LOCK: randomColor(),
  KEY: randomColor(),
  ROOM: randomColor(),
};

console.log(GROUP_COLORS);

export type LinkType = LinkObject & {
  group?: "CONTAINS" | "SOLVES" | "UNLOCKS" | "LEADS_TO";
  __controlPoints?: number[];
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
  "Windy Wasteland",
  "Stormy Sea",
  "Muddy Mountain",
  "Leafy Lake",
];

const PUZZLES = [
  "Color Blocks",
  "Music Blocks",
  "Symbol Blocks",
  "Number Blocks",
  "Word Blocks",
  "Shape Blocks",
  "Picture Blocks",
];

const PUZZLE_CLUES = {
  "Color Blocks": ["Color Clue 1", "Color Clue 2", "Color Clue 3"],
  "Music Blocks": ["Music Clue 1", "Music Clue 2", "Music Clue 3"],
  "Symbol Blocks": ["Symbol Clue 1", "Symbol Clue 2", "Symbol Clue 3"],
  "Number Blocks": ["Number Clue 1", "Number Clue 2", "Number Clue 3"],
  "Word Blocks": ["Word Clue 1", "Word Clue 2", "Word Clue 3"],
  "Shape Blocks": ["Shape Clue 1", "Shape Clue 2", "Shape Clue 3"],
  "Picture Blocks": ["Picture Clue 1", "Picture Clue 2", "Picture Clue 3"],
} as { [key in (typeof PUZZLES)[number]]: string[] };

const LOCKS = ["Funny Troll", "Silly Bridge", "Big Boulder"];

const KEYS = ["Troll Key", "Bridge Key", "Boulder Key"];

const graphGenerator = (prefix: string) => {
  let nodes: NodeType[] = [];
  let links: LinkType[] = [];
  nodes.push({
    id: `${prefix}ROOT`,
    group: "ROOT",
  });
  // Add 5 random rooms, non-duplicate
  let roomNames = [...ROOMS];
  // shuffle rooms
  for (let i = roomNames.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [roomNames[i], roomNames[j]] = [roomNames[j], roomNames[i]];
  }
  // roomNames = roomNames.slice(0, 3);

  const puzzles = [];

  for (let i = 0; i < roomNames.length; i++) {
    const roomName = roomNames[i];
    nodes.push({
      id: `${prefix}${roomName}`,
      group: "ROOM",
    });

    links.push({
      source: `${prefix}ROOT`,
      target: `${prefix}${roomName}`,
      group: "LEADS_TO",
    });

    // Add 1 puzzle per room
    if (i < PUZZLES.length - 1) {
      const puzzleName = PUZZLES[i];
      puzzles.push(puzzleName);
      nodes.push({
        id: `${prefix}${puzzleName}`,
        group: "PUZZLE",
      });

      links.push({
        source: `${prefix}${roomName}`,
        target: `${prefix}${puzzleName}`,
        group: "CONTAINS",
      });
    }
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
        id: `${prefix}${clue}`,
        group: "CLUE",
      });

      links.push({
        source: `${prefix}${roomName}`,
        target: `${prefix}${clue}`,
        group: "CONTAINS",
      });

      links.push({
        source: `${prefix}${clue}`,
        target: `${prefix}${puzzleName}`,
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
      id: `${prefix}${lockName}`,
      group: "LOCK",
    });
    const room1 = rooms[index];
    index = (index + 1) % rooms.length;
    const room2 = rooms[index];
    index = (index + 1) % rooms.length;

    links.push({
      source: `${prefix}${room1}`,
      target: `${prefix}${lockName}`,
      group: "LEADS_TO",
    });

    links.push({
      source: `${prefix}${lockName}`,
      target: `${prefix}${room2}`,
      group: "UNLOCKS",
    });
  }

  // for (const node of nodes) {
  //   const connectedLinks = links.filter(
  //     (link) => link.source === node.id || link.target === node.id
  //   );

  //   let maxNodes = 1;
  //   for (const otherNode of nodes) {
  //     if (
  //       otherNode.group === "ROOM" &&
  //       !connectedLinks.some(
  //         (link) => link.source === otherNode.id || link.target === otherNode.id
  //       ) &&
  //       maxNodes > 0
  //     ) {
  //       maxNodes -= 1;
  //       // links.push({
  //       //   source: node.id,
  //       //   target: otherNode.id,
  //       //   group: "LEADS_TO",
  //       // });
  //     }
  //   }
  // }

  // find any orphan rooms and connect them to another room

  // const orphanRooms = nodes.filter(
  //   (node) =>
  //     node.group === "ROOM" &&
  //     !links.some((link) => link.source === node.id || link.target === node.id)
  // );

  // for (const orphanRoom of orphanRooms) {
  //   const otherRooms = nodes.filter(
  //     (node) =>
  //       node.group === "ROOM" &&
  //       !links.some(
  //         (link) => link.source === node.id || link.target === node.id
  //       ) &&
  //       node.id !== orphanRoom.id
  //   );

  //   if (otherRooms.length > 0) {
  //     const otherRoom = otherRooms[0];
  //     links.push({
  //       source: orphanRoom.id,
  //       target: otherRoom.id,
  //       group: "LEADS_TO",
  //     });
  //   }
  // }

  // perform a BFS to find the depth of each node
  const queue = ["ROOT"];
  const visited = new Set<string>();
  const depthMap: { [key: string]: number } = {
    [queue[0]]: 0,
  };
  while (queue.length > 0) {
    const node = queue.shift()!;
    visited.add(node);
    const depth = depthMap[node];
    const connectedNodes = links
      .filter((link) => link.source === node || link.target === node)
      .map((link) => (link.source === node ? link.target : link.source));

    for (const connectedNode of connectedNodes) {
      if (!visited.has(connectedNode as string)) {
        queue.push(connectedNode as string);
        depthMap[connectedNode as string] = depth + 1;
      }
    }
  }

  for (const node of nodes) {
    node.depth = depthMap[node.id!];
  }

  // we want only a single link between each depth level
  // so we need to remove any links that are not the shortest path
  // between two nodes of the same depth

  const maxDepth = Math.max(...nodes.map((node) => node.depth!));
  console.log(maxDepth);
  for (let i = 1; i < maxDepth - 2; i++) {
    let linksAtDepth = links.filter((link) => {
      const source = nodes.find((node) => node.id === link.source);
      const target = nodes.find((node) => node.id === link.target);

      // return true if target is one level deeper than source but only if removing this link
      // would not disconnect the graph
      return (
        source!.depth === i &&
        target!.depth === i + 1 &&
        links.filter(
          (otherLink) =>
            (otherLink.source === link.source &&
              otherLink.target === link.target) ||
            (otherLink.source === link.target &&
              otherLink.target === link.source)
        ).length > 0
      );
    });

    // remove a random link from the list
    const linkIndex = Math.floor(Math.random() * linksAtDepth.length);
    linksAtDepth = linksAtDepth.filter((_, index) => index !== linkIndex);

    links = links.filter((link) => !linksAtDepth.includes(link));
    // if (linksAtDepth.length > 1) {
    //   const linksToRemove = linksAtDepth.slice(1);
    //   for (const link of linksToRemove) {
    //     links.splice(
    //       links.findIndex(
    //         (otherLink) =>
    //           (otherLink.source === link.source &&
    //             otherLink.target === link.target) ||
    //           (otherLink.source === link.target &&
    //             otherLink.target === link.source)
    //       ),
    //       1
    //     );
    //   }
    // }
  }

  console.log(nodes, links);

  return { nodes, links };
};

export default graphGenerator;
