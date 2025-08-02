// categories is the main data structure for the app; it looks like this:

//  [
//    { title: "Math",
//      clues: [
//        {question: "2+2", answer: 4, showing: null},
//        {question: "1+1", answer: 2, showing: null}
//        ...
//      ],
//    },
//    { title: "Literature",
//      clues: [
//        {question: "Hamlet Author", answer: "Shakespeare", showing: null},
//        {question: "Bell Jar Author", answer: "Plath", showing: null},
//        ...
//      ],
//    },
//    ...
//  ]

const NUM_CATEGORIES = 6;
const NUM_QUESTIONS_PER_CAT = 5;
const API_BASE_URL = "https://rithm-jeopardy.herokuapp.com/api";

let categories = [];

/** Get NUM_CATEGORIES random category from API.
 *
 * Returns array of category ids
 */

async function getCategoryIds() {
  const response = await axios.get(`${API_BASE_URL}/categories?count=100`);
  if (response.status !== 200) {
      throw new Error("Failed to fetch categories");
  }
  const data = response.data;
  // Shuffle the categories and select the first NUM_CATEGORIES
  const shuffledCategories = data.sort(() => Math.random() - 0.5);
  return shuffledCategories.slice(0, NUM_CATEGORIES).map(cat => cat.id);
}

/** Return object with data about a category:
 *
 *  Returns { title: "Math", clues: clue-array }
 *
 * Where clue-array is:
 *   [
 *      {question: "Hamlet Author", answer: "Shakespeare", showing: null},
 *      {question: "Bell Jar Author", answer: "Plath", showing: null},
 *      ...
 *   ]
 */

async function getCategory(catId) {
    const response = await axios.get(`${API_BASE_URL}/category?id=${catId}`);
    if (response.status !== 200) {
        throw new Error(`Failed to fetch category with id ${catId}`);
    }
    const data = response.data;

    // Map the clues to the desired format
    const clues = data.clues.map(clue => ({
        question: clue.question,
        answer: clue.answer,
        showing: null
    }));

    // Return the category object with title and clues
    return { title: data.title, clues: clues };
}

/** Fill the HTML table#jeopardy with the categories & cells for questions.
 *
 * - The <thead> should be filled w/a <tr>, and a <td> for each category
 * - The <tbody> should be filled w/NUM_QUESTIONS_PER_CAT <tr>s,
 *   each with a question for each category in a <td>
 *   (initally, just show a "?" where the question/answer would go.)
 */

async function fillTable() {
    const $table = $("#jeopardy");
    $table.empty(); 

    // Fill the header
    const $thead = $("<thead>");
    const $headerRow = $("<tr>");
    categories.forEach(cat => {
        $headerRow.append($("<th>").text(cat.title));
    });
    $thead.append($headerRow);
    $table.append($thead);

    // Fill the body
    const $tbody = $("<tbody>");
    for (let i = 0; i < NUM_QUESTIONS_PER_CAT; i++) {
        const $row = $("<tr>");
        categories.forEach(cat => {
            const $cell = $("<td>").text("?");
            $row.append($cell);
        });
        $tbody.append($row);
    }
    $table.append($tbody);
}

/** Handle clicking on a clue: show the question or answer.
 *
 * Uses .showing property on clue to determine what to show:
 * - if currently null, show question & set .showing to "question"
 * - if currently "question", show answer & set .showing to "answer"
 * - if currently "answer", ignore click
 * */

function handleClick(evt) {

    const $cell = $(evt.target);
    const $row = $cell.closest("tr");
    const colIndex = $cell.index();
    
    // Find the category and clue based on the clicked cell
    const category = categories[colIndex];
    const clue = category.clues[$row.index()];
    
    if (clue.showing === null) {
        // Show the question
        $cell.text(clue.question);
        clue.showing = "question";
        // Style the cell to indicate it's been clicked
        $cell.addClass("question");
    } else if (clue.showing === "question") {
        // Show the answer
        $cell.text(clue.answer);
        clue.showing = "answer";
        // Style the cell to indicate it's been answered
        $cell.removeClass("question").addClass("answer");
    } else {
        // If already showing answer, do nothing
        return; 
    }     
}

/** Wipe the current Jeopardy board, show the loading spinner,
 * and update the button used to fetch data.
 */

function showLoadingView() {
    $("#jeopardy").hide();
    $("#loading").show();
}

/** Remove the loading spinner and update the button used to fetch data. */

function hideLoadingView() {
    $("#jeopardy").show();
    $("#loading").hide();
}

/** Start game:
 *
 * - get random category Ids
 * - get data for each category
 * - create HTML table
 * */

async function setupAndStart() {
    showLoadingView();
    
    try {
        const categoryIds = await getCategoryIds(); // Fetch random category IDs
        categories = await Promise.all(categoryIds.map(getCategory)); // Fetch all categories concurrently
        await fillTable();
        
        // Add click event handler for clues
        $(".question").on("click", handleClick);
        
        hideLoadingView();
    } catch (error) {
        console.error("Error setting up game:", error);
        alert("Failed to load game data. Please try again later.");
    }
}

/** On click of start / restart button, set up game. */

$("#start-button").on("click", setupAndStart);

/** On page load, add event handler for clicking clues */

$(document).on("click", "#jeopardy td", handleClick);

$(document).ready(() => {
    // Initially hide the jeopardy board and show the loading spinner
    $("#jeopardy").hide();
    $("#loading").show();
    
    // Set up the start button
    $("#start-button").on("click", setupAndStart);
});
// Ensure the jeopardy board is ready to be filled when the game starts
$(document).ready(() => {
    $("#jeopardy").empty();
    $("#jeopardy").append('<table><thead></thead><tbody></tbody></table>');
});
// Add a loading spinner element
$(document).ready(() => {
    $("body").append('<div id="loading" style="display: none;">Loading...</div>');
    $("#jeopardy").append('<table id="jeopardy-table"><thead></thead><tbody></tbody></table>');
});
// Add a button to start the game
$(document).ready(() => {
    $("body").append('<button id="start-button">Start</button>');
    $("#start-button").on("click", setupAndStart);
});
// Change the button text to "Restart" after the game starts
$(document).ready(() => {
    $("#start-button").on("click", function() {
        $(this).text("Restart");
        setupAndStart();
    });
});
