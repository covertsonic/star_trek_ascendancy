updateDiceSection(); //load the dice graphics at the top

//set the eventlisteners for scrolling on small screens
document
  .getElementById("simulateNextRoundButton")
  .addEventListener("click", scrollToResults);
document
  .getElementById("simulateCombatButton")
  .addEventListener("click", scrollToResults);

function incrementValue(elementId, incrementBy, max, min) {
  const element = document.getElementById(elementId);
  let currentValue = parseInt(element.innerText, 10);
  currentValue += incrementBy;

  if (currentValue > max) currentValue = max;
  if (currentValue < min) currentValue = min;

  element.innerText = currentValue;
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

let roundCounter = 1;

function simulateDiceRolls() {
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

  let attackerResults = getHits(
    attackerShips,
    attackerWeapons,
    defenderShields
  );
  let defenderResults = getHits(
    defenderShips,
    defenderWeapons,
    attackerShields
  );

  attackerShips = Math.max(0, attackerShips - defenderResults.hits); // Reducing attacker's ships based on defender's hits
  defenderShips = Math.max(0, defenderShips - attackerResults.hits); // Reducing defender's ships based on attacker's hits

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

  // Construct a single row for the round:
  let roundResultHTML = `
<div class="row mt-4 round-result" data-round="${roundCounter}">
    <div class="col-sm-6">
    <hr>
        <strong>Round ${roundCounter} - Attacker - <span class="successful-hit">${
    attackerResults.hits
  } Hit</strong></span>
        <br/><small style="color:grey;">Attacker Ships: ${
          document.getElementById("attackerShips").innerText
        } Ships | ${defenderResults.hits} Lost |  ${attackerShips} Remaining
        <br/>Defender Ships: ${
          document.getElementById("defenderShips").innerText
        } Ships | <b>${
    attackerResults.hits
  }</b> Lost | ${defenderShips} Remaining</small>
        <br/>
        ${attackerDiceHTML}
        
    </div>
    <div class="col-sm-6">
    <div class="reroll-queue attacker-reroll-queue"></div>
</div>
    
    <div class="col-sm-6">
    <hr>
        <strong>Round ${roundCounter} - Defender - <span class="successful-hit">${
    defenderResults.hits
  } Hit</strong></span>
        <br/><small style="color:grey;">Defender Ships: ${
          document.getElementById("defenderShips").innerText
        } Ships | ${attackerResults.hits} Lost |  ${defenderShips} Remaining
        <br/>Attacker Ships: ${
          document.getElementById("attackerShips").innerText
        } Ships | <b>${
    defenderResults.hits
  }</b> Lost | ${attackerShips} Remaining</small>
        <br/>
        ${defenderDiceHTML}
        
    </div>



    <div class="col-sm-6">
    <div class="reroll-queue defender-reroll-queue"></div>
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

  // Add click events to the dice in the new round
  const newRoundDice = newRoundElement.querySelectorAll(".rolled-die");

  newRoundDice.forEach((diceElement) => {
    diceElement.addEventListener("click", function () {
      //console.log("Dice clicked");  // Debugging line
      const side = this.getAttribute("data-side");
      const value = parseInt(this.getAttribute("data-value"), 10);
      queueReroll(side, value, this);
    });
  });

  // Update ship counts for the next round:
  document.getElementById("attackerShips").innerText = attackerShips;
  document.getElementById("defenderShips").innerText = defenderShips;

  // Increment round counter
  roundCounter++;

  // Hide the Simulate Combat button and show the next two
  document.getElementById("simulateCombatButton").style.display = "none";
  document.getElementById("simulateNextRoundButton").style.display = "block";
  document.getElementById("resetCombatButton").style.display = "block";
}

function continueToNextRound() {
  // Using the same function, as it already displays the results properly
  simulateDiceRolls();

  //Clear the rerollQueue and related UI elements
  rerollQueue = { attacker: {}, defender: {} };
}
function resetCombat() {
  // Reset the round counter
  roundCounter = 1;

  //Reset ship counts back to 3
  document.getElementById("attackerShips").innerHTML = "3";
  document.getElementById("defenderShips").innerHTML = "3";

  // Clear the dice roll results
  document.getElementById("attackerResults").innerHTML = "";

  // Show the Simulate Combat button and hide the other two
  document.getElementById("simulateCombatButton").style.display = "block";
  document.getElementById("simulateNextRoundButton").style.display = "none";
  document.getElementById("resetCombatButton").style.display = "none";

  //Clear the rerollQueue and related UI elements
  rerollQueue = { attacker: {}, defender: {} };
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

    output += `<span class="fa-stack ${potentialHitClass} ${rolledClass} ${successfulHitClass} dice-clickable" data-side="${side}" data-value="${diceValue}" data-round="${roundCounter}">
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

function getDiceFaceHTML(number, status) {
  const color = status === "hit" ? "#007bff" : "grey";
  let iconClass = "";

  switch (number) {
    case 1:
      iconClass = "fa-dice-one";
      break;
    case 2:
      iconClass = "fa-dice-two";
      break;
    case 3:
      iconClass = "fa-dice-three";
      break;
    case 4:
      iconClass = "fa-dice-four";
      break;
    case 5:
      iconClass = "fa-dice-five";
      break;
    case 6:
      iconClass = "fa-dice-six";
      break;
  }

  return `<span class="dice ${status}" style="color: ${color};"><i class="fas ${iconClass}"></i></span>`;
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
function scrollToResults() {
  var windowHeight =
    window.innerHeight ||
    document.documentElement.clientHeight ||
    document.body.clientHeight;

  var button = document.getElementById("simulateNextRoundButton");
  var rect = button.getBoundingClientRect();

  var remainingSpace = windowHeight - rect.bottom;

  //console.log("height: " + windowHeight);
  //console.log("remaining space: " + remainingSpace);

  // Check if the remaining space is less than or equal to 400
  if (remainingSpace <= 400) {
    // Scroll to the round results section
    button.scrollIntoView({ behavior: "smooth" });
  }
}

let rerollQueue = { attacker: {}, defender: {} };

function queueReroll(side, diceValue, clickedElement) {
  // Check if the clicked die's round matches the current round
  const dieRound = parseInt(clickedElement.getAttribute("data-round"), 10);

  if (dieRound !== roundCounter - 1) {
    //roundcounter will be at 2 when the first round die is clicked
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

  console.log("queueRoll is calling the URQUI.");
  updateRerollQueueUI(side);
}

// Helper function to capitalize the first letter of a string
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function numberToWord(number) {
  const words = ["one", "two", "three", "four", "five", "six"];
  return words[number - 1];
}

function updateRerollQueueUI(side) {
  console.log("starting the creation of the button; updatererollqueueui.");
  const currentRoundElement = document.querySelector(
    `.round-result[data-round="${roundCounter - 1}"]`
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
}

/**
 * Event listener for click events within the reroll queue and the original dice.
 * This actually is attached to all click events.
 * - Adds dice to the reroll queue when clicked within the original dice.
 * - Removes dice from the reroll queue when clicked within the reroll queue.
 */
// Add a global click event listener
document.addEventListener("click", function (event) {
  console.log("Click event triggered");

  // Determine if the click is within the reroll queue first
  if (event.target.closest(".reroll-queue")) {
    console.log("Inside reroll queue");
    const dieElement = event.target.closest(".fa-stack");
    if (dieElement === null) {
      console.log("No die element found in reroll queue.");
      return; // Exit if no die element is found
    }

    const dieValue = parseInt(dieElement.getAttribute("data-value"), 10);
    const side = dieElement
      .closest(".reroll-queue")
      .classList.contains("attacker-reroll-queue")
      ? "attacker"
      : "defender";

    const rerollButton = document.querySelector(
      `.reroll-button[data-side="${side}"]`
    );
    console.log(
      "Reroll button display:",
      rerollButton ? rerollButton.style.display : "Button not found"
    );

    if (rerollButton && rerollButton.style.display === "none") {
      console.log("Reroll button is not visible. Exiting...");
      return; // Do not proceed with reroll if the reroll button is not visible
    }

    if (rerollQueue[side][dieValue] > 0) {
      console.log(
        `Decrementing rerollQueue for ${side} and dieValue ${dieValue}`
      );
      rerollQueue[side][dieValue]--;
      console.log("successfully calling URQUI.");
      updateRerollQueueUI(side);
    }
    return; // Exit the function after handling reroll queue click
  }

  // For original dice
  const dieElement = event.target.closest(".fa-stack");
  if (dieElement !== null) {
    console.log("Inside original dice");
    const dieRound = parseInt(dieElement.getAttribute("data-round"), 10);
    // Adjusting the roundCounter by -1
    if (dieRound !== roundCounter && dieRound !== roundCounter - 1) {
      console.log("Round mismatch. Exiting...");
      return;
    }

    const dieValue = parseInt(dieElement.getAttribute("data-value"), 10);
    const side = dieElement.getAttribute("data-side");

    const rerollButton = document.querySelector(
      `.reroll-button[data-side="${side}"]`
    );
    console.log(
      "Reroll button display:",
      rerollButton ? rerollButton.style.display : "Button not found"
    );

    if (rerollButton && rerollButton.style.display === "none") {
      console.log("Reroll button is not visible. Exiting...");
      return; // Do not proceed with reroll if the reroll button is not visible
    }

    // If the click is within the original dice
    if (event.target.closest(".col-sm-6")) {
      console.log("Inside col-sm-6");
      // Get the current count of this die value
      const countElement = dieElement.querySelector(".fa-inverse");
      const currentCount = countElement
        ? parseInt(countElement.textContent.replace("x", "") || "1", 10)
        : 1;

      // Get the current reroll count for this die value
      const rerollCount = rerollQueue[side][dieValue] || 0;

      // If the current count is greater than the reroll count, queue the reroll
      if (currentCount > rerollCount) {
        console.log(`Queueing reroll for ${side} and dieValue ${dieValue}`);
        queueReroll(side, dieValue, dieElement);
        console.log("another successful call to URQUI.");
        updateRerollQueueUI(side);
      }
    }
  } else {
    console.log("dieElement is null");
  }
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
    `.round-result[data-round="${roundCounter - 1}"]`
  );
  const rerollQueueElement = currentRoundElement.querySelector(
    `.${side}-reroll-queue`
  );
  const allStrongElements = Array.from(
    currentRoundElement.querySelectorAll(".col-sm-6 > strong")
  );
  const originalRollsElement = allStrongElements.find((el) =>
    el.textContent.includes(capitalizeFirstLetter(side))
  ).parentElement;

  let originalRolls = [];

  // ------------- CODE FOR GATHERING ORIGINAL ROLLS AND REROLLING --------------------
  // Only select dice that have the 'rolled-die' class
  const dieElements = Array.from(
    originalRollsElement.querySelectorAll(".fa-stack.rolled-die")
  );
  dieElements.forEach((dieElement) => {
    const dieValue = parseInt(dieElement.getAttribute("data-value"), 10);
    const countElement = dieElement.querySelector(".fa-inverse");
    const count = countElement
      ? parseInt(countElement.textContent.replace("x", "") || "1", 10)
      : 1;
    for (let i = 0; i < count; i++) {
      originalRolls.push(dieValue);
    }
  });

  // Identify which dice were rerolled and remove them from originalRolls
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

  // Combine original and rerolled dice to get the final rolls
  const finalRolls = [...originalRolls, ...rerolledDice];

  // Assuming 'side' is either 'attacker' or 'defender'
  const weaponLevel = parseInt(
    document.getElementById(`${side}Weapons`).innerText,
    10
  );
  const opponentShieldLevel =
    side === "attacker"
      ? parseInt(document.getElementById("defenderShields").innerText, 10)
      : parseInt(document.getElementById("attackerShields").innerText, 10);

  // Update UI with rerolled dice and final dice
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

  // ------------- end of - CODE FOR GATHERING ORIGINAL ROLLS AND REROLLING --------------------

  // Capture the ship counts just before the new reroll hits are added
  let attackerShipsBefore = parseInt(
    document.getElementById("attackerShips").innerText,
    10
  );
  let defenderShipsBefore = parseInt(
    document.getElementById("defenderShips").innerText,
    10
  );

  // Calculate the hits from the original rolls
  let originalHits = 0;
  for (let i = 0; i < originalRolls.length; i++) {
    if (originalRolls[i] >= 6 - weaponLevel + opponentShieldLevel) {
      originalHits++;
    }
  }

  // Calculate the hits from the final rolls
  let finalHits = 0;
  for (let i = 0; i < finalRolls.length; i++) {
    if (finalRolls[i] >= 6 - weaponLevel + opponentShieldLevel) {
      finalHits++;
    }
  }

  // Calculate the new hits based on the difference between final and original hits
  let changeInHitsFromReroll = finalHits - originalHits;

  // Update the ship counts based on the new hits
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

  // Prepare the round summary based on the side
  let roundSummary = "";
  if (side === "attacker") {
    roundSummary = `<small style="color:grey;">Defender Ships: ${defenderShipsBefore} Ships | <b>${changeInHitsFromReroll}</b> Lost | ${defenderShipsRemaining} Remaining</small>`;
  } else {
    roundSummary = `<small style="color:grey;">Attacker Ships: ${attackerShipsBefore} Ships | <b>${changeInHitsFromReroll}</b> Lost | ${attackerShipsRemaining} Remaining</small>`;
  }

  // Update the reroll queue UI to include the new hit count and round summary
  const rerollResultHTML = `
    <p>
      Rerolled Dice Results (${
        rerolledDice.length
      } rolled) - <span class="successful-hit">${changeInHitsFromReroll} Hit</span>
      <br/>
      ${rerolledDiceHTML}
    </p>
    <p>
      <strong>Round ${
        roundCounter - 1
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

  // Hide the reroll button
  const rerollButton = document.querySelector(
    `.reroll-button[data-side="${side}"]`
  );
  if (rerollButton) {
    rerollButton.style.display = "none";
  }
}
