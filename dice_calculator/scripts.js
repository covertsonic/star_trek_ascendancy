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
    defenderShields
  );
  let defenderDiceHTML = displayDiceRolls(
    defenderResults.rolls,
    defenderWeapons,
    attackerShields
  );

  // Construct a single row for the round:
  let roundResultHTML = `
<div class="row mt-4">
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
</div>
`;

  // Append this row to the main results container
  const mainResultsContainer = document.getElementById("attackerResults");
  mainResultsContainer.insertAdjacentHTML("afterbegin", roundResultHTML);

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

function displayDiceRolls(rolls, weaponLevel, opponentShieldLevel) {
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

    output += `<span class="fa-stack ${potentialHitClass} ${rolledClass} ${successfulHitClass}" style="font-size: 24px;">
                        <i class="fa-solid fa-dice-${
                          diceNames[i]
                        } fa-stack-1x"></i>
                        <span class="fa-stack-1x fa-inverse">${
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

//for the dice in the header:
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

  document.getElementById("attackerDiceSection").innerHTML = generateDiceHTML(
    attackerHitNumber
  );
  document.getElementById("defenderDiceSection").innerHTML = generateDiceHTML(
    defenderHitNumber
  );
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

  console.log("height: " + windowHeight);
  console.log("remaining space: " + remainingSpace);

  // Check if the remaining space is less than or equal to 400
  if (remainingSpace <= 400) {
    // Scroll to the round results section
    button.scrollIntoView({ behavior: "smooth" });
  }
}
