/*Select the Tiles*/
const rows = document.querySelectorAll("#game-board .row");
let selected_row = 0;
let tile = 0;

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
    submitword();
});

/*Create the functions to make the keys function*/
//Add Letter function that adds a letter into the tile
function addLetter(letter) {
    //if within the row
    if (tile < 5){
        //pick the correct tile
        const current_tile = rows[selected_row].children[tile];
        //put the letter in the tile
        current_tile.textContent = letter;
        tile++;
    }
}
