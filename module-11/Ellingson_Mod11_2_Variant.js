/*
 * CSD340: Web Development
 * Module 11.2 Assignment: JavaScript Exercise, Part 3 - Variant
 * Isaac Ellingson
 * 3/3/2026
 */

/**
 * Required function: Add an element to an array
 */
function addElementToArray(arr, elem) {
    // push returns the new length of the array, which is the same
    // as the 1-indexed position of the new item
    return arr.push(elem);
}

/**
 * Required function: Delete an element from an array.
 *
 * elem will be interpreted as a value to search for and remove.
 */
function deleteElementFromArray(arr, elem) {
    let index = arr.indexOf(elem);
    if (index == -1) return;

    arr.splice(index, 1);
}

function deleteElementByIndex(arr, index) {
    let removed = arr[index];
    arr.splice(index, 1);
    return removed;
}

function deleteLastElementFromArray(arr) {
    return arr.pop();
}

/**
 * Required function: Display the contents of an array
 */
function displayContentsOfArray(arr) {
    let msg = "TODO:";
    for(item of arr) {
        msg = msg + "\n  " + item;
    }

    alert(msg);
}

/**
 * Required function: Sort an array
 */
function sortArray(arr) {
    arr.sort();
}





// PAGE FUNCTIONALITY
var todo_list = [];

/**
 * Updates the "ul" and "options" elements on the page to be consistent with the array.
 */
function updateLists() {
    let newChildren = [];
    let options = [];

    for(item of todo_list) {
        const cur = document.createElement("li");
        cur.textContent = item;
        newChildren.push(cur);

        const opt = document.createElement("option");
        opt.textContent = item;
        options.push(opt);
    }

    // This spread operator took me a while to figure out!
    document.getElementById("todo").replaceChildren(...newChildren);
    document.getElementById("todo-delete").replaceChildren(...options);
}

function onAddButton() {
    let toAdd = document.getElementById("entry-box").value;
    if (toAdd.length == 0) return;
    let index = addElementToArray(todo_list, toAdd);
    document.getElementById("entry-box").value = "";
    updateLists();
}

function onDeleteLastButton() {
    if (todo_list.length == 0) {
        return;
    }

    let deleted = deleteLastElementFromArray(todo_list);
    updateLists();
}

function onDeleteSelectedButton() {
    if (todo_list.length == 0) {
        return;
    }

    let index = document.getElementById("todo-delete").selectedIndex;
    let deleted = deleteElementByIndex(todo_list, index);
    updateLists();
}

function onSortButton() {
    sortArray(todo_list);
    updateLists();
}
