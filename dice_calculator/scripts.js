updateDiceSection(); //load the dice graphics at the top


function incrementValue(elementId, incrementBy, max, min) {
  const element = document.getElementById(elementId);
  let currentValue = parseInt(element.innerText, 10);
  currentValue += incrementBy;

  if (currentValue > max) currentValue = max;
  if (currentValue < min) currentValue = min;

  element.innerText = currentValue;
  
  updateStats();//update the win probabilities after the number of ships changes
}

function rollDie() {
  return Math.floor(Math.random() * 6) + 1; // Return a random number between 1 and 6
}

function getHits(ships, weaponLevel, opponentShieldLevel) {
  let hits = 0;
  let rolls = [];

  for (let i = 0; i < ships; i++) {
    let roll = rollDie();
    rolls.push(roll);
    if (roll >= 6 - weaponLevel + opponentShieldLevel) {
      hits++;
    }
  }

  return { hits: hits, rolls: rolls };
}

function hideAllRerollButtons(){
    // Check for reroll buttons and hide them if they are still visible
  const rerollButtons = document.querySelectorAll('.reroll-button');
  let anyButtonVisible = false;

  rerollButtons.forEach(button => {
    if (window.getComputedStyle(button).display !== 'none') {
      anyButtonVisible = true;
      button.style.display = 'none'; // Hide individual reroll button
    }
  });

  // If any reroll button was visible, hide the entire reroll queue section
  if (anyButtonVisible) {
    const rerollQueueSections = document.querySelectorAll('.reroll-queue');
    rerollQueueSections.forEach(section => {
      section.style.display = 'none'; // Hide reroll queue section
    });
  }
}

let roundCounter = 0;

function simulateDiceRolls() {
  //check if any reroll buttons are still visible and close them
  hideAllRerollButtons();
    // Increment round counter
    roundCounter++;

  let attackerHits = 0;
  let defenderHits = 0;
  let attackerLosses = 0;
  let defenderLosses = 0;

  let attackerShips = parseInt(
    document.getElementById("attackerShips").innerText,
    10
  );
  const attackerWeapons = parseInt(
    document.getElementById("attackerWeapons").innerText,
    10
  );
  const defenderWeapons = parseInt(
    document.getElementById("defenderWeapons").innerText,
    10
  );

  let defenderShips = parseInt(
    document.getElementById("defenderShips").innerText,
    10
  );
  const attackerShields = parseInt(
    document.getElementById("attackerShields").innerText,
    10
  );
  const defenderShields = parseInt(
    document.getElementById("defenderShields").innerText,
    10
  );

  const isStarbaseActive = !document.getElementById("starbaseButton").classList.contains("frosted");


  let attackerResults = getHits(
    attackerShips,
    attackerWeapons,
    defenderShields
  );
  let defenderResults = getHits(
    defenderShips + isStarbaseActive,
    defenderWeapons,
    attackerShields
  );

  // Calculate uncapped ship counts
const uncappedAttackerShips = attackerShips - defenderResults.hits;
const uncappedDefenderShips = defenderShips - attackerResults.hits;

// Add hidden fields to store uncapped ship counts
const hiddenAttackerField = `<input type="hidden" id="uncappedAttackerShips${roundCounter}" value="${uncappedAttackerShips}">`;
const hiddenDefenderField = `<input type="hidden" id="uncappedDefenderShips${roundCounter}" value="${uncappedDefenderShips}">`;


  attackerShips = Math.max(0, uncappedAttackerShips); // Reducing attacker's ships based on defender's hits
  defenderShips = Math.max(0, uncappedDefenderShips); // Reducing defender's ships based on attacker's hits

  //LOGIC FOR DISPLAYING RESULTS
  let attackerDiceHTML = displayDiceRolls(
    attackerResults.rolls,
    attackerWeapons,
    defenderShields,
    "attacker"
  );
  let defenderDiceHTML = displayDiceRolls(
    defenderResults.rolls,
    defenderWeapons,
    attackerShields,
    "defender"
  );

  // Update the text to indicate uncapped losses
const attackerShipsText = uncappedAttackerShips < 0 ? `${uncappedAttackerShips} (0)` : attackerShips;
const defenderShipsText = uncappedDefenderShips < 0 ? `${uncappedDefenderShips} (0)` : defenderShips;

const starbaseText = isStarbaseActive ? " (+base)" : "";

  // Construct a single row for the round:
  let roundResultHTML = `
  <div class="row mt-4 round-result" data-round="${roundCounter}">
      ${hiddenAttackerField}
    ${hiddenDefenderField}
  <!-- Attacker Section -->
  <div class="col-sm-6">
      <div class="row">
          <div class="col-12">
              <hr>
              <strong>Round ${roundCounter} - Attacker - <span class="successful-hit">${attackerResults.hits} Hit</strong></span>
              <br/><small style="color:grey;">Attacker Ships: ${document.getElementById("attackerShips").innerText} Ships | ${defenderResults.hits} Lost |  ${attackerShipsText} Remaining
              <br/>Defender Ships: ${document.getElementById("defenderShips").innerText} Ships${starbaseText} | <b>${attackerResults.hits}</b> Lost | ${defenderShipsText} Remaining</small>
              <br/>
              ${attackerDiceHTML}
          </div>
          <div class="col-12">
              <div class="reroll-queue attacker-reroll-queue"></div>
          </div>
      </div>
  </div>

  <!-- Defender Section -->
  <div class="col-sm-6">
      <div class="row">
          <div class="col-12">
              <hr>
              <strong>Round ${roundCounter} - Defender - <span class="successful-hit">${defenderResults.hits} Hit</strong></span>
              <br/><small style="color:grey;">Defender Ships: ${document.getElementById("defenderShips").innerText} Ships${starbaseText} | ${attackerResults.hits} Lost |  ${defenderShips} Remaining
              <br/>Attacker Ships: ${document.getElementById("attackerShips").innerText} Ships | <b>${defenderResults.hits}</b> Lost | ${attackerShips} Remaining</small>
              <br/>
              ${defenderDiceHTML}
          </div>
          <div class="col-12">
              <div class="reroll-queue defender-reroll-queue"></div>
          </div>
      </div>
  </div>
</div>

`;

  // Append this row to the main results container
  const mainResultsContainer = document.getElementById("attackerResults");
  const newRoundElement = document.createElement("div");
  newRoundElement.innerHTML = roundResultHTML;
  mainResultsContainer.insertAdjacentElement("afterbegin", newRoundElement);

  // Remove click events from previous rounds
  const previousRounds = document.querySelectorAll(
    '.round-result[data-round]:not([data-round="' +
      roundCounter +
      '"]) .dice-clickable'
  );
  previousRounds.forEach((diceElement) => {
    diceElement.classList.remove("dice-clickable");
  });



  // Update ship counts for the next round:
  document.getElementById("attackerShips").innerText = attackerShips;
  document.getElementById("defenderShips").innerText = defenderShips;



  // Hide the Simulate Combat button and show the next two
  document.getElementById("simulateCombatButton").style.display = "none";
  document.getElementById("simulateNextRoundButton").style.display = "block";
  document.getElementById("resetCombatButton").style.display = "block";
  scrollToElement(roundCounter, 'attacker');

  updateStats();//update win probabilities and expected hits after a round result is complete
}

function continueToNextRound() {
  // Using the same function, as it already displays the results properly
  simulateDiceRolls();

  //Clear the rerollQueue and related UI elements
  rerollQueue = { attacker: {}, defender: {} };
}
function resetCombat() {
  // Reset the round counter
  roundCounter = 0;

  // Reset ship counts back to 3 if below 3
document.getElementById("attackerShips").innerHTML = Math.max(3, parseInt(document.getElementById("attackerShips").innerHTML, 10)).toString();
document.getElementById("defenderShips").innerHTML = Math.max(3, parseInt(document.getElementById("defenderShips").innerHTML, 10)).toString();

  // Clear the dice roll results
  document.getElementById("attackerResults").innerHTML = "";

  // Show the Simulate Combat button and hide the other two
  document.getElementById("simulateCombatButton").style.display = "block";
  document.getElementById("simulateNextRoundButton").style.display = "none";
  document.getElementById("resetCombatButton").style.display = "none";

  //Clear the rerollQueue and related UI elements
  rerollQueue = { attacker: {}, defender: {} };

  //remove startbase
  const starbaseButton = document.getElementById("starbaseButton");
  const starbaseDieCount = starbaseButton.querySelector(".starbase-die-count");
  starbaseButton.classList.add("frosted");
  starbaseDieCount.textContent = "+0 die";
}

function displayDiceRolls(rolls, weaponLevel, opponentShieldLevel, side) {
  let counts = {};
  let successfulHits = [];
  let thresholdForHit = 6 - weaponLevel + opponentShieldLevel;

  for (let i = 0; i < rolls.length; i++) {
    counts[rolls[i]] = (counts[rolls[i]] || 0) + 1;
    if (rolls[i] >= thresholdForHit) successfulHits.push(rolls[i]);
  }

  let output = "";
  let diceNames = ["one", "two", "three", "four", "five", "six"];
  for (let i = 0; i < 6; i++) {
    let diceValue = i + 1;
    let potentialHitClass = diceValue >= thresholdForHit ? "potential-hit" : "";
    let rolledClass = counts[diceValue] ? "rolled-die" : "default-die";
    let successfulHitClass = successfulHits.includes(diceValue)
      ? "successful-hit"
      : "";

    output += `<span class="fa-stack ${potentialHitClass} ${rolledClass} ${successfulHitClass} dice-clickable" 
      data-side="${side}" data-value="${diceValue}" data-round="${roundCounter}"
      onclick="handleOriginalDieClick(this, '${side}', ${diceValue}, ${roundCounter})">
<i class="fa-solid fa-dice-${diceNames[i]} fa-stack-1x"></i>
<span class="fa-stack-1x fa-inverse ${side}-dice-result-count" data-value="${diceValue}">${
      counts[diceValue] ? "x" + counts[diceValue] : ""
    }</span>
</span>`;
  }

  return output; // Returning the HTML instead of updating the DOM
}

function confirmReset() {
  var resetButton = document.getElementById("resetCombatButton");
  var isConfirmed = resetButton.getAttribute("data-confirm") === "true";

  // If the button has been clicked for the first time (confirmation)
  if (!isConfirmed) {
    resetButton.innerHTML = "Confirm Reset";
    resetButton.classList.remove("btn-secondary");
    resetButton.classList.add("btn-danger");
    resetButton.setAttribute("data-confirm", "true");
  } else {
    // Execute the resetCombat() function when the button has been clicked a second time
    resetCombat();

    // Reset the button to its initial state after the combat is reset
    resetButton.innerHTML = "Reset Combat";
    resetButton.classList.remove("btn-danger");
    resetButton.classList.add("btn-secondary");
    resetButton.setAttribute("data-confirm", "false");
  }
}

//for the dice in the header and the labels on the weapons:
function updateDiceSection() {
  // Assuming you have some method to get the weapon and shield counts for both attacker and defender
  const attackerWeapons = parseInt(
    document.getElementById("attackerWeapons").innerText
  );
  const defenderWeapons = parseInt(
    document.getElementById("defenderWeapons").innerText
  );
  const attackerShields = parseInt(
    document.getElementById("attackerShields").innerText
  );
  const defenderShields = parseInt(
    document.getElementById("defenderShields").innerText
  );

  const attackerHitNumber = 6 - attackerWeapons + defenderShields;
  const defenderHitNumber = 6 - defenderWeapons + attackerShields;

  document.getElementById("attackerDiceSection").innerHTML =
    generateDiceHTML(attackerHitNumber);
  document.getElementById("defenderDiceSection").innerHTML =
    generateDiceHTML(defenderHitNumber);

  document.getElementById("attackerWeaponsDisplay").innerHTML =
    weaponsDisplayValueFromLevel(
      +document.getElementById("attackerWeapons").innerText
    );
  document.getElementById("defenderWeaponsDisplay").innerHTML =
    weaponsDisplayValueFromLevel(
      +document.getElementById("defenderWeapons").innerText
    );

    
    updateStats();//update the win probabilities after weapons or shields stats change
}

//convert weapon level to the label that should show
function weaponsDisplayValueFromLevel(weaponLevel) {
  switch (weaponLevel) {
    case 1:
      return "5+";
    case 2:
      return "4+";
    case 3:
      return "3+";
    case 4:
      return "2+";
    case 5:
      return "1+";
    default:
      return "invalid";
  }
}

function generateDiceHTML(hitNumber) {
  let html = "";

  for (let i = 1; i <= 6; i++) {
    if (i >= hitNumber) {
      html += getDiceFaceHTML(i, "hit");
    } else {
      html += getDiceFaceHTML(i, "miss");
    }
  }

  return html;
}


//All buttons for +/- modifiers to shields and weapons should trigger an update to the to-hit die results
document.addEventListener("DOMContentLoaded", (event) => {
  // Get all the weapon and shield buttons
  const buttons = document.querySelectorAll(".weapon-shield-btn");

  // Attach event listener to each button
  buttons.forEach((button) => {
    button.addEventListener("click", updateDiceSection);
  });
});

//handle scrolling when the die results are not in view
function scrollToElement(roundCounter, side) {
  const element = document.querySelector(`.round-result[data-round="${roundCounter}"] .${side}-reroll-queue`);
  if (element) {
    const rect = element.getBoundingClientRect();
    const windowHeight = (window.innerHeight || document.documentElement.clientHeight);
    
    // Check if the element is not fully in view
    if (rect.bottom > windowHeight || rect.top < 0) {
      element.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  } else {
    console.error(`Element for round ${roundCounter} and side ${side} not found.`);
  }
}






function handleOriginalDieClick(element, side, diceValue, round) {
//  console.log("Executing the handleOriginalDieClick");

  if (round !== roundCounter && round !== roundCounter) {
    console.log("Round mismatch. Exiting...");
    return;
  }

  const rerollButton = document.querySelector(
    `.reroll-button[data-side="${side}"][data-round="${round}"]`
  );
/*  console.log(
    "Reroll button display:",
    rerollButton ? rerollButton.style.display : "Button not found"
  );*/

  if (rerollButton && rerollButton.style.display === "none") {
//    console.log("Reroll button exists but is not visible (indicating this round has already been rerolled). Exiting...");
    return;
  }

  const countElement = element.querySelector(".fa-inverse");
  const currentCount = countElement
    ? parseInt(countElement.textContent.replace("x", "") || "1", 10)
    : 1;
  const rerollCount = rerollQueue[side][diceValue] || 0;

  if (currentCount > rerollCount) {
    //console.log(`Queueing reroll for ${side} and dieValue ${diceValue}`);
    queueReroll(side, diceValue, element);
    //console.log("another successful call to URQUI.");
    //updateRerollQueueUI(side); //this is not necessary since queueReroll calls this already
  }
}

let rerollQueue = { attacker: {}, defender: {} };

//adds a result to the die
function queueReroll(side, diceValue, clickedElement) {
  // Check if the clicked die's round matches the current round
  const dieRound = parseInt(clickedElement.getAttribute("data-round"), 10);

  if (dieRound !== roundCounter ) {
    return; // Do not proceed with reroll
  }

  if (!rerollQueue[side][diceValue]) {
    rerollQueue[side][diceValue] = 0;
  }

  // If the clickedElement does not have the 'rolled-die' class, exit the function
  if (!clickedElement.classList.contains("rolled-die")) {
    return;
  }

  const countElement = clickedElement.querySelector(".fa-inverse");
  const currentCount = countElement
    ? parseInt(countElement.textContent.replace("x", "") || "1", 10)
    : 1;

  // Check if the clicked die can be added more times to the reroll queue
  if (rerollQueue[side][diceValue] < currentCount) {
    rerollQueue[side][diceValue]++;
  } else {
    rerollQueue[side][diceValue] = 0;
  }

//  console.log("queueRoll function is calling the updateRerollQueueUI.");
  updateRerollQueueUI(side);
}

// Helper function to capitalize the first letter of a string
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function getDiceFaceHTML(number, status) {
  const color = status === "hit" ? "#007bff" : "grey";
  const iconClass = `fa-dice-${numberToWord(number)}`;

  return `<span class="dice ${status}" style="color: ${color};"><i class="fas ${iconClass}"></i></span>`;
}

function numberToWord(number) {
  const words = ["one", "two", "three", "four", "five", "six"];
  return words[number - 1];
}

function updateRerollQueueUI(side) {
  //console.log("starting the creation of the button; updatererollqueueui.");
  const currentRoundElement = document.querySelector(
    `.round-result[data-round="${roundCounter}"]`
  );

  if (!currentRoundElement) {
    console.log("Current round element not found.");
    return;
  }

  const rerollQueueElement = currentRoundElement.querySelector(
    `.${side}-reroll-queue`
  );

  if (!rerollQueueElement) {
    console.log("Reroll queue element not found.");
    return;
  }

  // Clear existing reroll queue UI
  rerollQueueElement.innerHTML = "";

  // Add "Reroll Queue" label
  const label = document.createElement("small");
  label.style.color = "grey";
  label.style.marginBottom = "5px"; // Adjust this value for desired spacing
  label.style.display = "inline-block"; // Make it inline-block
  label.textContent = "Reroll Queue: ";
  rerollQueueElement.insertBefore(label, rerollQueueElement.firstChild);

  // Add "Reroll" button next to "Reroll Queue" label
  const rerollButton = document.createElement("button");
  rerollButton.className = "btn btn-sm btn-primary reroll-button";
  rerollButton.style.display = "inline-block"; // Make it inline-block
  rerollButton.style.marginLeft = "10px"; // Add some left margin for spacing
  rerollButton.textContent = "Reroll";
  // Add data-side attribute to distinguish between attacker and defender
  rerollButton.setAttribute("data-side", side);
  rerollButton.setAttribute("data-round", roundCounter); 
  rerollQueueElement.insertBefore(rerollButton, label.nextSibling);

  // Add line break
  const lineBreak = document.createElement("br");
  rerollQueueElement.insertBefore(lineBreak, rerollButton.nextSibling);

  // Loop through 1 to 6 to create new dice elements
  for (let diceValue = 1; diceValue <= 6; diceValue++) {
    const count = rerollQueue[side][diceValue] || 0;
    const diceElement = document.createElement("span");
    diceElement.className = `fa-stack dice-clickable ${
      count > 0 ? "reroll-dice" : "default-die"
    }`;
    diceElement.dataset.value = diceValue;
    diceElement.dataset.count = count;

    const diceIcon = document.createElement("i");
    const wordValue = numberToWord(diceValue);
    diceIcon.className = `fa-solid fa-dice-${wordValue} fa-stack-1x`;
    diceElement.appendChild(diceIcon);

    if (count > 0) {
      const diceCount = document.createElement("span");
      diceCount.className = "fa-stack-1x fa-inverse-reroll";
      diceCount.textContent = `x${count}`;
      diceElement.appendChild(diceCount);
    }

    rerollQueueElement.appendChild(diceElement);
  }
  scrollToElement(roundCounter, side);
}

/**
 * Event listener for click events within the reroll queue and the original dice.
 * This actually is attached to all click events.
 * - Adds dice to the reroll queue when clicked within the original dice.
 * - Removes dice from the reroll queue when clicked within the reroll queue.
 */
// Add a global click event listener
document.addEventListener("click", function (event) {
//  console.log("Click event triggered");

  // Determine if the click is within the reroll queue first
  if (event.target.closest(".reroll-queue")) {
//    console.log("Inside reroll queue");
    const dieElement = event.target.closest(".fa-stack");
    if (dieElement === null) {
//      console.log("No die element found in reroll queue.");
      return; // Exit if no die element is found
    }

    const dieValue = parseInt(dieElement.getAttribute("data-value"), 10);
    const side = dieElement
      .closest(".reroll-queue")
      .classList.contains("attacker-reroll-queue")
      ? "attacker"
      : "defender";

      const rerollButton = document.querySelector(
        `.reroll-button[data-side="${side}"][data-round="${roundCounter}"]`
      );
/*    console.log(
      "Reroll button display:",
      rerollButton ? rerollButton.style.display : "Button not found"
    );*/

    if (rerollButton && rerollButton.style.display === "none") {
      //console.log("Reroll button is not visible. Exiting...");
      return; // Do not proceed with reroll if the reroll button is not visible
    }

    if (rerollQueue[side][dieValue] > 0) {
/*      console.log(
        `Decrementing rerollQueue for ${side} and dieValue ${dieValue}`
      );*/
      rerollQueue[side][dieValue]--;
      //console.log("successfully calling URQUI.");
      updateRerollQueueUI(side);
    }
    return; // Exit the function after handling reroll queue click
  }

  // The logic for original dice is now handled by handleOriginalDieClick
  // So, no need to include it here
});

//reroll button
document.addEventListener("click", function (event) {
  if (event.target.classList.contains("reroll-button")) {
    const side = event.target
      .closest(".reroll-queue")
      .classList.contains("attacker-reroll-queue")
      ? "attacker"
      : "defender";
    handleReroll(side);
  }
});

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function handleReroll(side) {
  const currentRoundElement = document.querySelector(
    `.round-result[data-round="${roundCounter}"]`
  );

  if (!currentRoundElement) {
    console.error('Could not find the current round element.');
    return;
  }

  const rerollQueueElement = currentRoundElement.querySelector(
    `.${side}-reroll-queue`
  );

  if (!rerollQueueElement) {
    console.error(`Could not find the reroll queue for ${side}.`);
    return;
  }

  const allStrongElements = Array.from(
    currentRoundElement.querySelectorAll(`.col-sm-6 .col-12 > strong`)
  );

  const originalRollsElement = allStrongElements.find((el) =>
    el.textContent.includes(capitalizeFirstLetter(side))
  );

  if (!originalRollsElement) {
    console.error(`Could not find the original rolls element for ${side}.`);
    return;
  }

  const originalRollsParentElement = originalRollsElement.parentElement;

  if (!originalRollsParentElement) {
    console.error(`Could not find the parent element for the original rolls of ${side}.`);
    return;
  }

  let originalRolls = [];
  let unmodifiedOriginalRolls = []; // New array to keep track of unmodified original rolls

  const dieElements = Array.from(
    originalRollsParentElement.querySelectorAll(".col-12 > .rolled-die")
  );
  
  dieElements.forEach((dieElement) => {
    const dieValue = parseInt(dieElement.getAttribute("data-value"), 10);
    const countElement = dieElement.querySelector(".fa-inverse");
    const count = countElement
      ? parseInt(countElement.textContent.replace("x", "") || "1", 10)
      : 1;
    for (let i = 0; i < count; i++) {
      originalRolls.push(dieValue);
      unmodifiedOriginalRolls.push(dieValue); // Add to the unmodified array as well
    }
  });

  const rerolledDice = [];
  for (const [diceValue, count] of Object.entries(rerollQueue[side])) {
    for (let i = 0; i < count; i++) {
      const index = originalRolls.indexOf(parseInt(diceValue, 10));
      if (index > -1) {
        originalRolls.splice(index, 1);
      }
      rerolledDice.push(rollDie()); // Generate rerolled dice
    }
  }

  const finalRolls = [...originalRolls, ...rerolledDice];

  const weaponLevel = parseInt(
    document.getElementById(`${side}Weapons`).innerText,
    10
  );
  const opponentShieldLevel =
    side === "attacker"
      ? parseInt(document.getElementById("defenderShields").innerText, 10)
      : parseInt(document.getElementById("attackerShields").innerText, 10);

  const rerolledDiceHTML = displayDiceRolls(
    rerolledDice,
    weaponLevel,
    opponentShieldLevel,
    side
  );
  const finalDiceHTML = displayDiceRolls(
    finalRolls,
    weaponLevel,
    opponentShieldLevel,
    side
  );


  // Retrieve uncapped ship counts from hidden fields
const uncappedAttackerShipsBefore = parseInt(
  document.getElementById(`uncappedAttackerShips${roundCounter}`).value,
  10
);
const uncappedDefenderShipsBefore = parseInt(
  document.getElementById(`uncappedDefenderShips${roundCounter}`).value,
  10
);

/*
  let attackerShipsBefore = parseInt(
    document.getElementById("attackerShips").innerText,
    10
  );
  let defenderShipsBefore = parseInt(
    document.getElementById("defenderShips").innerText,
    10
  );
*/
  // Use uncapped values for calculations
let attackerShipsBefore = uncappedAttackerShipsBefore;
let defenderShipsBefore = uncappedDefenderShipsBefore;

  let originalHits = 0;
  for (let i = 0; i < unmodifiedOriginalRolls.length; i++) {
    if (unmodifiedOriginalRolls[i] >= 6 - weaponLevel + opponentShieldLevel) {
      originalHits++;
    }
  }

  let finalHits = 0;
  for (let i = 0; i < finalRolls.length; i++) {
    if (finalRolls[i] >= 6 - weaponLevel + opponentShieldLevel) {
      finalHits++;
    }
  }

  let changeInHitsFromReroll = finalHits - originalHits;
  
  let defenderShipsRemaining, attackerShipsRemaining;
  if (side === "attacker") {
    defenderShipsRemaining = Math.max(
      0,
      defenderShipsBefore - changeInHitsFromReroll
    );
    document.getElementById("defenderShips").innerText = defenderShipsRemaining;
  } else {
    attackerShipsRemaining = Math.max(
      0,
      attackerShipsBefore - changeInHitsFromReroll
    );
    document.getElementById("attackerShips").innerText = attackerShipsRemaining;
  }



  let roundSummary = "";
  if (side === "attacker") {
    const isStarbaseActive = !document.getElementById("starbaseButton").classList.contains("frosted");
    const starbaseText = isStarbaseActive ? " (+base)" : "";
    roundSummary = `<small style="color:grey;">Defender: ${defenderShipsBefore} Ships${starbaseText} | <b>${changeInHitsFromReroll}</b> Lost | ${defenderShipsRemaining} Remaining</small>`;
  } else {
    roundSummary = `<small style="color:grey;">Attacker: ${attackerShipsBefore} Ships | <b>${changeInHitsFromReroll}</b> Lost | ${attackerShipsRemaining} Remaining</small>`;
  }

  const rerollResultHTML = `
    <p>
      Rerolled Dice Results (${
        rerolledDice.length
      } rerolled) - <span class="successful-hit">${changeInHitsFromReroll} Hit</span>
      <br/>
      ${rerolledDiceHTML}
    </p>
    <p>
      <strong>Round ${
        roundCounter
      } Final (Post Reroll) - ${capitalizeFirstLetter(
    side
  )} - <span class="successful-hit">${finalHits} Hit</span></strong>
      <br />
      ${roundSummary}
      <br/>
      ${finalDiceHTML}
    </p>
  `;

  rerollQueueElement.insertAdjacentHTML("beforeend", rerollResultHTML);

  const rerollButton = document.querySelector(
    `.reroll-button[data-side="${side}"][data-round="${roundCounter}"]`
  );
  if (rerollButton) {
    rerollButton.style.display = "none";
  }
  scrollToElement(roundCounter, side);
}

document.addEventListener("DOMContentLoaded", function() {
  const starbaseButton = document.getElementById("starbaseButton");
  const starbaseDieCount = starbaseButton.querySelector(".starbase-die-count");

  starbaseButton.addEventListener("click", function() {
    if (starbaseButton.classList.contains("frosted")) {
      starbaseButton.classList.remove("frosted");
      starbaseDieCount.textContent = "+1 die";
    } else {
      starbaseButton.classList.add("frosted");
      starbaseDieCount.textContent = "+0 die";
    }
    
    updateStats();//update the win probabilities after starbase on/off changes
  });
});



function calculateExpectedHits(ships, weaponLevel, opponentShieldLevel, hasStarbase = false) {
  let expectedHits = 0;
  let hitProbability = (7 - (6 - weaponLevel + opponentShieldLevel)) / 6;

    // If there's a starbase and at least one ship, add an extra die roll
    if (hasStarbase && ships > 0) {
      ships += 1;
  }
  expectedHits = ships * hitProbability;

  return expectedHits;
}


//Secttions below to give stats prior to rolling
function calculateWinProbability(attackerShips, defenderShips, attackerExpectedHits, defenderExpectedHits) {
  let attackerWinProb = 0;
  let defenderWinProb = 0;

  if (attackerExpectedHits > defenderShips && defenderExpectedHits < attackerShips) {
      attackerWinProb = 100;
  } else if (defenderExpectedHits > attackerShips && attackerExpectedHits < defenderShips) {
      defenderWinProb = 100;
  } else {
      let totalHits = attackerExpectedHits + defenderExpectedHits;
      attackerWinProb = (attackerExpectedHits / totalHits) * 100;
      defenderWinProb = 100 - attackerWinProb;
  }

  return {
      attacker: attackerWinProb,
      defender: defenderWinProb
  };
}

function updateStats() {
  let attackerShips = parseInt(document.getElementById("attackerShips").innerText, 10);
  let defenderShips = parseInt(document.getElementById("defenderShips").innerText, 10);
  const attackerWeapons = parseInt(document.getElementById("attackerWeapons").innerText, 10);
  const defenderWeapons = parseInt(document.getElementById("defenderWeapons").innerText, 10);
  const attackerShields = parseInt(document.getElementById("attackerShields").innerText, 10);
  const defenderShields = parseInt(document.getElementById("defenderShields").innerText, 10);

  // Check if the starbase is active
  const isStarbaseActive = !document.getElementById("starbaseButton").classList.contains("frosted");

  let attackerExpectedHits = calculateExpectedHits(attackerShips, attackerWeapons, defenderShields);
  let defenderExpectedHits = calculateExpectedHits(defenderShips, defenderWeapons, attackerShields, isStarbaseActive);

  let winProbabilities = calculateWinProbability(attackerShips, defenderShips, attackerExpectedHits, defenderExpectedHits);

  document.getElementById("attackerExpectedHits").innerText = attackerExpectedHits.toFixed(2);
  document.getElementById("defenderExpectedHits").innerText = defenderExpectedHits.toFixed(2);
  document.getElementById("attackerWinProb").innerText = winProbabilities.attacker.toFixed(2) + '%';
  document.getElementById("defenderWinProb").innerText = winProbabilities.defender.toFixed(2) + '%';
}

updateStats();