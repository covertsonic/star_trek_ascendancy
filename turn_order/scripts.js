let factionsConfig = [];

fetch('factionConfig.json')
  .then(response => response.json())
  .then(data => {
    factionsConfig = data;
    // Filter out the factions where fan-made is true for initial display
    const officialFactions = factionsConfig.filter(faction => !faction["fan-made"]);
    // Call the function to generate the HTML here
    const factionsHTML = generateFactionsHTML(officialFactions);
    document.getElementById('faction-selection-grid').innerHTML = factionsHTML;
    // Now, you should also reinitialize the factions variable and its event listeners
    initializeFactionEventListeners();
  })
  .catch(error => console.error('Error loading factionsConfig:', error));


function generateFactionsHTML(factions) {
  let html = `
      <div class="row factions-grid">
        <div class="instructions-container col-12">
          <p class="instructions">Select faction opponents then click begin.</p>
        </div>
  `;

  factions.forEach(faction => {
    html += `
      <div class="col-md-4 mb-4">
        <div class="faction card" data-faction="${faction.name}">
          <img src="images/${faction.image}" alt="${faction.name}" class="card-img-top" />
          <div class="overlay card-img-overlay"></div>
          <div class="selected-banner d-none">
            <i class="fa fa-check-circle text-success"></i> &nbsp;Selected
          </div>
        </div>
      </div>
    `;
  });

  html += `</div>`;
  return html;
}

// Insert the generated HTML into the faction-selection-grid div
const officialFactions = factionsConfig.filter(faction => !faction["fan-made"]);
document.getElementById('faction-selection-grid').innerHTML = generateFactionsHTML(officialFactions);


document.getElementById('fanMadeToggle').addEventListener('change', function() {
  if (this.checked) {
    // Show all factions
    displayFactions(factionsConfig);
  } else {
    // Show only non-fan-made factions
    const officialFactions = factionsConfig.filter(faction => !faction["fan-made"]);
    displayFactions(officialFactions);
  }
});

function displayFactions(factions) {
  document.getElementById('faction-selection-grid').innerHTML = generateFactionsHTML(factions);
  
  // Reset player count to 0
  document.querySelector(".player-count").textContent = '0';
  
  // Remove the glowing effect from the beginButton
  beginButton.classList.remove("glowing");
  
  // Reinitialize the event listeners for the factions after updating the displayed factions
  initializeFactionEventListeners();
}






//delete this section after debugging the turn order
window.addEventListener("load", function () {
  //document.querySelector('[data-faction="Federation"]').click();
  /*  document.querySelector('[data-faction="Romulan"]').click();
  document.querySelector('[data-faction="Klingon"]').click(); // Note: It should be Klingon if you've changed it
  setTimeout(function () {
    document.querySelector(".begin").click();
  }, 1000);
  */
});

let factions = document.querySelectorAll(".faction");
let playerCount = document.querySelector(".player-count");

let beginButton = document.querySelector(".btn.begin");
let turnOrderSection = document.querySelector(".turn-order-section");
//let turnOrderGrid = document.querySelector(".turn-order-grid");
let randomizeButton = document.querySelector(".btn.randomize-turn-order");
let returnButton = document.querySelector(".btn.return-to-selection");
let toggleShowAllTurnsButton = document.querySelector(".btn.show-all-turns");
localStorage.setItem("showOldTurns", false); //default to hiding excess turns
let selectedFactions = [];

//

// Event listener for the begin button
beginButton.addEventListener("click", () => {
  // Hide faction selection and show turn order section
  document.querySelector(".row.factions-grid").style.display = "none";
  turnOrderSection.classList.remove("hidden");
  

  // Hide the begin button
  $(beginButton).hide();

  // Hide the floating player count
  $(".floating-player-count").hide();

  // Display the turn order section
  $(".turn-order-section").show();

  // Initialize the turn order by calling the function that handles it
  initializeTurnOrder();
});

function initializeTurnOrder() {
  // Populate the selectedFactions array here
  const selectedFactionElements = document.querySelectorAll(".faction.active");
  selectedFactions = Array.from(selectedFactionElements).map((element) =>
    element.getAttribute("data-faction")
  );

  const tableBody = document
    .getElementById("turn-order-table")
    .querySelector("tbody");

  // Clear any existing rows
  tableBody.innerHTML = "";

  selectedFactions.forEach((factionName) => {
    // Find the faction config for the selected faction
    const faction = factionsConfig.find(f => f.name === factionName);

    if (faction) {
      const row = document.createElement("tr");

      // Faction cell
      const factionCell = document.createElement("td");
      factionCell.className = "faction-name-column";
      const img = document.createElement("img");
      img.src = `images/${faction.image}`;
      img.alt = faction.name; // This will only show if the image is broken
      factionCell.appendChild(img);

      // Add faction name
      const nameSpan = document.createElement("span");
      nameSpan.textContent = faction.name;
      factionCell.appendChild(nameSpan);

      row.appendChild(factionCell);

      tableBody.appendChild(row);
    }
  });
}




// Event listener for the randomize turn order button
randomizeButton.addEventListener("click", () => {
  randomizeNextTurnOrder();
});

function randomizeNextTurnOrder() {
  const table = document.getElementById("turn-order-table");
  const headerRow = table.querySelector("thead tr");
  const tableBody = table.querySelector("tbody");

  // Hide the "current" indicator from all previous columns
  const allCurrentIndicators = document.querySelectorAll(".current-indicator");
  allCurrentIndicators.forEach(indicator => indicator.classList.add("hidden"));

  // Add new turn header
  const turnNumber = headerRow.cells.length; // Existing columns represent turns
  const turnHeader = document.createElement("th");

  // Add the "current" indicator
  const currentIndicator = document.createElement("div");
  currentIndicator.className = "current-indicator";
  currentIndicator.textContent = "Current";
  turnHeader.appendChild(currentIndicator);

  const timestampSpan = document.createElement("span");
  timestampSpan.className = "time-stamp";
  timestampSpan.textContent = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
  });

  turnHeader.innerHTML += `T-${turnNumber} <br />`;
  turnHeader.appendChild(timestampSpan);

  headerRow.appendChild(turnHeader);

  // Shuffle the factions for the next turn
  const factions = Array.from(tableBody.rows);
//  const shuffledFactions = [...factions].sort(() => Math.random() - 0.5); //This method is known to be biased and not truly random
const shuffledFactions = shuffleArray([...factions]);  //A better approach would be to use the Fisher-Yates Shuffle algorithm.


  shuffledFactions.forEach((row, index) => {
    const turnCell = document.createElement("td");
    turnCell.textContent = index + 1; // Turn order
    row.appendChild(turnCell);
  });
  if (localStorage.getItem("showOldTurns") !== "true") {
    limitVisibleTurns();
  }
  reorderFactionsByCurrentRound();
  showShowAllButton(headerRow);
    
}

function showShowAllButton(headerRow){
      // Check if there are at least 4 turns
      if (headerRow.cells.length >= 5) { // +1 because of the Faction column
        document.querySelector(".show-all-turns").classList.remove("invisible");
    }
}

// Call this function and pass the turn column div when you create a new turn.

let confirmReset = false;

returnButton.addEventListener("click", () => {
  if (confirmReset) {
    // Reset the turn-order-table
    document.querySelector("#turn-order-table tbody").innerHTML = "";
    resetTableHeader();

    beginButton.style.display = "block";
    // Hide the turn-order-section
    document.querySelector(".turn-order-section").classList.add("hidden");


    // Hide the button-group
    //document.querySelector(".button-group-for-turn-order").style.display = "none";

    // Show the row factions-grid
    document.querySelector(".row.factions-grid").style.display = "flex";

    $(".floating-player-count").show();

    // Reset button state
    returnButton.textContent = "Start Over";
    returnButton.classList.remove("btn-danger");
    returnButton.classList.add("btn-light");
    confirmReset = false;
  } else {
    // Ask for confirmation
    returnButton.textContent = "Confirm";
    returnButton.classList.remove("btn-light");
    returnButton.classList.add("btn-danger");
    confirmReset = true;

    // Set a timeout to revert the changes after 5 seconds
    setTimeout(() => {
      if (confirmReset) {
        // If still waiting for confirmation
        returnButton.textContent = "Start Over";
        returnButton.classList.remove("btn-danger");
        returnButton.classList.add("btn-light");
        confirmReset = false;
      }
    }, 5000); // 5 seconds
  }
});

function resetTableHeader() {
  const table = document.getElementById("turn-order-table");
  const thead = table.querySelector("thead");

  // Clear the existing header content
  thead.innerHTML = "";

  // Create the new header row and cells
  const headerRow = document.createElement("tr");
  const headerCell = document.createElement("th");
  headerCell.innerHTML = "&nbsp;<br />Faction";
  headerCell.className = "faction-name-column";

  // Append the cell to the row and the row to the thead
  headerRow.appendChild(headerCell);
  thead.appendChild(headerRow);
}

function limitVisibleTurns() {
  const table = document.getElementById("turn-order-table");
  const headerRow = table.querySelector("thead tr");
  let turnLimitStartsAt = 0;

  // Count the number of turns (excluding the Faction column)
  const totalTurns = headerRow.cells.length - 1;

  var windowWidth =
    window.innerWidth ||
    document.documentElement.clientWidth ||
    document.body.clientWidth;
  if (windowWidth <= 768) {
    turnLimitStartsAt = 0;
  } else {
    turnLimitStartsAt = 2;
  }

  // If there are more than one turns, hide the excess columns
  if (totalTurns > turnLimitStartsAt) {
    // Determine the index to start hiding columns
    const startIndex = totalTurns - turnLimitStartsAt;

    // Iterate through the header and body rows and hide the excess columns
    for (let i = 1; i < startIndex; i++) {
      // Hide header cell
      headerRow.cells[i].style.display = "none";

      // Hide corresponding body cells
      Array.from(table.querySelectorAll("tbody tr")).forEach((row) => {
        row.cells[i].style.display = "none";
      });
    }
  }
}

function unlimitVisibleTurns() {
  const table = document.getElementById("turn-order-table");
  const headerRow = table.querySelector("thead tr");

  // Iterate through all the cells and reset the display property
  for (let i = 0; i < headerRow.cells.length; i++) {
    // Reset header cell
    headerRow.cells[i].style.display = "";

    // Reset corresponding body cells
    Array.from(table.querySelectorAll("tbody tr")).forEach((row) => {
      row.cells[i].style.display = "";
    });
  }
}

toggleShowAllTurnsButton.addEventListener("click", () => {
  toggleTurns();
});

// Function to toggle old turn visibility
function toggleTurns() {
  // Check if the old turns are currently shown or not set
  var showOldTurns = localStorage.getItem("showOldTurns");

  if (showOldTurns === "true") {//if it was true then make it false and then limit the view
    localStorage.setItem("showOldTurns", "false");
    limitVisibleTurns();
  } else {
    localStorage.setItem("showOldTurns", "true");
    unlimitVisibleTurns();
  }

  // Update the button's text based on the new value in localStorage
  showOldTurns = localStorage.getItem("showOldTurns");
  toggleShowAllTurnsButton.innerText = (showOldTurns === "true") ? "Hide Old" : "Show All";

}




function reorderFactionsByCurrentRound() {
  const tableBody = document
    .getElementById("turn-order-table")
    .querySelector("tbody");
  const rows = Array.from(tableBody.rows);

  // Sort rows based on the value of the last cell in each row (ascending order)
  const sortedRows = rows.sort((a, b) => {
    const valueA = parseInt(a.cells[a.cells.length - 1].textContent, 10);
    const valueB = parseInt(b.cells[b.cells.length - 1].textContent, 10);
    return valueA - valueB; // Sort in ascending order
  });

  // Replace existing rows with sorted rows
  tableBody.innerHTML = "";
  sortedRows.forEach((row) => tableBody.appendChild(row));
}


function shuffleArray(array) {
  let currentIndex = array.length, randomIndex;

  // While there remain elements to shuffle...
  while (currentIndex !== 0) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}

function initializeFactionEventListeners() {
  let factions = document.querySelectorAll(".faction");
  let playerCount = document.querySelector(".player-count");

  // Selecting factions
  factions.forEach((faction) => {
    faction.addEventListener("click", () => {
      // Toggle the active state for the faction.
      faction.classList.toggle("active");

      // Find the 'overlay' and 'selected-banner' elements inside the faction.
      let overlay = faction.querySelector(".overlay");
      let selectedBanner = faction.querySelector(".selected-banner");

      // Toggle the visibility of the overlay and selected banner.
      overlay.classList.toggle("d-none");
      selectedBanner.classList.toggle("d-none");

      // Update the player count.
      let activeFactions = document.querySelectorAll(".faction.active").length;
      playerCount.textContent = `${activeFactions}`;

      // Check if at least two factions are selected
      if (activeFactions >= 2) {
        beginButton.classList.add("glowing");
      } else {
        beginButton.classList.remove("glowing");
      }
    });
  });
}



