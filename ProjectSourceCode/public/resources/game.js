/*Select the Tiles*/
const rows = document.querySelectorAll("#game-board .row");
let selected_row = 0;
let tile = 0;
max_tiles = 5;

/*Create the implementation for the keyboard*/
//for all keyboard-key classes
document.querySelectorAll(".keyboard-key").forEach(key => {
    //if you click on any of the keyboard buttons
    key.addEventListener("click", () => {
        //store the contents of the button in letter
        const letter = key.textContent.trim();
        //call addLetter function
        addLetter(letter);
    });
});

//for the delete key
document.querySelector(".keyboard-key-delete").addEventListener("click", () => {
    //call deleteLetter function
    deleteLetter();
});

//for the enter key
document.querySelector(".keyboard-key-enter").addEventListener("click", () => {
    //call submit word function
    submitWord();
});

/*Create the functions to make the keys function*/
//addLetter function that adds a letter into the tile
function addLetter(letter) {
    //if within the row
    if (tile < max_tiles){
        //pick the correct tile
        const current_tile = rows[selected_row].children[tile];
        //put the letter in the tile
        current_tile.textContent = letter;
        //increment tile count
        tile++;
    }
}

//deleteLetter function that removes a letter from the tile
function deleteLetter() {
    //if there is a value to delete
    if (tile > 0) {
        //decrement the tile count
        tile--;
        //pick correct tile
        const current_tile = rows[selected_row].children[tile];
        //remove the letter from the tile
        current_tile.textContent = "";
    }
}

//submitWord function that enters the word
function submitWord() {
    //if not enough letters nothing happens
    if (tile < max_tiles) {
        return;
    }
    //word variable to store values in tiles
    let word = "";
    //loop through tiles and store in variable word
    for (let i=0; i < max_tiles; i++) {
        word += rows[selected_row].children[i].textContent;
    }
    //get answer from database
    let answer = "";
    //compare letters in word to letters in answer

    //change rows
    if (selected_row < 5) {
        //increment row
        selected_row++;
        //start on first tile again
        tile = 0;
    }
}
