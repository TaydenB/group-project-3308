/*Select the Tiles*/
const rows = document.querySelectorAll("#game-board .row");
let selected_row = 0;
let tile = 0;

/*Create the implementation for the keyboard*/
document.querySelectorAll(".keyboard-key").forEach(key => {
    key.addEventListener("click", () => {
        const letter = key.textContent.trim();
        addLetter(letter);
    })
})
