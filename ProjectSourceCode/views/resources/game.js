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
    deleteLetter()
});
//for the enter key
document.querySelector(".keyboard-key-enter").addEventListener("click", () => {
    //call submit word function
    submitword();
})