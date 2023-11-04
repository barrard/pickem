const cheerio = require("cheerio");
const { readFile } = require("fs/promises");

main();

async function main() {
  //get some file data
  const html = await readFile("./data/week1.html", "utf8");

  parseTable(html);
}

function parseTable(html) {
  // Load your HTML content from a file or fetch it from a URL
  const $ = cheerio.load(html);

  // Select the table rows within the tbody
  const rows = $("tbody", ".matchup");

  // Create an array to store the extracted data
  const data = [];

  // Loop through the table rows
  rows.each((index, element) => {
    const row = $(element);

    // Extract data from each row
    const key = row.find(".favorite a").text().trim();
    const value = row.find(".underdog a").text().trim();

    // Push the data to the array
    data.push({ key, value });
  });

  // Output the extracted data
  console.log(data);
}
