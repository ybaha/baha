import { Client } from "@notionhq/client";
import {
  BlockObjectResponse,
  PartialBlockObjectResponse,
  TableBlockObjectResponse,
  TableRowBlockObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

async function getTableRows(blockId: string) {
  let results: TableRowBlockObjectResponse[] = [];
  let cursor;

  do {
    const response = await notion.blocks.children.list({
      block_id: blockId,
      start_cursor: cursor,
    });

    results = results.concat(response.results as TableRowBlockObjectResponse[]);
    cursor = response.next_cursor;
  } while (cursor);

  return results;
}

// Function to retrieve and print the table rows
async function retrieveTableRows() {
  const tableBlockId = "da2a01ce86354fa6bc25f2c8b9c15989";

  // Retrieve the rows of the table
  const tableRows = await getTableRows(tableBlockId);

  const tableHeader = tableRows[0].table_row.cells.map(
    (cell) => cell?.[0]?.plain_text
  );

  tableRows.forEach((row, idx) => {
    if (idx === 0) return;
    console.log(row.table_row.cells.map((cell) => cell?.[0]?.plain_text));
  });
}

retrieveTableRows().catch(console.error);
