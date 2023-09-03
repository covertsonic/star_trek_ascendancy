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
        <hr>
    </div>

    
    <div class="col-sm-6">
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
        <hr>
    </div>

    <div class="col-sm-6">
    <div class="reroll-queue attacker-reroll-queue"></div>
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
  const previousRounds = document.querySelectorAll('.round-result[data-round]:not([data-round="' + roundCounter + '"]) .dice-clickable');
  previousRounds.forEach((diceElement) => {
    diceElement.classList.remove("dice-clickable");
  });

  // Add click events to the dice in the new round
  const newRoundDice = newRoundElement.querySelectorAll('.rolled-die');

  newRoundDice.forEach((diceElement) => {
    diceElement.addEventListener("click", function() {
      const side = this.getAttribute("data-side");
      const value = parseInt(this.getAttribute("data-value"), 10);
      queueReroll(side, value);
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
}

function displayDiceRolls(rolls, weaponLevel, opponentShieldLevel,side) {
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

      output += `<span class="fa-stack ${potentialHitClass} ${rolledClass} ${successfulHitClass} dice-clickable" data-side="${side}" data-value="${diceValue}">
      <i class="fa-solid fa-dice-${diceNames[i]} fa-stack-1x"></i>
      <span class="fa-stack-1x fa-inverse ${side}-dice-result-count" data-value="${diceValue}">${counts[diceValue] ? "x" + counts[diceValue] : ""}</span>
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



function queueReroll(side, diceValue) {
  if (!rerollQueue[side][diceValue]) {
    rerollQueue[side][diceValue] = 0;
  }

  // Find the correct round element based on the side (attacker or defender)
  const currentRoundElement = document.querySelector(
    `.round-result[data-round="${roundCounter - 1}"]`
  );

  if (!currentRoundElement) {
    console.log("Current round element not found.");
    return;
  }


  const diceCountElement = currentRoundElement.querySelector(
    `.fa-stack[data-side="${side}"][data-value="${diceValue}"] .fa-inverse`
  );

  if (!diceCountElement) {
    console.log("Dice count element not found.");
    return;
  }

  const diceCountText = diceCountElement.textContent.replace('x', ''); // Remove the 'x' prefix
  const diceCount = diceCountText ? parseInt(diceCountText, 10) : 0; // If no text, assume zero

  if (rerollQueue[side][diceValue] < diceCount) {
    rerollQueue[side][diceValue]++;
    updateRerollQueueUI(side);
  }
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
  rerollQueueElement.innerHTML = '';

// Add "Reroll Queue" label
const label = document.createElement('small');
label.style.color = 'grey';
label.style.marginBottom = '5px';  // Adjust this value for desired spacing
label.textContent = 'Reroll Queue: ';
rerollQueueElement.insertBefore(label, rerollQueueElement.firstChild);
// Add line break
const lineBreak = document.createElement('br');
rerollQueueElement.insertBefore(lineBreak, label.nextSibling);

  // Loop through 1 to 6 to create new dice elements
  for (let diceValue = 1; diceValue <= 6; diceValue++) {
    const count = rerollQueue[side][diceValue] || 0;
    const diceElement = document.createElement('span');
    diceElement.className = `fa-stack dice-clickable ${count > 0 ? 'reroll-dice' : 'default-die'}`; 
    diceElement.dataset.value = diceValue;
    diceElement.dataset.count = count;

    const diceIcon = document.createElement('i');
    const wordValue = numberToWord(diceValue);
    diceIcon.className = `fa-solid fa-dice-${wordValue} fa-stack-1x`; 
    diceElement.appendChild(diceIcon);

    if (count > 0) {
      const diceCount = document.createElement('span');
      diceCount.className = 'fa-stack-1x fa-inverse-reroll';
      diceCount.textContent = `x${count}`;
      diceElement.appendChild(diceCount);
    }

    rerollQueueElement.appendChild(diceElement);
  }
}



