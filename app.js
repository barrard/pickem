const cheerio = require("cheerio");
const { readFile } = require("fs/promises");

class Node {
  constructor(name) {
    this.name = name;
    this.outgoingEdges = [];
    this.incomingEdges = [];
  }

  addOutgoingEdge(neighbor, inequality) {
    this.outgoingEdges.push({ neighbor, inequality });
    neighbor.incomingEdges.push({ neighbor: this, inequality });
  }
}

class Edge {
  constructor(from, to, inequality) {
    this.from = from;
    this.to = to;
    this.inequality = inequality; // Corrected property name
  }
}

class InequalityGraph {
  constructor() {
    this.nodes = new Map();
  }

  addSet(setData) {
    for (const { team1, relationship, team2 } of setData) {
      // Use the correct property names
      if (!this.nodes.has(team1)) {
        this.nodes.set(team1, new Node(team1));
      }
      if (!this.nodes.has(team2)) {
        this.nodes.set(team2, new Node(team2));
      }
      const node1 = this.nodes.get(team1);
      const node2 = this.nodes.get(team2);
      const edge = new Edge(node1, node2, relationship); // Use the correct property name
      node1.addOutgoingEdge(node2, relationship);
    }
  }

  findRelationship(teamA, teamB) {
    if (!this.nodes.has(teamA) || !this.nodes.has(teamB)) {
      return "Unknown";
    }

    const startNode = this.nodes.get(teamA);
    const targetNode = this.nodes.get(teamB);

    const visited = new Set();
    let result = "Unknown";

    function dfs(node) {
      if (node === targetNode) {
        result = "Equal";
        return;
      }

      visited.add(node);

      for (const { neighbor, inequality } of node.outgoingEdges) {
        if (!visited.has(neighbor)) {
          if (inequality === ">" && result !== "Less") {
            result = "Greater";
            dfs(neighbor);
          } else if (inequality === "<" && result !== "Greater") {
            result = "Less";
            dfs(neighbor);
          }
        }
      }
    }

    dfs(startNode);

    return result;
  }
}

main();

async function main() {
  const weeks = [1, 2, 3, 4, 5, 6, 7];

  const graph = new InequalityGraph();

  for (let week = 0; week < weeks.length; week++) {
    const html = await readFile(`./data/week${week + 1}.html`, "utf8");

    const teamsScores = parseTable(html);
    // console.log(teamsScores);

    graph.addSet(teamsScores);
  }

  const relationship1 = graph.findRelationship("Sea", "Bal");
  console.log(relationship1);
  const relationship2 = graph.findRelationship("Bal", "Sea");
  console.log(relationship2);
  // const relationship3 = graph.findRelationship("Cin", "Buf");
  // console.log(relationship3);
}

function parseTable(html) {
  // Load your HTML content from a file or fetch it from a URL
  const $ = cheerio.load(html);

  const text = $.text();
  // console.log(text);
  const splitText = text.split(" ").map((t) => t.trim());
  const filterText = splitText.filter((t) => {
    if (t) return true;
  });

  const matchupIndexes = [];
  filterText.forEach((t, i) => {
    if (t === "matchup") matchupIndexes.push(i);
  });

  let prevMatchI;
  let matchupData = [];
  matchupIndexes.forEach((matchI, i) => {
    if (prevMatchI == undefined) prevMatchI = matchI;
    if (i === 0) return;

    const matchupText = filterText.slice(prevMatchI, matchI - 1);
    let cleanMatchupText = matchupText.filter((t) => {
      if (t === "matchup" || t === "information") return;
      return true;
    });
    cleanMatchupText = cleanMatchupText.map((t) => {
      if (t.includes("Incorrect")) t = t.replace("Incorrect", "");
      if (t.includes("Correct")) t = t.replace("Correct", "");
      return t;
    });
    matchupData.push(cleanMatchupText.join(" "));
    prevMatchI = matchI;
  });

  // console.log(matchupData);

  const cleatData = [];

  matchupData.forEach((data) => {
    let [team1stuff, team2stuff] = data.split(", ");
    let [team1, team1score] = team1stuff.split(" ").slice(-2);
    let [team2, team2score] = team2stuff.split(" ");
    let relationship = team1score > team2score ? ">" : "<";
    cleatData.push({ team1, relationship, team2 });
  });
  return cleatData;
}
