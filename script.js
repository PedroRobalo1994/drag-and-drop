/**
 * Kanban Board JavaScript
 * This file contains all the functionality for the Kanban board including
 * drag and drop, local storage management, and DOM manipulation.
 */

// DOM Elements
const addBtns = document.querySelectorAll(".add-btn:not(.solid)");
const saveItemBtns = document.querySelectorAll(".solid");
const addItemContainers = document.querySelectorAll(".add-container");
const addItems = document.querySelectorAll(".add-item");

// Item Lists
const listColumns = document.querySelectorAll(".drag-item-list");
const backlogList = document.getElementById("backlog-list");
const progressList = document.getElementById("progress-list");
const completeList = document.getElementById("complete-list");
const onHoldList = document.getElementById("on-hold-list");

// Items
let updatedOnLoad = false;

// Initialize Arrays
let backlogListArray = [];
let progressListArray = [];
let completeListArray = [];
let onHoldListArray = [];
let listArrays = [];

// Drag Functionality
let draggedItem;
let currentColumn;

const MAX_CHARS = 100; // Maximum characters per task

/**
 * Safely parses JSON data with error handling
 * @param {string} data - JSON string to parse
 * @returns {any} Parsed data or null if invalid
 */
function safeJSONParse(data) {
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error('Error parsing JSON:', e);
    return null;
  }
}

/**
 * Retrieves saved columns data from localStorage
 * If no data exists, initializes with default values
 */
function getSavedColumns() {
  try {
    if (localStorage.getItem("backlogItems")) {
      backlogListArray = safeJSONParse(localStorage.backlogItems) || [];
      progressListArray = safeJSONParse(localStorage.progressItems) || [];
      completeListArray = safeJSONParse(localStorage.completeItems) || [];
      onHoldListArray = safeJSONParse(localStorage.onHoldItems) || [];
    } else {
      backlogListArray = ["Release the course", "Sit back and relax"];
      progressListArray = ["Work on projects", "Listen to music"];
      completeListArray = ["Being cool", "Getting stuff done"];
      onHoldListArray = ["Being uncool"];
    }
  } catch (e) {
    console.error('Error accessing localStorage:', e);
    // Fallback to default values if localStorage fails
    backlogListArray = ["Release the course", "Sit back and relax"];
    progressListArray = ["Work on projects", "Listen to music"];
    completeListArray = ["Being cool", "Getting stuff done"];
    onHoldListArray = ["Being uncool"];
  }
}

/**
 * Updates localStorage with current array values
 * Maps array data to corresponding localStorage keys
 */
function updateSavedColumns() {
  try {
    listArrays = [backlogListArray, progressListArray, completeListArray, onHoldListArray];
    const arrayNames = ["backlog", "progress", "complete", "onHold"];
    arrayNames.forEach((name, index) => {
      localStorage.setItem(`${name}Items`, JSON.stringify(listArrays[index]));
    });
  } catch (e) {
    console.error('Error saving to localStorage:', e);
  }
}

/**
 * Filters out null values from arrays
 * @param {Array} array - The array to filter
 * @returns {Array} Filtered array without null values
 */
function filterArray(array) {
  return array.filter(item => item !== null);
}

/**
 * Validates item text length and provides UI feedback
 * @param {string} text - The text to validate
 * @returns {boolean} Whether the text is valid
 */
function validateItemText(text) {
  if (text.length > MAX_CHARS) {
    alert(`Task text cannot exceed ${MAX_CHARS} characters`);
    return false;
  }
  if (text.trim().length === 0) {
    return false;
  }
  return true;
}

/**
 * Creates a new draggable list item
 * @param {HTMLElement} columnEl - The column element to add the item to
 * @param {number} column - The column index
 * @param {string} item - The item text content
 * @param {number} index - The item's index in the array
 */
function createItemEl(columnEl, column, item, index) {
  const listEl = document.createElement("li");
  listEl.classList.add("drag-item");
  listEl.textContent = item;
  listEl.draggable = true;
  listEl.setAttribute("ondragstart", "drag(event)");
  listEl.contentEditable = true;
  listEl.id = index;
  listEl.setAttribute("onfocusout", `updateItem(${index}, "${column}")`);
  
  // Add character count display
  listEl.addEventListener('input', (e) => {
    const text = e.target.textContent;
    if (text.length > MAX_CHARS) {
      e.target.textContent = text.substring(0, MAX_CHARS);
      alert(`Task text cannot exceed ${MAX_CHARS} characters`);
    }
  });

  // Add visual feedback for dragging
  listEl.addEventListener('dragstart', () => {
    listEl.classList.add('dragging');
  });
  
  listEl.addEventListener('dragend', () => {
    listEl.classList.remove('dragging');
  });
  
  columnEl.appendChild(listEl);
}

/**
 * Updates the DOM with current array values
 * Handles initial load and subsequent updates
 */
function updateDOM() {
  // Check localStorage once
  if (!updatedOnLoad) getSavedColumns();
  // Backlog Column
  backlogList.textContent = "";
  backlogListArray.forEach((backlogItem, index) => {
    createItemEl(backlogList, 0, backlogItem, index);
  });

  // Progress Column
  progressList.textContent = "";
  progressListArray.forEach((progressItem, index) => {
    createItemEl(progressList, 1, progressItem, index);
  });

  // Complete Column
  completeList.textContent = "";
  completeListArray.forEach((completeItem, index) => {
    createItemEl(completeList, 2, completeItem, index);
  });

  // On Hold Column
  onHoldList.textContent = "";
  onHoldListArray.forEach((onHoldItem, index) => {
    createItemEl(onHoldList, 3, onHoldItem, index);
  });

  // Filter Arrays
  backlogListArray = filterArray(backlogListArray);
  progressListArray = filterArray(progressListArray);
  completeListArray = filterArray(completeListArray);
  onHoldListArray = filterArray(onHoldListArray);

  // Run getSavedColumns only once, Update Local Storage
  updatedOnLoad = true;
  updateSavedColumns();
}

/**
 * Updates an item's content after editing
 * @param {number} index - The item's index
 * @param {number} column - The column index
 */
function updateItem(index, column) {
  const selectedArray = listArrays[column];
  const selectedColumnEl = listColumns[column].children;
  
  // Skip update if the item is currently being dragged
  if (selectedColumnEl[index] === draggedItem) {
    return;
  }

  if (!selectedColumnEl[index].textContent) {
    delete selectedArray[index];
  } else {
    selectedArray[index] = selectedColumnEl[index].textContent;
  }
  updateDOM();
}

/**
 * Shows the input box for adding new items
 * @param {number} column - The column index
 */
function showInputBox(column) {
  addBtns[column].style.visibility = "hidden";
  saveItemBtns[column].style.display = "flex";
  addItemContainers[column].style.display = "flex";
}

/**
 * Hides the input box and processes the new item
 * @param {number} column - The column index
 */
function hideInputBox(column) {
  addBtns[column].style.visibility = "visible";
  saveItemBtns[column].style.display = "none";
  addItemContainers[column].style.display = "none";
  addToColumn(column);
}

/**
 * Adds a new item to the specified column
 * @param {number} column - The column index
 */
function addToColumn(column) {
  const itemEl = addItemContainers[column].querySelector(".add-item");
  const item = itemEl.textContent.trim();
  
  if (!validateItemText(item)) {
    itemEl.textContent = "";
    updateDOM();
    return;
  }
  
  listArrays[column].push(item);
  itemEl.textContent = "";
  updateDOM();
}

/**
 * Rebuilds arrays after drag and drop operations
 * Updates localStorage with new array values
 */
function rebuildArrays() {
  backlogListArray = [];
  progressListArray = [];
  completeListArray = [];
  onHoldListArray = [];

  for (const child of backlogList.children) {
    backlogListArray.push(child.textContent);
  }
  for (const child of progressList.children) {
    progressListArray.push(child.textContent);
  }
  for (const child of completeList.children) {
    completeListArray.push(child.textContent);
  }
  for (const child of onHoldList.children) {
    onHoldListArray.push(child.textContent);
  }
  updateDOM();
}

/**
 * Handles the drag start event
 * @param {DragEvent} e - The drag event
 */
function drag(e) {
  draggedItem = e.target;
}

/**
 * Allows dropping of items in columns
 * @param {DragEvent} e - The drag event
 */
function allowDrop(e) {
  e.preventDefault();
}

/**
 * Handles the drop event
 * @param {DragEvent} e - The drop event
 */
function drop(e) {
  e.preventDefault();
  // Remove Background Color/Padding
  listColumns.forEach((column) => {
    column.classList.remove("over");
  });
  // Add item to Column
  const parent = listColumns[currentColumn];
  parent.appendChild(draggedItem);
  rebuildArrays(); // Update arrays and localStorage after drop
}

/**
 * Handles when an item enters a column during drag
 * @param {number} column - The column index
 */
function dragEnter(column) {
  listColumns[column].classList.add("over");
  currentColumn = column;
}

// Initialize on load
updateDOM();
